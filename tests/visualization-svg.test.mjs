import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DOMParser } from '@xmldom/xmldom';
const names=['basis-standard','basis-oblique','rotation-active','rotation-passive','order-sr','order-rs'];

test('V01: 六幅真实SVG的标记引用、屏幕坐标与数学端点一致', () => {
  const globalIds=new Set();
  for(const name of names){
    const source=fs.readFileSync(new URL(`../.vitepress/theme/visualizations/figures/${name}.svg`,import.meta.url),'utf8');
    const document=new DOMParser().parseFromString(source,'image/svg+xml');
    const elements=Array.from(document.getElementsByTagName('*'));
    const ids=new Set(elements.map(e=>e.getAttribute('id')).filter(Boolean));
    for(const id of ids){assert.ok(!globalIds.has(id),`Duplicate SVG id ${id}`);globalIds.add(id);}
    assert.ok(ids.has(name+'-title') && ids.has(name+'-desc'));
    for(const line of elements.filter(e=>e.tagName==='line')){
      const from=line.getAttribute('data-from').split(',').map(Number),to=line.getAttribute('data-to').split(',').map(Number);
      for(const [attribute,expected] of [['x1',142+43*from[0]],['y1',203-43*from[1]],['x2',142+43*to[0]],['y2',203-43*to[1]]])
        assert.ok(Math.abs(+line.getAttribute(attribute)-expected)<1e-10,`${name}: ${attribute}`);
      const marker=line.getAttribute('marker-end');if(marker)assert.ok(ids.has(marker.match(/#([^)]*)/)[1]),`${name}: dangling marker`);
    }
    const objects=elements.filter(e=>e.tagName==='line' && e.getAttribute('class')==='object');
    const expected=name==='rotation-active'?[-1,3]:name==='order-sr'?[0,1]:name==='order-rs'?[0,2]:[3,1];
    assert.ok(objects.some(e=>e.getAttribute('data-to').split(',').map(Number).every((v,i)=>Math.abs(v-expected[i])<1e-10)),name+': wrong final vector');
  }
});

test('V01: 斜基原点基向量与首尾构造不是同一组端点', () => {
  const source=fs.readFileSync(new URL('../.vitepress/theme/visualizations/figures/basis-oblique.svg',import.meta.url),'utf8');
  const doc=new DOMParser().parseFromString(source,'image/svg+xml');
  const lines=Array.from(doc.getElementsByTagName('line'));
  const has=(kind,from,to)=>lines.some(e=>e.getAttribute('class')===kind && e.getAttribute('data-from')===from && e.getAttribute('data-to')===to);
  assert.ok(has('basis','0,0','1,0'));assert.ok(has('basis','0,0','1,1'));
  assert.ok(has('part','0,0','2,0'));assert.ok(has('part','2,0','3,1'));
  assert.ok(source.includes('>b₁</text>') && source.includes('>b₂</text>') && source.includes('>2b₁</text>'));
});
