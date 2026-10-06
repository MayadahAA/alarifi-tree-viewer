var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// feedback.js
var ALLOWED = ["https://www.aburakan.org", "https://aburakan.org", "http://localhost:8000", "http://127.0.0.1:8000"];
function cors(origin) {
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(origin) ? origin : ALLOWED[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
__name(cors, "cors");
function reply(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin) }
  });
}
__name(reply, "reply");
async function human(token, env) {
  const v = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(token || "") })
  }).then((r) => r.json()).catch(() => ({}));
  return !!v.success;
}
__name(human, "human");
var SYSTEM = `\u0623\u0646\u062A \u0645\u0633\u0627\u0639\u062F \u0634\u062C\u0631\u0629 \u0623\u0633\u0631\u0629 \u0627\u0644\u0639\u0631\u064A\u0641\u064A. \u062A\u062C\u0627\u0648\u0628 \u0628\u0644\u0647\u062C\u0629 \u0633\u0639\u0648\u062F\u064A\u0629 \u0628\u0633\u064A\u0637\u0629 \u0648\u0645\u062E\u062A\u0635\u0631\u0629.
\u0627\u0644\u0642\u0648\u0627\u0639\u062F:
- \u0643\u0644 \u0645\u0639\u0644\u0648\u0645\u0629 \u0639\u0646 \u0627\u0644\u0623\u0634\u062E\u0627\u0635 \u0648\u0627\u0644\u0623\u0639\u062F\u0627\u062F \u0644\u0627\u0632\u0645 \u062A\u062C\u064A \u0645\u0646 \u0627\u0644\u0623\u062F\u0648\u0627\u062A. \u0644\u0627 \u062A\u062E\u0645\u0651\u0646 \u0648\u0644\u0627 \u062A\u062E\u062A\u0631\u0639 \u0623\u064A \u0627\u0633\u0645 \u0623\u0648 \u0631\u0642\u0645.
- \u0644\u0648 \u0627\u0644\u0634\u062E\u0635 \u0627\u0644\u0645\u0642\u0635\u0648\u062F \u063A\u0627\u0645\u0636 (\u0623\u0643\u062B\u0631 \u0645\u0646 \u0646\u062A\u064A\u062C\u0629)\u060C \u0627\u0633\u0623\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u064A\u062D\u062F\u062F (\u0627\u0633\u0645 \u0627\u0644\u0623\u0628 \u0623\u0648 \u0627\u0644\u062C\u062F \u0623\u0648 \u0627\u0644\u0641\u0631\u0639) \u0642\u0628\u0644 \u0645\u0627 \u062A\u0643\u0645\u0644.
  \u0627\u0633\u062A\u062B\u0646\u0627\u0621: \u0644\u0648 \u0648\u062D\u062F\u0629 \u0645\u0646 \u0627\u0644\u0646\u062A\u0627\u0626\u062C \u0639\u0644\u064A\u0647\u0627 founder_of\u060C \u0641\u0647\u064A \u0627\u0644\u0645\u0642\u0635\u0648\u062F\u0629 \u0639\u0646\u062F \u0630\u0643\u0631 \xABX \u0628\u0646 Y\xBB \u0628\u062F\u0648\u0646 \u062A\u0641\u0627\u0635\u064A\u0644 (\u0635\u0642\u0631 \u0628\u0646 \u0646\u0627\u0635\u0631 = \u0645\u0624\u0633\u0633 \u0622\u0644 \u0635\u0642\u0631\u060C \u0645\u0648 \u062D\u0641\u064A\u062F\u0647 \u0627\u0644\u0644\u064A \u0628\u0646\u0641\u0633 \u0627\u0644\u0627\u0633\u0645).
- \u0627\u0644\u0646\u0627\u0633 \u064A\u0643\u062A\u0628\u0648\u0646 \u0627\u0644\u0646\u0633\u0628 \u0628\u062F\u0648\u0646 \xAB\u0628\u0646\xBB: \xAB\u0635\u0642\u0631 \u0646\u0627\u0635\u0631 \u0639\u0628\u062F\u0627\u0644\u0644\u0647\xBB = \u0635\u0642\u0631 \u0628\u0646 \u0646\u0627\u0635\u0631 \u0628\u0646 \u0639\u0628\u062F\u0627\u0644\u0644\u0647. \u0623\u064A \u0627\u0633\u0645\u064A\u0646 \u0623\u0648 \u0623\u0643\u062B\u0631 \u0645\u062A\u062A\u0627\u0644\u064A\u0629 \u0645\u0631\u0651\u0631\u0647\u0627 \u0643\u0645\u0627 \u0647\u064A \u0641\u064A nasab\u060C \u0644\u0627 \u062A\u0642\u0633\u0645\u0647\u0627 \u0628\u0646\u0641\u0633\u0643.
  \u0644\u0648 \u0631\u062C\u0639 note \u0625\u0646 \u062C\u0632\u0621 \u0645\u0627 \u0637\u0627\u0628\u0642\u060C \u0642\u0644 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0634 \u0627\u0644\u0644\u064A \u0645\u0627 \u0637\u0627\u0628\u0642 \u0648\u0627\u0639\u0631\u0636 \u0627\u0644\u0623\u0642\u0631\u0628\u060C \u0644\u0627 \u062A\u0641\u062A\u0631\u0636.
- \xAB\u0630\u0631\u064A\u0629 X\xBB \u0623\u0648 \xAB\u0623\u0648\u0644\u0627\u062F X\xBB \u0623\u0648 \xAB\u0645\u0646 \u0646\u0633\u0644 X\xBB: \u062D\u062F\u0651\u062F row \u062D\u0642 X \u0623\u0648\u0644\u060C \u062B\u0645 \u0627\u0633\u062A\u062E\u062F\u0645 descendant_of \u0623\u0648 count_descendants. \u0627\u0644\u0630\u0631\u064A\u0629 \u0645\u0627 \u062A\u0634\u0645\u0644 X \u0646\u0641\u0633\u0647.
- \u0644\u0648 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0635\u062D\u0651\u062D \u0623\u0648 \u0648\u0636\u0651\u062D (\u0645\u062B\u0644 \xAB\u0623\u0642\u0635\u062F \u0622\u0644 \u0635\u0642\u0631\xBB \u0623\u0648 \xAB\u0644\u0627\u060C \u0627\u0644\u0645\u062A\u0648\u0641\u0649\xBB)\u060C \u0637\u0628\u0651\u0642 \u0627\u0644\u062A\u0648\u0636\u064A\u062D \u0639\u0644\u0649 \u0633\u0624\u0627\u0644\u0647 \u0627\u0644\u0633\u0627\u0628\u0642 \u0648\u062C\u0627\u0648\u0628 \u0627\u0644\u0633\u0624\u0627\u0644 \u0627\u0644\u0633\u0627\u0628\u0642 \u0646\u0641\u0633\u0647 \u0645\u0646 \u062C\u062F\u064A\u062F.
- \u0644\u0627 \u062A\u0643\u062A\u0628 \u0623\u0631\u0642\u0627\u0645 \u0627\u0644\u0635\u0641\u0648\u0641 (row) \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u061B \u0647\u064A \u0644\u0644\u0623\u062F\u0648\u0627\u062A \u0641\u0642\u0637.
- \u0639\u0631\u0641 \u0627\u0644\u0646\u0627\u0633: \xAB\u0622\u0644 X\xBB \u064A\u0639\u0646\u064A \u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0641\u0631\u0639\u064A X (\u0622\u0644 \u0633\u0639\u062F = \u0633\u0639\u062F \u0628\u0646 \u0646\u0627\u0635\u0631\u060C \u0622\u0644 \u0635\u0642\u0631 = \u0635\u0642\u0631 \u0628\u0646 \u0646\u0627\u0635\u0631)\u060C \u0625\u0644\u0627 \xAB\u0622\u0644 \u0645\u062D\u0645\u062F\xBB \u0628\u062F\u0648\u0646 \u0623\u0628 = \u0641\u0631\u0639 \u0645\u062D\u0645\u062F \u0628\u0646 \u0633\u0627\u0644\u0645. \xAB\u0641\u0631\u0639 X\xBB \u0635\u0631\u0627\u062D\u0629 = \u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0631\u0626\u064A\u0633\u064A.
- \u0627\u0644\u062D\u0627\u0644\u0627\u062A \u0641\u064A \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A: \u0623\u0639\u0632\u0628 \u062D\u064A\u060C \u0645\u062A\u0632\u0648\u062C \u062D\u064A\u060C \u0645\u062A\u0632\u0648\u062C \u0645\u062A\u0648\u0641\u0649 \u0644\u0647 \u0639\u0642\u0628 \u0630\u0643\u0648\u0631 \u0648\u0625\u0646\u0627\u062B\u060C \u0645\u062A\u0632\u0648\u062C \u0645\u062A\u0648\u0641\u0649 \u0644\u0647 \u0639\u0642\u0628 \u0625\u0646\u0627\u062B \u0641\u0642\u0637\u060C \u0645\u062A\u0632\u0648\u062C \u0645\u062A\u0648\u0641\u0649 \u0644\u064A\u0633 \u0644\u0647 \u0639\u0642\u0628\u060C \u0623\u0639\u0632\u0628 \u0645\u062A\u0648\u0641\u0649.
  \u0644\u0648 \u0633\u064F\u0626\u0644\u062A \xAB\u0643\u0645 \u0645\u062A\u0632\u0648\u062C\xBB \u0627\u0630\u0643\u0631 \u0627\u0644\u0645\u062A\u0632\u0648\u062C\u064A\u0646 \u0627\u0644\u0623\u062D\u064A\u0627\u0621\u060C \u0648\u0627\u0630\u0643\u0631 \u0628\u0639\u062F\u0647\u0627 \u0627\u0644\u0645\u062A\u0632\u0648\u062C\u064A\u0646 \u0627\u0644\u0645\u062A\u0648\u0641\u064A\u0646 \u0643\u0645\u0639\u0644\u0648\u0645\u0629 \u0645\u0646\u0641\u0635\u0644\u0629.
- \u0627\u0644\u0623\u0628\u0646\u0627\u0621 \u0627\u0644\u0645\u062D\u0633\u0648\u0628\u064A\u0646 \u0647\u0645 \u0627\u0644\u0630\u0643\u0648\u0631 \u0627\u0644\u0645\u0631\u0633\u0648\u0645\u064A\u0646 \u0641\u064A \u0627\u0644\u0644\u0648\u062D\u0629. \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0646 \u0644\u0648\u062D\u0629 \xAB\u0634\u062C\u0631\u0629 \u0627\u0644\u0639\u0631\u064A\u0641\u064A \u0661\u0664\u0664\u0665\u0647\u0640\xBB \u0648\u0642\u062F \u062A\u0643\u0648\u0646 \u062A\u063A\u064A\u0631\u062A \u0628\u0639\u062F\u0647\u0627.
- \u0623\u064A \u0627\u0633\u0645 \u0623\u0648 \u0631\u0642\u0645 \u0623\u0648 \u0642\u0631\u0627\u0628\u0629 \u062A\u0630\u0643\u0631\u0647\u0627 \u0644\u0627\u0632\u0645 \u064A\u0643\u0648\u0646 \u0645\u0648\u062C\u0648\u062F \u062D\u0631\u0641\u064A\u064B\u0627 \u0641\u064A \u0646\u062A\u064A\u062C\u0629 \u0623\u062F\u0627\u0629. \u0644\u0648 \u0645\u0627 \u0639\u0646\u062F\u0643 \u0646\u062A\u064A\u062C\u0629 \u062A\u0643\u0641\u064A\u060C \u0627\u0633\u062A\u062F\u0639\u0650 \u0623\u062F\u0627\u0629 \u0623\u0648 \u0642\u0644 \u0625\u0646\u0643 \u0645\u0627 \u062A\u0639\u0631\u0641.
- \u0644\u0648 \u0631\u062C\u0639\u062A \u0623\u062F\u0627\u0629 error\u060C \u0635\u062D\u0651\u062D \u0627\u0644\u0637\u0644\u0628 \u0623\u0648 \u0627\u0633\u0623\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u061B \u0644\u0627 \u062A\u0643\u0645\u0644 \u0639\u0644\u0649 \u0627\u0641\u062A\u0631\u0627\u0636.
- \u0644\u0627 \u062A\u062C\u0627\u0648\u0628 \u0639\u0646 \u0623\u064A \u0645\u0648\u0636\u0648\u0639 \u062E\u0627\u0631\u062C \u0627\u0644\u0634\u062C\u0631\u0629.
\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0631\u062F:
- \u0646\u0635 \u0639\u0627\u062F\u064A \u0628\u062F\u0648\u0646 markdown (\u0628\u062F\u0648\u0646 #\u060C **\u060C \u0623\u0648 \u0642\u0648\u0627\u0626\u0645 \u0645\u0631\u0642\u0651\u0645\u0629). \u062C\u0645\u0644\u0629 \u0623\u0648 \u062C\u0645\u0644\u062A\u064A\u0646 \u062A\u062C\u0627\u0648\u0628 \u0627\u0644\u0633\u0624\u0627\u0644 \u0645\u0628\u0627\u0634\u0631\u0629.
- \u0644\u0648 \u0627\u0644\u0633\u0624\u0627\u0644 \xAB\u0643\u0645\xBB\u060C \u0627\u0628\u062F\u0623 \u0628\u0627\u0644\u0631\u0642\u0645. \u0644\u0627 \u062A\u0639\u062F\u0651\u062F \u0627\u0644\u0623\u0634\u062E\u0627\u0635 \u0648\u0627\u062D\u062F \u0648\u0627\u062D\u062F \u0625\u0644\u0627 \u0625\u0630\u0627 \u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u060C \u0648\u062D\u062A\u0649 \u0644\u0648 \u0637\u0644\u0628: \u0623\u0642\u0635\u0649 \u0665 \u0628\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0646\u0633\u0628 \u0627\u0644\u0642\u0635\u064A\u0631 (nasab).
- \u0627\u0630\u0643\u0631 \u0627\u0644\u0634\u062E\u0635 \u0628\u0646\u0633\u0628\u0647 \u0627\u0644\u0642\u0635\u064A\u0631 (\u0645\u062B\u0644 \xAB\u0635\u0642\u0631 \u0628\u0646 \u0646\u0627\u0635\u0631 \u0628\u0646 \u062C\u0645\u0627\u0632\xBB) \u0639\u0634\u0627\u0646 \u064A\u0628\u0627\u0646 \u0623\u064A \u0648\u0627\u062D\u062F \u062A\u0642\u0635\u062F.`;
var P_FILTERS = {
  nasab: { type: "string", description: "\u0627\u0644\u0646\u0633\u0628 \u0632\u064A \u0645\u0627 \u0643\u062A\u0628\u0647 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u060C \u0645\u0646 \u0627\u0644\u0634\u062E\u0635 \u0644\u0644\u0623\u0639\u0644\u0649: \xAB\u0635\u0642\u0631 \u0646\u0627\u0635\u0631 \u0639\u0628\u062F\u0627\u0644\u0644\u0647\xBB \u0623\u0648 \xAB\u0635\u0642\u0631 \u0628\u0646 \u0646\u0627\u0635\u0631 \u0628\u0646 \u0639\u0628\u062F\u0627\u0644\u0644\u0647\xBB. \u0627\u0644\u0623\u0641\u0636\u0644 \u0644\u0623\u064A \u0627\u0633\u0645\u064A\u0646 \u0623\u0648 \u0623\u0643\u062B\u0631" },
  first_name: { type: "string", description: "\u0627\u0633\u0645 \u0627\u0644\u0634\u062E\u0635 \u0646\u0641\u0633\u0647" },
  father_name: { type: "string" },
  grandfather_name: { type: "string" },
  main_branch: { type: "string", enum: ["\u0645\u062D\u0645\u062F", "\u062E\u0644\u0641", "\u0633\u0639\u062F", "\u0646\u0627\u0635\u0631"], description: "\u0641\u0642\u0637 \u0625\u0630\u0627 \u0642\u0627\u0644 \xAB\u0641\u0631\u0639 X\xBB \u0635\u0631\u0627\u062D\u0629" },
  lineage_name: { type: "string", description: "\xAB\u0645\u0646 \u0622\u0644 X\xBB: \u0627\u0644\u0627\u0633\u0645 X" },
  lineage_father: { type: "string", description: "\u0623\u0628\u0648 X \u0641\u064A \xAB\u0622\u0644 X \u0628\u0646 Y\xBB" },
  descendant_of: { type: "integer", description: "row \u0644\u062C\u062F: \u064A\u062D\u0635\u0631 \u0627\u0644\u0628\u062D\u062B \u0641\u064A \u0630\u0631\u064A\u062A\u0647 (\u0628\u062F\u0648\u0646 \u0627\u0644\u062C\u062F \u0646\u0641\u0633\u0647)" },
  alive: { type: "boolean" },
  married: { type: "boolean", description: "true = \u062A\u0632\u0648\u062C (\u062D\u064A \u0623\u0648 \u0645\u062A\u0648\u0641\u0649)" },
  has_children: { type: "boolean" },
  children_count: { type: "integer", description: "\u0639\u062F\u062F \u0627\u0644\u0623\u0628\u0646\u0627\u0621 \u0627\u0644\u0630\u0643\u0648\u0631 \u0628\u0627\u0644\u0636\u0628\u0637" }
};
var fn = /* @__PURE__ */ __name((name, description, properties, required = []) => ({ type: "function", function: { name, description, parameters: { type: "object", properties, required } } }), "fn");
var TOOLS = [
  fn("find_people", "\u0627\u0628\u062D\u062B \u0639\u0646 \u0623\u0634\u062E\u0627\u0635 \u0628\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A. \u064A\u0631\u062C\u0639 \u0627\u0644\u0639\u062F\u062F \u0627\u0644\u0643\u0644\u064A (total) \u0648\u0623\u0648\u0644 \u0661\u0660 \u0645\u0631\u062A\u0628\u064A\u0646 \u0645\u0646 \u0627\u0644\u0623\u0642\u062F\u0645 \u062C\u064A\u0644\u064B\u0627. founder_of = \u0647\u0630\u0627 \u0627\u0644\u0634\u062E\u0635 \u0645\u0624\u0633\u0633 \u0641\u0631\u0639.", P_FILTERS),
  fn("get_person", "\u062A\u0641\u0627\u0635\u064A\u0644 \u0634\u062E\u0635: \u0646\u0633\u0628\u0647 \u0627\u0644\u0643\u0627\u0645\u0644\u060C \u062D\u0627\u0644\u062A\u0647\u060C \u0641\u0631\u0639\u0647\u060C \u0623\u0628\u0648\u0647\u060C \u0623\u0628\u0646\u0627\u0624\u0647\u060C \u0639\u062F\u062F \u0630\u0631\u064A\u062A\u0647.", { row: { type: "integer" } }, ["row"]),
  fn("count_descendants", "\u0625\u062D\u0635\u0627\u0621 \u0630\u0631\u064A\u0629 \u0634\u062E\u0635 (\u0643\u0644 \u0645\u0646 \u0646\u0632\u0644 \u0645\u0646\u0647): \u0627\u0644\u0639\u062F\u062F \u062D\u0633\u0628 \u0627\u0644\u062D\u0627\u0644\u0629 \u0648\u062D\u0633\u0628 \u0627\u0644\u062C\u064A\u0644.", { row: { type: "integer" } }, ["row"]),
  fn("relation", "\u0627\u0644\u0642\u0631\u0627\u0628\u0629 \u0628\u064A\u0646 \u0634\u062E\u0635\u064A\u0646: \u0627\u0644\u062C\u062F \u0627\u0644\u0645\u0634\u062A\u0631\u0643 \u0648\u0643\u0645 \u062C\u064A\u0644 \u0628\u064A\u0646\u0647\u0645.", { row_a: { type: "integer" }, row_b: { type: "integer" } }, ["row_a", "row_b"])
];
var MAX_MSGS = 40;
var MAX_CALLS = 5;
var TOOL_SCHEMA = Object.fromEntries(TOOLS.map((t) => [t.function.name, t.function.parameters]));
var INT_MAX = { children_count: 200 };
function badArgs(name, raw) {
  const sc = TOOL_SCHEMA[name];
  let a;
  try {
    a = JSON.parse(raw || "{}");
  } catch {
    return "arguments \u0645\u0648 JSON \u0635\u0627\u0644\u062D";
  }
  if (!a || typeof a !== "object" || Array.isArray(a)) return "arguments \u0644\u0627\u0632\u0645 \u062A\u0643\u0648\u0646 object";
  for (const k of Object.keys(a)) {
    const p = sc.properties[k], v = a[k];
    if (!p) return `\u062D\u0642\u0644 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641: ${k}`;
    if (p.type === "string" && (typeof v !== "string" || !v.trim() || v.length > (k === "nasab" ? 100 : 40))) return `${k}: \u0646\u0635 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D`;
    if (p.type === "integer" && (!Number.isInteger(v) || v < 0 || v > (INT_MAX[k] ?? 1e6))) return `${k}: \u0631\u0642\u0645 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D`;
    if (p.type === "boolean" && typeof v !== "boolean") return `${k}: \u0644\u0627\u0632\u0645 true \u0623\u0648 false`;
    if (p.enum && !p.enum.includes(v)) return `${k}: \u0642\u064A\u0645\u0629 \u063A\u064A\u0631 \u0645\u0633\u0645\u0648\u062D\u0629`;
  }
  for (const k of sc.required) if (!(k in a)) return `${k} \u0645\u0637\u0644\u0648\u0628`;
  return "";
}
__name(badArgs, "badArgs");
function clean(msgs) {
  if (!Array.isArray(msgs) || !msgs.length || msgs.length > MAX_MSGS) return null;
  if (msgs[0]?.role !== "user" || !["user", "tool"].includes(msgs.at(-1)?.role)) return null;
  const out = [], pending = /* @__PURE__ */ new Set();
  for (const m of msgs) {
    const content = String(m?.content ?? "").slice(0, 4e3);
    if (m?.role === "tool") {
      const id = String(m.tool_call_id ?? "");
      if (!pending.delete(id)) return null;
      out.push({ role: "tool", tool_call_id: id, content });
      continue;
    }
    if (pending.size) return null;
    if (m?.role === "user") out.push({ role: "user", content: content.slice(0, 300) });
    else if (m?.role === "assistant") {
      const x = { role: "assistant", content };
      if (m.tool_calls !== void 0) {
        if (!Array.isArray(m.tool_calls) || !m.tool_calls.length || m.tool_calls.length > MAX_CALLS) return null;
        x.tool_calls = [];
        for (const t of m.tool_calls) {
          const id = String(t?.id ?? ""), name = t?.function?.name, args = t?.function?.arguments;
          if (!id || id.length > 80 || pending.has(id) || !TOOL_SCHEMA[name] || typeof args !== "string" || args.length > 1e3) return null;
          pending.add(id);
          x.tool_calls.push({ id, type: "function", function: { name, arguments: args } });
        }
      }
      out.push(x);
    } else return null;
  }
  return pending.size ? null : out;
}
__name(clean, "clean");
function vetCalls(calls) {
  if (!Array.isArray(calls)) return void 0;
  const out = calls.filter((t) => TOOL_SCHEMA[t?.function?.name]).slice(0, MAX_CALLS).map((t, i) => {
    const args = String(t.function.arguments ?? "{}").slice(0, 1e3);
    const c = { id: String(t.id || `call_${Date.now()}_${i}`).slice(0, 80), type: "function", function: { name: t.function.name, arguments: args } };
    const e = badArgs(c.function.name, args);
    if (e) c.error = e;
    return c;
  });
  return out.length ? out : void 0;
}
__name(vetCalls, "vetCalls");
var SESS_MS = 30 * 60 * 1e3;
async function sign(msg, env) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.TURNSTILE_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(s))).replace(/[+/=]/g, "");
}
__name(sign, "sign");
async function mkSess(env) {
  const e = String(Date.now() + SESS_MS);
  return e + "." + await sign(e, env);
}
__name(mkSess, "mkSess");
async function okSess(s, env) {
  const [e, sig] = String(s || "").split(".");
  return !!sig && Number(e) > Date.now() && sig === await sign(e, env);
}
__name(okSess, "okSess");
async function chat(d, env, origin) {
  const msgs = clean(d.messages);
  if (!msgs) return reply({ ok: false, err: "bad" }, 400, origin);
  let sess = "";
  if (!await okSess(d.sess, env)) {
    if (!await human(d.token, env)) return reply({ ok: false, err: "captcha" }, 403, origin);
    sess = await mkSess(env);
  }
  const fail = /* @__PURE__ */ __name((err) => reply({ ok: false, err, sess }, 502, origin), "fail");
  let r;
  try {
    r = await fetch(env.GLM_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.GLM_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.GLM_MODEL,
        temperature: 0.2,
        max_tokens: 500,
        thinking: { type: "disabled" },
        // بدونها GLM يفكّر قبل الجواب: أبطأ بكثير ويستهلك التوكنز
        tools: TOOLS,
        tool_choice: "auto",
        messages: [{ role: "system", content: SYSTEM }, ...msgs]
      })
    });
  } catch (e) {
    console.log("glm fetch", String(e));
    return fail("llm");
  }
  if (!r.ok) {
    console.log("glm", r.status, (await r.text()).slice(0, 300));
    return fail("llm");
  }
  let m;
  try {
    m = (await r.json()).choices[0].message;
  } catch {
    m = null;
  }
  if (!m || typeof m !== "object") return fail("bad_response");
  const tool_calls = vetCalls(m.tool_calls);
  const content = typeof m.content === "string" ? m.content.trim().slice(0, 4e3) : "";
  if (!tool_calls && !content.trim()) return fail("bad_response");
  return reply({ ok: true, sess, message: { role: "assistant", content, tool_calls } }, 200, origin);
}
__name(chat, "chat");
var feedback_default = {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (req.method !== "POST") return reply({ ok: false }, 405, origin);
    if (!ALLOWED.includes(origin)) return reply({ ok: false }, 403, origin);
    let d;
    try {
      d = await req.json();
    } catch {
      return reply({ ok: false, err: "bad" }, 400, origin);
    }
    const path = new URL(req.url).pathname;
    if (path === "/chat") return chat(d, env, origin);
    const text = String(d.text || "").trim().slice(0, 1e3);
    const ref = String(d.ref || "").trim().slice(0, 300);
    if (text.length < 3) return reply({ ok: false, err: "empty" }, 400, origin);
    if (!await human(d.token, env)) return reply({ ok: false, err: "captcha" }, 403, origin);
    const msg = "\u{1F4DD} \u0645\u0644\u0627\u062D\u0638\u0629 \u0645\u062C\u0647\u0648\u0644\u0629\n" + (ref ? ref + "\n" : "") + "\n" + text;
    const t = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg })
    });
    return reply({ ok: t.ok }, t.ok ? 200 : 502, origin);
  }
};
export {
  feedback_default as default
};
//# sourceMappingURL=feedback.js.map
