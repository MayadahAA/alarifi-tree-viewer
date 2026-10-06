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

// الـ LLM (GLM) ما يشوف ملف الشجرة. يطلب أدوات، والمتصفح ينفذها على البيانات ويرجّع النتيجة.
const SYSTEM = `أنت مساعد شجرة أسرة العريفي. تجاوب بلهجة سعودية بسيطة ومختصرة.
مصدر الحقيقة والنطاق:
- كل معلومة عن الأشخاص أو الأعداد أو القرابة لازم تجي من الأدوات. لا تخمّن ولا تضف معلومة من النسب أو المعرفة العامة.
- المصدر لوحة «شجرة العريفي ١٤٤٥هـ» وقد تكون تغيرت بعدها. هي شجرة أبوية؛ لا تقل شقيق أو خال أو قرابة من جهة الأم إلا إذا رجعت الأداة ذلك صراحة.
- الأبناء المحسوبون هم الذكور المرسومون في اللوحة.
- أي اسم أو رقم أو قرابة تذكرها لازم يكون موجودًا في نتيجة أداة. لو ما عندك نتيجة تكفي، قل إن المعلومة غير ظاهرة في الشجرة.
- لا تجاوب عن أي موضوع خارج الشجرة.
اختيار الأدوات:
- الاسم الغامض: لو ظهر أكثر من شخص، اسأل المستخدم يحدد باسم الأب أو الجد أو الفرع. الاستثناء: إذا كانت نتيجة واحدة founder_of عند ذكر «X بن Y» فهي المقصودة.
- إذا كتب المستخدم نسبًا بلا «بن»، مرر الأسماء المتتالية كما هي في nasab. لو رجع note عن عدم تطابق جزء، اذكر الجزء غير المطابق والأقرب؛ لا تفترض.
- يمكنك طلب find_people للشخصين بالتوازي. لا تستدعِ relation إلا بعد معرفة row الصحيح للشخصين.
- «ذرية X» أو «أولاد X» أو «من نسل X»: حدّد row أولًا ثم استخدم count_descendants أو descendant_of. الذرية لا تشمل X نفسه.
- سؤال القرابة: استدعِ relation. a_to_b يصف الشخص الأول بالنسبة للثاني، وb_to_a العكس. انسخ المسمى كما هو؛ لا تستنتج مسمى من فرق الأجيال أو تعيد تفسيره.
- لو صحّح المستخدم أو وضّح، طبّق التوضيح على سؤاله السابق وأجب عنه من جديد.
- لا تكتب row للمستخدم. لو رجعت أداة error، صحّح الطلب أو اسأل؛ لا تكمل على افتراض.
تعريفات البيانات:
- «آل X» فرع فرعي X، إلا «آل محمد» بلا أب فهو محمد بن سالم. «فرع X» صراحة هو الفرع الرئيسي.
- الحالات: أعزب حي، متزوج حي، متزوج متوفى له عقب ذكور وإناث، متزوج متوفى له عقب إناث فقط، متزوج متوفى ليس له عقب، أعزب متوفى. سؤال «كم متزوج» يذكر الأحياء أولًا ثم المتوفين منفصلين.
قوالب الرد:
- القرابة: «[الشخص الأول] هو [a_to_b] لـ[الشخص الثاني]. الجد المشترك: [common_ancestor].» لا تضف شرحًا إلا إذا طلب المستخدم «اشرح».
- العدد: ابدأ بالرقم، ثم الوصف. لا تسرد أسماء إلا بطلب صريح، وبحد أقصى خمسة مع nasab قصير.
- الغموض: «لقيت أكثر من شخص باسم [الاسم]. تقصد [خيار ١] أو [خيار ٢]؟»
- عدم الوجود أو نقص البيانات: «ما لقيت [المعلومة] في لوحة ١٤٤٥هـ.»
- الشخص نفسه: «[الاسمان] هما نفس الشخص في الشجرة.»
- نص عادي بلا markdown أو عناوين أو قوائم. جملة أو جملتان، وبحد أقصى ٢٢٠ حرفًا ما لم يطلب المستخدم شرحًا.
مثال: إذا relation أعاد a_to_b = «عم مباشر»، فالجواب «نادر بن محمد بن عبدالعزيز هو عم مباشر لإياس بن سعد بن محمد بن عبدالعزيز. الجد المشترك: محمد بن عبدالعزيز.»`;

