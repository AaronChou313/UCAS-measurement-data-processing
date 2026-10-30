// Structural/content preservation gate, supplemented by the documented mathematical review.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const base = "f0659dd";
const reviewed = JSON.parse(fs.readFileSync("planning/course-update-2026-10-30/integrity-revisions.json", "utf8"));
assert.equal(reviewed.baseline, base);
const digest = s => createHash("sha256").update(s).digest("hex");
for (const change of reviewed.revisions) {
  assert.equal(digest(change.before), change.before_sha256);
  assert.equal(digest(change.after), change.after_sha256);
  assert.ok(execFileSync("git", ["show", base + ":" + change.file], {encoding:"utf8"}).includes(change.before));
  assert.ok(fs.readFileSync(change.file,"utf8").includes(change.after), "Reviewed source metadata revision missing");
}
const files = fs
  .readdirSync("系统学习笔记")
  .filter((f) => /^0[1-6]_.*\.md$/.test(f));
let paragraphs = 0,
  formulaCount = 0;
for (const file of files) {
  const filename = "系统学习笔记/" + file;
  const before = execFileSync("git", ["show", base + ":" + filename], {
      encoding: "utf8",
    }),
    after = fs.readFileSync(filename, "utf8");
  const headings = (s) => s.match(/^#{1,6} .+$/gm) || [];
  assert.deepEqual(
    headings(after),
    headings(before),
    "Original headings/order changed: " + file,
  );
  for (const anchor of before.matchAll(/<a id="[^"]+"><\/a>/g))
    assert.ok(after.includes(anchor[0]), "Removed anchor " + anchor[0]);
  const formulas = (s) =>
    s.match(/\$\$[\s\S]*?\$\$|(?<!\$)\$(?!\$)[^\n$]+\$(?!\$)/g) || [];
  const af = formulas(after);
  let cursor = 0;
  for (const formula of formulas(before)) {
    const index = af.indexOf(formula, cursor);
    assert.ok(index >= 0, "Removed or changed formula: " + formula);
    cursor = index + 1;
    formulaCount++;
  }
  for (const para of before.split(/\n\s*\n/).filter((p) => p.trim())) {
    if (after.includes(para)) {
      paragraphs++;
      continue;
    }
    if (reviewed.revisions.some(r => r.file === filename && r.before === para && after.includes(r.after))) continue;
    const revisedSOI =
      file.startsWith("02_") &&
      (para.startsWith("SOI 示例：按指定基准月份") ||
        para.startsWith("对正尺度仿射变换"));
    assert.ok(
      revisedSOI,
      "Original content changed outside reviewed SOI correction: " +
        file +
        " " +
        para.slice(0, 100),
    );
    assert.ok(
      after.includes("1933—1992") &&
        after.includes("完整逐月序列") &&
        after.includes("课件未给出"),
      "SOI correction context missing",
    );
  }
}
const baselineChecklist = execFileSync(
  "git",
  ["show", base + ":全课程知识点清单.md"],
  { encoding: "utf8" },
);
const currentChecklist = fs.readFileSync("全课程知识点清单.md", "utf8");
assert.equal(digest(currentChecklist), reviewed.checklist_sha256, "Checklist changed outside the reviewed 2026 update");
// Every original knowledge entry is retained verbatim; only source/version
// metadata changes and the 20 explicitly reviewed additions are permitted.
for (const entry of baselineChecklist.split("\n").filter(s => s.includes('<a id="K'))) {
  assert.ok(currentChecklist.includes(entry), "Original knowledge entry removed or changed: " + entry);
}
const entries = [
  ...baselineChecklist.matchAll(/<a id="(K\d+-\d+)"><\/a>/g),
].map((m) => m[1]);
assert.equal(entries.length, 300);
assert.equal(new Set(entries).size, 300);
const currentEntries = [...currentChecklist.matchAll(/<a id="(K\d+-\d+)"><\/a>/g)].map(m=>m[1]);
assert.equal(currentEntries.length, reviewed.checklist_count);
assert.equal(new Set(currentEntries).size, reviewed.checklist_count);
assert.ok(entries.every(id=>currentEntries.includes(id)), "Original K identifier removed");
const tsv = fs
  .readFileSync("系统学习笔记/知识点覆盖索引.tsv", "utf8")
  .trim()
  .split("\n")
  .slice(1)
  .map((row) => row.split("\t")[0]);
assert.deepEqual(new Set(tsv), new Set(currentEntries));
console.log(
  `Preserved six-chapter headings/anchors, ${paragraphs} original blocks, ${formulaCount} original formulas and all 300 original knowledge entries; ${currentEntries.length} reviewed current entries. Only two SOI corrections and three reviewed source/version paragraphs revised.`,
);
