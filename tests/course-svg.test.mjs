import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { DOMParser } from "@xmldom/xmldom";
const root = new URL(
  "../.vitepress/theme/visualizations/figures/full/",
  import.meta.url,
);
const catalog = JSON.parse(
  fs.readFileSync(new URL("catalog.json", root), "utf8"),
);
const read = (name) => fs.readFileSync(new URL(name + ".svg", root), "utf8");
test("all generated scientific panels are referenced once, have unique accessible IDs and finite geometry", () => {
  const declared = Object.values(catalog).flatMap((f) =>
    f.panels.map((p) => p.file),
  );
  assert.equal(new Set(declared).size, declared.length);
  const actual = fs
    .readdirSync(root)
    .filter((n) => n.endsWith(".svg"))
    .map((n) => n.slice(0, -4));
  assert.deepEqual(actual.sort(), declared.sort());
  const ids = new Set();
  for (const file of declared) {
    const src = read(file);
    assert.ok(!/NaN|Infinity|undefined/.test(src), file);
    const doc = new DOMParser({
        onError: (level, msg) => {
          throw new Error(file + ":" + msg);
        },
      }).parseFromString(src, "image/svg+xml"),
      svg = doc.documentElement;
    assert.equal(svg.getAttribute("viewBox"), "0 0 360 280");
    assert.ok(svg.getElementsByTagName("title")[0].textContent.length > 3);
    assert.ok(svg.getElementsByTagName("desc")[0].textContent.length > 10);
    for (const el of Array.from(svg.getElementsByTagName("*")))
      if (el.hasAttribute("id")) {
        const id = el.getAttribute("id");
        assert.ok(!ids.has(id), "duplicate " + id);
        ids.add(id);
      }
    for (const attr of svg.getAttribute("aria-labelledby").split(" "))
      assert.ok(ids.has(attr));
  }
});
test("V02 actual SVG uses equal scales and correct observed, fitted and residual endpoints", () => {
  const s = read("v02-observation");
  for (const xy of [
    ["190", "170"],
    ["118", "134"],
  ])
    assert.ok(s.includes(`cx="${xy[0]}" cy="${xy[1]}"`));
  assert.ok(s.includes('x1="118" y1="134" x2="190" y2="170"'));
});
test("V22 steep shrinkage is sampled at lambda .01, rather than linearly bridging its bend", () => {
  const s = read("v22-shrink");
  assert.ok(
    s.includes("48.705,134"),
    "small singular-direction factor at .01 must be .5",
  );
});
test("V28 arrows end at node boundaries and V29 gradient numbers stay actual outputs", () => {
  assert.ok(read("v28-forward").includes('x2="272" y2="140"'));
  assert.ok(read("v28-backward").includes('x2="88" y2="140"'));
  const doc = new DOMParser().parseFromString(
    read("v29-gradients"),
    "image/svg+xml",
  );
  const values = Array.from(doc.getElementsByTagName("text"))
    .slice(0, 9)
    .map((e) => +e.textContent);
  assert.deepEqual(values, [1, 1, 0, 1, 0, -1, 0, -1, -1]);
});
