/* وسيط الملاحظات المجهولة: يتحقق من Turnstile ويرسل لتيليجرام.
   ما يقرأ ولا يسجّل IP أو أي header يعرّف المرسل. */

const ALLOWED = ["https://www.aburakan.org", "https://aburakan.org", "http://localhost:8000", "http://127.0.0.1:8000"];

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function reply(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin) },
  });
}

// Turnstile: بدون تمرير IP للتحقق، عشان ما يوصل لـ Cloudflare أي ربط إضافي
async function human(token, env) {
  const v = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(token || "") }),
  }).then((r) => r.json()).catch(() => ({}));
  return !!v.success;
}

// الـ LLM (GLM) يحوّل وصف الشخص لفلاتر فقط. ما يشوف بيانات الشجرة ولا يجاوب من عنده.
const SYSTEM = `أنت تساعد في تحديد شخص في شجرة عائلة. حوّل وصف المستخدم إلى JSON فقط، بدون أي شرح.
الحقول (اذكر فقط ما ورد صراحةً في كلام المستخدم، ولا تخمّن):
- first_name: اسم الشخص نفسه فقط (الاسم قبل «بن»)
- father_name: اسم أبيه
- grandfather_name: اسم جده
- main_branch: واحد من ["محمد","خلف","سعد","ناصر"] («من آل X» أو «من فرع X»)
- has_children: true إذا له أولاد/عيال بدون ذكر عددهم، false إذا بلا عقب
- children_count: عدد الأبناء الذكور رقمًا صحيحًا إذا ذُكر («ولد واحد»=1، «ولدين»=2، «ثلاثة»=3، «بدون»=0)
- alive: true حي، false متوفى
- married: true متزوج، false أعزب
إذا أُعطيت «الفلاتر السابقة» فهذي محادثة مستمرة: أعد JSON كامل محدّثًا، أضف المعلومة الجديدة، وعدّل أو احذف الحقل إذا صحّح المستخدم أو تراجع («لا، هو متوفى»).
مثال: «اسمه أحمد بن محمد وله عيال ومن آل محمد» ->
{"first_name":"أحمد","father_name":"محمد","main_branch":"محمد","has_children":true}`;

// جلسة قصيرة بعد أول تحقق ناجح: توقيع HMAC على وقت الانتهاء، بدون تخزين أي شي عن المستخدم
const SESS_MS = 30 * 60 * 1000;
async function sign(msg, env) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.TURNSTILE_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(s))).replace(/[+/=]/g, "");
}
async function mkSess(env) { const e = String(Date.now() + SESS_MS); return e + "." + (await sign(e, env)); }
async function okSess(s, env) {
  const [e, sig] = String(s || "").split(".");
  return !!sig && Number(e) > Date.now() && sig === (await sign(e, env));
}

async function chat(d, env, origin) {
  const text = String(d.text || "").trim().slice(0, 300);
  if (text.length < 2) return reply({ ok: false, err: "empty" }, 400, origin);
  let sess = "";
  if (!(await okSess(d.sess, env))) {
    if (!(await human(d.token, env))) return reply({ ok: false, err: "captcha" }, 403, origin);
    sess = await mkSess(env);
  }

  const prev = d.prev && typeof d.prev === "object" ? JSON.stringify(d.prev).slice(0, 500) : "";
  const userMsg = prev ? `الفلاتر السابقة: ${prev}\nالرسالة الجديدة: ${text}` : text;

  const r = await fetch(env.GLM_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.GLM_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.GLM_MODEL,
      temperature: 0,
      max_tokens: 250,
      response_format: { type: "json_object" },
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMsg }],
    }),
  });
  if (!r.ok) return reply({ ok: false, err: "llm" }, 502, origin);
  const j = await r.json();
  let f = {};
  try {
    const raw = String(j.choices?.[0]?.message?.content || "");
    f = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  } catch { return reply({ ok: false, err: "parse" }, 502, origin); }
  return reply({ ok: true, filters: f, sess }, 200, origin);
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (req.method !== "POST") return reply({ ok: false }, 405, origin);
    if (!ALLOWED.includes(origin)) return reply({ ok: false }, 403, origin);

    let d;
    try { d = await req.json(); } catch { return reply({ ok: false, err: "bad" }, 400, origin); }

    const path = new URL(req.url).pathname;
    if (path === "/chat") return chat(d, env, origin);

    const text = String(d.text || "").trim().slice(0, 1000);
    const ref = String(d.ref || "").trim().slice(0, 300);
    if (text.length < 3) return reply({ ok: false, err: "empty" }, 400, origin);

    if (!(await human(d.token, env))) return reply({ ok: false, err: "captcha" }, 403, origin);

    const msg = "📝 ملاحظة مجهولة\n" + (ref ? ref + "\n" : "") + "\n" + text;
    const t = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg }),
    });
    return reply({ ok: t.ok }, t.ok ? 200 : 502, origin);
  },
};