const P_FILTERS = {
  nasab: { type: "string", description: "النسب زي ما كتبه المستخدم، من الشخص للأعلى: «صقر ناصر عبدالله» أو «صقر بن ناصر بن عبدالله». الأفضل لأي اسمين أو أكثر" },
  first_name: { type: "string", description: "اسم الشخص نفسه" },
  father_name: { type: "string" },
  grandfather_name: { type: "string" },
  main_branch: { type: "string", enum: ["محمد", "خلف", "سعد", "ناصر"], description: "فقط إذا قال «فرع X» صراحة" },
  lineage_name: { type: "string", description: "«من آل X»: الاسم X" },
  lineage_father: { type: "string", description: "أبو X في «آل X بن Y»" },
  descendant_of: { type: "integer", description: "row لجد: يحصر البحث في ذريته (بدون الجد نفسه)" },
  alive: { type: "boolean" },
  married: { type: "boolean", description: "true = تزوج (حي أو متوفى)" },
  has_children: { type: "boolean" },
  children_count: { type: "integer", description: "عدد الأبناء الذكور بالضبط" },
};
const fn = (name, description, properties, required = []) =>
  ({ type: "function", function: { name, description, parameters: { type: "object", properties, required } } });
const TOOLS = [
  fn("find_people", "ابحث عن أشخاص بالمواصفات. يرجع العدد الكلي (total) وأول ١٠ مرتبين من الأقدم جيلًا. founder_of = هذا الشخص مؤسس فرع.", P_FILTERS),
  fn("get_person", "تفاصيل شخص: نسبه الكامل، حالته، فرعه، أبوه، أبناؤه، عدد ذريته.", { row: { type: "integer" } }, ["row"]),
  fn("count_descendants", "إحصاء ذرية شخص (كل من نزل منه): العدد حسب الحالة وحسب الجيل.", { row: { type: "integer" } }, ["row"]),
  fn("relation", "القرابة بين شخصين: يرجع الجد المشترك وa_to_b (الأول بالنسبة للثاني) وb_to_a (العكس) كمسميات حتمية، إضافة إلى فرق الأجيال.", { row_a: { type: "integer" }, row_b: { type: "integer" } }, ["row_a", "row_b"]),
];

// حدود مشتركة: لازم تطابق CH_MAX_* في index.html
const MAX_MSGS = 40, MAX_CALLS = 5;
const TOOL_SCHEMA = Object.fromEntries(TOOLS.map((t) => [t.function.name, t.function.parameters]));
const INT_MAX = { children_count: 200 };

// يتحقق من arguments أداة طلبها الموديل حسب الـ schema. يرجّع نص الخطأ أو "" لو سليمة.
function badArgs(name, raw) {
  const sc = TOOL_SCHEMA[name];
  let a;
  try { a = JSON.parse(raw || "{}"); } catch { return "arguments مو JSON صالح"; }
  if (!a || typeof a !== "object" || Array.isArray(a)) return "arguments لازم تكون object";
  for (const k of Object.keys(a)) {
    const p = sc.properties[k], v = a[k];
    if (!p) return `حقل غير معروف: ${k}`;
    if (p.type === "string" && (typeof v !== "string" || !v.trim() || v.length > (k === "nasab" ? 100 : 40))) return `${k}: نص غير صالح`;
    if (p.type === "integer" && (!Number.isInteger(v) || v < 0 || v > (INT_MAX[k] ?? 1e6))) return `${k}: رقم غير صالح`;
    if (p.type === "boolean" && typeof v !== "boolean") return `${k}: لازم true أو false`;
    if (p.enum && !p.enum.includes(v)) return `${k}: قيمة غير مسموحة`;
  }
  for (const k of sc.required) if (!(k in a)) return `${k} مطلوب`;
  return "";
}

// تنظيف رسائل المحادثة القادمة من المتصفح (ما نثق فيها): أدوار محددة، أطوال محدودة،
// وكل tool لازم يرد على tool call سابق ما انرد عليه، وكل tool call لازم ينرد عليه قبل الرسالة التالية.
function clean(msgs) {
  if (!Array.isArray(msgs) || !msgs.length || msgs.length > MAX_MSGS) return null;
  if (msgs[0]?.role !== "user" || !["user", "tool"].includes(msgs.at(-1)?.role)) return null;
  const out = [], pending = new Set();
  for (const m of msgs) {
    const content = String(m?.content ?? "").slice(0, 4000);
    if (m?.role === "tool") {
      const id = String(m.tool_call_id ?? "");
      if (!pending.delete(id)) return null;   // tool منفرد أو مكرر
      out.push({ role: "tool", tool_call_id: id, content });
      continue;
    }
    if (pending.size) return null;   // رسالة جديدة قبل ما تنرد كل الـ tool calls
    if (m?.role === "user") out.push({ role: "user", content: content.slice(0, 300) });
    else if (m?.role === "assistant") {
      const x = { role: "assistant", content };
      if (m.tool_calls !== undefined) {
        if (!Array.isArray(m.tool_calls) || !m.tool_calls.length || m.tool_calls.length > MAX_CALLS) return null;
        x.tool_calls = [];
        for (const t of m.tool_calls) {
          const id = String(t?.id ?? ""), name = t?.function?.name, args = t?.function?.arguments;
          if (!id || id.length > 80 || pending.has(id) || !TOOL_SCHEMA[name] || typeof args !== "string" || args.length > 1000) return null;
          pending.add(id);
          x.tool_calls.push({ id, type: "function", function: { name, arguments: args } });
        }
      }
      out.push(x);
    } else return null;
  }
  return pending.size ? null : out;
}

