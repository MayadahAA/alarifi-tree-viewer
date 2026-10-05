// اختبارات /chat بدون شبكة: fetch مزيّف لـ Turnstile و GLM.  التشغيل: node worker/test.mjs
import assert from "node:assert/strict";
const { default: worker } = await import("./feedback.js");

const env = { TURNSTILE_SECRET: "s", GLM_URL: "https://glm.test", GLM_MODEL: "m", GLM_API_KEY: "k" };
let human = true, glm = null, glmCalls = 0;
globalThis.fetch = async (url) => {
  if (String(url).includes("turnstile")) return new Response(JSON.stringify({ success: human }));
  glmCalls++;
  return glm();
};
const glmMsg = (message) => () => new Response(JSON.stringify({ choices: [{ message }] }));
const post = async (body) => {
  const r = await worker.fetch(new Request("https://w.test/chat", {
    method: "POST", headers: { Origin: "http://localhost:8000" }, body: JSON.stringify(body),
  }), env);
  return { status: r.status, ...(await r.json()) };
};
const U = (content) => ({ role: "user", content });
const call = (id, name, args) => ({ id, type: "function", function: { name, arguments: JSON.stringify(args) } });

let n = 0;
async function t(name, fn) { await fn(); n++; console.log("✓", name); }

await t("سؤال عادي: تحقق ناجح يرجّع sess والجواب", async () => {
  glm = glmMsg({ content: "هلا" });
  const j = await post({ messages: [U("مين أحمد")], token: "x" });
  assert.equal(j.ok, true); assert.ok(j.sess); assert.equal(j.message.content, "هلا");
});

await t("captcha فاشل ما يوصل لـ GLM", async () => {
  human = false; glmCalls = 0;
  const j = await post({ messages: [U("سلام")], token: "" });
  assert.equal(j.err, "captcha"); assert.equal(glmCalls, 0); human = true;
});

await t("فشل GLM بعد نجاح التحقق يرجّع sess، وإعادة المحاولة تمشي بالجلسة بدون token", async () => {
  glm = () => new Response("boom", { status: 500 });
  const j = await post({ messages: [U("سلام")], token: "x" });
  assert.equal(j.err, "llm"); assert.ok(j.sess);
  human = false; glm = glmMsg({ content: "تمام" });
  const k = await post({ messages: [U("سلام")], sess: j.sess, token: "" });
  assert.equal(k.ok, true); assert.equal(k.sess, ""); human = true;
});

await t("GLM يرمي exception → llm مع sess", async () => {
  glm = () => { throw new Error("down"); };
  const j = await post({ messages: [U("سلام")], token: "x" });
  assert.equal(j.err, "llm"); assert.ok(j.sess);
});

await t("رد GLM غير مفهوم → bad_response", async () => {
  glm = () => new Response("not json");
  assert.equal((await post({ messages: [U("سلام")], token: "x" })).err, "bad_response");
  glm = glmMsg({ content: "" });
  assert.equal((await post({ messages: [U("سلام")], token: "x" })).err, "bad_response");
});

await t("جلسة منتهية أو مزوّرة ترجع للتحقق", async () => {
  human = false;
  const old = String(Date.now() - 1000) + ".abc";
  assert.equal((await post({ messages: [U("سلام")], sess: old })).err, "captcha");
  human = true;
});

const sess = (await post({ messages: [U("x")], token: "x" }, glm = glmMsg({ content: "." }))).sess;

await t("علاقة تحتاج أكثر من tool call: التاريخ الكامل يمر", async () => {
  glm = glmMsg({ content: "بنو عم" });
  const j = await post({ sess, messages: [
    U("وش القرابة بين أ و ب"),
    { role: "assistant", content: "", tool_calls: [call("a", "find_people", { first_name: "أ" }), call("b", "find_people", { first_name: "ب" })] },
    { role: "tool", tool_call_id: "a", content: "{}" }, { role: "tool", tool_call_id: "b", content: "{}" },
    { role: "assistant", content: "", tool_calls: [call("c", "relation", { row_a: 1, row_b: 2 })] },
    { role: "tool", tool_call_id: "c", content: "{}" },
  ] });
  assert.equal(j.ok, true);
});

