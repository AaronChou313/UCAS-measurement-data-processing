import fs from 'node:fs';
import assert from 'node:assert/strict';
const load = n => fs.readFileSync(new URL(`../.vitepress/dist/notes/chapter-${n}.html`,import.meta.url),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
const c1=load(1),c4=load(4),c5=load(5);
assert.equal((c1.match(/data-visualization="V01"/g)||[]).length,3);
for(const id of ['basis-standard','basis-oblique','rotation-active','rotation-passive','order-sr','order-rs']){
  assert.ok(c1.includes(`id="${id}-title"`),id+' SVG is present in SSR');
  for(const kind of ['object','basis','part','axis'])assert.ok(c1.includes(`id="${id}-${kind}"`));
}
for(const id of ['v01-basis','v01-rotation','v01-order'])assert.ok(c1.includes(`id="${id}"`));
assert.ok(c4.includes('data-visualization="V14-static"'));
assert.ok(c4.includes('data-visualization="V14-interactive"'));
for(const id of ['cov-shape-title','cov-probability-title'])assert.ok(c4.includes(`id="${id}"`));
assert.ok(c4.includes('5.077 m；2.044 m'));
assert.ok(c4.includes('3.500 m²'));
assert.ok(c4.includes('静态回退：以下图表固定在 ρ = 0.50'));
assert.ok(!c4.includes('id="cov-rho"'),'No unusable slider in SSR');
assert.ok(c5.includes('<details class="edu-fallback" open>'));
assert.ok(c5.includes('0.73472'));
assert.ok(c5.includes('交替模型从 u₀=1 出发'));
assert.ok(c5.includes('下方静态回退表列出默认模型的完整乘积与求和。'));
assert.ok(!c5.includes('>下一步</button>'),'No unusable step button in SSR');
assert.ok(!c5.includes('<select'),'No unusable model selector in SSR');
console.log('Verified SSR: 6 coordinate SVGs, 2 covariance SVGs with default values, full Markov static fallback, and no inactive JS-only controls.');