// tool calls اللي رجعت من GLM: نحذف الأدوات غير المعرفة، نحد العدد، ونعلّم الـ arguments الخربانة
// بـ error عشان المتصفح يرجّع الخطأ للموديل بدل ما ينفّذ بـ {}
function vetCalls(calls) {
  if (!Array.isArray(calls)) return undefined;
  const out = calls.filter((t) => TOOL_SCHEMA[t?.function?.name]).slice(0, MAX_CALLS).map((t, i) => {
    const args = String(t.function.arguments ?? "{}").slice(0, 1000);
    const c = { id: String(t.id || `call_${Date.now()}_${i}`).slice(0, 80), type: "function", function: { name: t.function.name, arguments: args } };
    const e = badArgs(c.function.name, args);
    if (e) c.error = e;
    return c;
  });
  return out.length ? out : undefined;
}

// جلسة قصيرة بعد أول تحقق ناجح: توقيع HMAC على وقت الانتهاء، بدون تخزين أي شي عن المستخدم
const SESS_MS = 30 * 60 * 1000;
const GLM_TIMEOUT_MS = 25000;
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
  const msgs = clean(d.messages);
  if (!msgs) return reply({ ok: false, err: "bad" }, 400, origin);
  let sess = "";
  if (!(await okSess(d.sess, env))) {
    if (!(await human(d.token, env))) return reply({ ok: false, err: "captcha" }, 403, origin);
    sess = await mkSess(env);
  }
  // من هنا التحقق نجح: نرجّع sess حتى مع الفشل، عشان إعادة المحاولة ما تطلب تحقق جديد
  const fail = (err) => reply({ ok: false, err, sess }, 502, origin);

  let r;
  const t0 = Date.now();
  try {
    r = await fetch(env.GLM_URL, {
      signal: AbortSignal.timeout(GLM_TIMEOUT_MS),   // GLM أحيانًا يعلّق؛ الأفضل نفشل وتنعاد المحاولة بدل الانتظار للأبد
      method: "POST",
      headers: { Authorization: `Bearer ${env.GLM_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.GLM_MODEL,
        temperature: 0.2,
        max_tokens: 500,
        enable_thinking: false,   // بدونها Qwen يفكّر قبل الجواب: أبطأ بكثير ويستهلك التوكنز
        tools: TOOLS,
        tool_choice: "auto",
        messages: [{ role: "system", content: SYSTEM }, ...msgs],
      }),
    });
  } catch (e) {
    console.log("glm fetch", String(e));
    return fail("llm");
  }
  if (!r.ok) {
    console.log("glm", r.status, (await r.text()).slice(0, 300));   // يظهر في wrangler tail
    return fail("llm");
  }
  let j, m;
  try { j = await r.json(); m = j.choices[0].message; } catch { m = null; }
  const ms = Date.now() - t0;
  // قياس: كم أخذ GLM، كم توكن، وهل فكّر (reasoning) رغم thinking: disabled. يظهر في wrangler tail
  console.log("glm", `${ms}ms`, j?.model, j?.choices?.[0]?.finish_reason, JSON.stringify(j?.usage || {}),
    "reasoning:", String(m?.reasoning_content || "").length, "calls:", m?.tool_calls?.length || 0);
  if (!m || typeof m !== "object") return fail("bad_response");
  const tool_calls = vetCalls(m.tool_calls);
  const content = typeof m.content === "string" ? m.content.trim().slice(0, 4000) : "";
  if (!tool_calls && !content.trim()) return fail("bad_response");
  return reply({ ok: true, sess, ms, message: { role: "assistant", content, tool_calls } }, 200, origin);
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