const bad = {
  "أول رسالة مو user": [{ role: "assistant", content: "x" }, U("y")],
  "آخر رسالة assistant": [U("x"), { role: "assistant", content: "y" }],
  "tool منفرد": [U("x"), { role: "tool", tool_call_id: "z", content: "{}" }],
  "tool_call_id ما يطابق": [U("x"), { role: "assistant", content: "", tool_calls: [call("a", "get_person", { row: 1 })] }, { role: "tool", tool_call_id: "b", content: "{}" }],
  "tool call ما انرد عليه": [U("x"), { role: "assistant", content: "", tool_calls: [call("a", "get_person", { row: 1 })] }, U("y")],
  "tool مكرر": [U("x"), { role: "assistant", content: "", tool_calls: [call("a", "get_person", { row: 1 })] }, { role: "tool", tool_call_id: "a", content: "{}" }, { role: "tool", tool_call_id: "a", content: "{}" }],
  "أداة غير معرفة في التاريخ": [U("x"), { role: "assistant", content: "", tool_calls: [call("a", "hack", {})] }, { role: "tool", tool_call_id: "a", content: "{}" }],
  "أكثر من 5 tool calls": [U("x"), { role: "assistant", content: "", tool_calls: [1, 2, 3, 4, 5, 6].map((i) => call("c" + i, "get_person", { row: i })) }, ...[1, 2, 3, 4, 5, 6].map((i) => ({ role: "tool", tool_call_id: "c" + i, content: "{}" }))],
  "أكثر من 40 رسالة": Array.from({ length: 41 }, (_, i) => (i % 2 ? { role: "assistant", content: "." } : U("."))),
  "role غريب": [{ role: "system", content: "x" }],
};
for (const [name, messages] of Object.entries(bad))
  await t("يرفض: " + name, async () => assert.equal((await post({ sess, messages })).err, "bad"));

await t("40 رسالة بالضبط مقبولة", async () => {
  glm = glmMsg({ content: "." });
  const m = [...Array.from({ length: 39 }, (_, i) => (i % 2 ? { role: "assistant", content: "." } : U("."))), U(".")];
  assert.equal(m.length, 40);
  assert.equal((await post({ sess, messages: m })).ok, true);
});

await t("رد GLM: أداة مجهولة تنحذف، JSON خربان و row سالب و نوع غلط وحقل زايد ينعلّموا error", async () => {
  glm = glmMsg({ content: "", tool_calls: [
    { id: "1", function: { name: "hack", arguments: "{}" } },
    { id: "2", function: { name: "get_person", arguments: "{row:" } },
    { id: "3", function: { name: "get_person", arguments: '{"row":-1}' } },
    { id: "4", function: { name: "find_people", arguments: '{"alive":"yes"}' } },
    { id: "5", function: { name: "find_people", arguments: '{"evil":1}' } },
    { id: "6", function: { name: "get_person", arguments: "{}" } },
    { id: "7", function: { name: "find_people", arguments: '{"main_branch":"x"}' } },
  ] });
  const c = (await post({ sess, messages: [U("x")] })).message.tool_calls;
  assert.equal(c.length, 5);   // hack انحذف، والباقي مقصوص على 5
  assert.deepEqual(c.map((x) => x.id), ["2", "3", "4", "5", "6"]);
  assert.ok(c.every((x) => x.error), JSON.stringify(c));
});

await t("رد GLM: arguments سليمة ما عليها error", async () => {
  glm = glmMsg({ content: "", tool_calls: [{ id: "1", function: { name: "find_people", arguments: '{"first_name":"أحمد","children_count":3,"alive":true,"main_branch":"سعد"}' } }] });
  const c = (await post({ sess, messages: [U("x")] })).message.tool_calls;
  assert.equal(c[0].error, undefined);
});

console.log(`\n${n} اختبار نجح`);
