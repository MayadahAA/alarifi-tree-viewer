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

// الـ LLM يحوّل وصف الشخص لفلاتر فقط. ما يشوف بيانات الشجرة ولا يجاوب من عنده.
const TOOL = {
  name: "find_person",
  description: "استخرج مما كتبه المستخدم الحقول المذكورة صراحةً فقط عن الشخص المطلوب. لا تخمّن ولا تضف حقلًا غير مذكور.",
  input_schema: {
    type: "object",
    properties: {
      first_name: { type: "string", description: "اسم الشخص نفسه فقط، بدون بن/أبيه" },
      father_name: { type: "string", description: "اسم أبيه إن ذُكر (فلان بن X)" },
      grandfather_name: { type: "string", description: "اسم جده إن ذُكر" },
      main_branch: { type: "string", enum: ["محمد", "خلف", "سعد", "ناصر"], description: "الفرع الرئيسي: «من آل X» أو «من فرع X»" },
      has_children: { type: "boolean", description: "true إذا ذُكر أن له أولادًا/عيالًا، false إذا ذُكر أنه بلا عقب" },
      alive: { type: "boolean", description: "true حي، false متوفى" },
      married: { type: "boolean", description: "true متزوج، false أعزب" },
    },
  },
};

async function chat(d, env, origin) {
  const text = String(d.text || "").trim().slice(0, 300);
  if (text.length < 2) return reply({ ok: false, err: "empty" }, 400, origin);
  if (!(await human(d.token, env))) return reply({ ok: false, err: "captcha" }, 403, origin);

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 250,
      system: "أنت تساعد في تحديد شخص في شجرة عائلة. حوّل وصف المستخدم إلى فلاتر عبر الأداة فقط. الاسم المذكور قبل «بن» هو اسم الشخص، وما بعده أبوه ثم جده. لا تضف أي معلومة لم تُذكر.",
      tools: [TOOL],
      tool_choice: { type: "tool", name: "find_person" },
      messages: [{ role: "user", content: text }],
    }),
  });
  if (!r.ok) return reply({ ok: false, err: "llm" }, 502, origin);
  const j = await r.json();
  const f = (j.content || []).find((c) => c.type === "tool_use");
  return reply({ ok: true, filters: f ? f.input : {} }, 200, origin);
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
