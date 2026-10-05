import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const between = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));
const logic = between('function sectionTitle', 'function panel()');
const factsLogic = between('function factsHTML', 'function rareHTML');

let kids = {};
let byRow = {};
let nameCount = {};
let tripleCount = {};
let genStat = {};
let P = [];
const ar = (n) => String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const esc = (s) => String(s);
const statusColor = () => 'test';
const statusText = () => 'حالة';
const descCount = (person) => {
  let count = 0;
  const stack = [person];
  while (stack.length) {
    for (const child of kids[stack.pop().row] || []) {
      count += 1;
      stack.push(child);
    }
  }
  return count;
};
const { relationState, relationshipsHTML } = eval(`${logic}\n({ relationState, relationshipsHTML })`);
const { factsHTML } = eval(`${factsLogic}\n({ factsHTML })`);

const person = (row, st = 0, extra = {}) => ({ row, st, name: `شخص ${row}`, ...extra });
const setTree = (nodes, links) => {
  kids = {};
  byRow = Object.fromEntries(nodes.map((node) => [node.row, node]));
  for (const [parent, child] of links) (kids[parent] ||= []).push(byRow[child]);
};
const renders = (node) => relationshipsHTML(node);

// أبناء وإخوة وأحفاد
{
  const root = person(1), parent = person(10), sibling = person(2), child = person(3), grandchild = person(4);
  setTree([root, parent, sibling, child, grandchild], [[10, 1], [10, 2], [1, 3], [3, 4]]);
  root.fa = 10;
  assert.match(renders(root), /الأبناء.*١/);
  assert.match(renders(root), /الإخوة.*١/);
  assert.match(renders(root), /الذرية.*٢/);
}

// أبناء بلا إخوة، والذرية لا تكرر عدد الأبناء
{
  const root = person(1), child = person(2);
  setTree([root, child], [[1, 2]]);
  assert.match(renders(root), /الأبناء.*١/);
  assert.doesNotMatch(renders(root), /الإخوة|الذرية/);
}

// إخوة بلا أبناء
{
  const root = person(1), parent = person(10), sibling = person(2);
  setTree([root, parent, sibling], [[10, 1], [10, 2]]);
  root.fa = 10;
  assert.match(renders(root), /الإخوة.*١/);
  assert.doesNotMatch(renders(root), /الأبناء|٠/);
}

// بنات فقط، بلا أقسام فارغة
{
  const root = person(1, 3);
  setTree([root], []);
  assert.equal(relationState(root, []).state, 'daughters');
  assert.equal(renders(root), '');
}

// بلا ذرية، بلا إخوة
{
  const root = person(1, 4);
  setTree([root], []);
  assert.match(renders(root), /لا أبناء أو إخوة موثقون في اللوحة/);
}

// جميع العلاقات غير معروفة
{
  const root = person(1, null);
  setTree([root], []);
  assert.equal(relationState(root, []).state, 'unknown');
  assert.equal(renders(root), '');
}

// بيانات الأبناء غير مكتملة
{
  const root = person(1, 0, { rev: true });
  setTree([root], []);
  assert.equal(relationState(root, []).state, 'incomplete');
  assert.match(renders(root), /بيانات الأبناء غير مكتملة في اللوحة/);
  assert.doesNotMatch(renders(root), /٠/);
}

// نطاق إحصائية الحالة
{
  const root = person(1, 0, { gen: 14, name: 'عبدالله', tkey: 'عبدالله' });
  nameCount = { عبدالله: 1 };
  tripleCount = { عبدالله: 1 };
  P = Array.from({ length: 100 }, () => ({}));
  genStat = { 14: { n: 100, a: 98, k: 100 } };
  assert.match(factsHTML(root), /سُجّل ٩٨٪ من أفراد الجيل الرابع عشر أحياء/);

  root.gen = null;
  genStat = { null: { n: 100, a: 98, k: 100 } };
  assert.match(factsHTML(root), /سُجّل ٩٨٪ من أفراد هذا الجيل أحياء/);

  genStat = { null: { n: 100, a: 98, k: 100, gens: [13, 14] } };
  assert.match(factsHTML(root), /سُجّل ٩٨٪ من أفراد هذه الأجيال أحياء/);
}

console.log('person relationship cases passed');
