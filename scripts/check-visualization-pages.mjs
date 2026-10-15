import fs from 'node:fs';
import assert from 'node:assert/strict';
import { DOMParser } from '@xmldom/xmldom';
import { covarianceEllipse, covariancePlot } from '../.vitepress/theme/visualizations/math.mjs';
const load = n => fs.readFileSync(new URL(`../.vitepress/dist/notes/chapter-${n}.html`,import.meta.url),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
// Extract a balanced element from actual SSR HTML, not a Vue source or a script string.
function elements(html, tag, predicate) {
  const result=[];
  for(const match of html.matchAll(new RegExp(`<${tag}\\b[^>]*>`,'g'))){
    if(!predicate(match[0]))continue;
    const tail=html.slice(match.index);let depth=0;
    for(const token of tail.matchAll(new RegExp(`</?${tag}\\b[^>]*>`,'g'))){
      depth+=token[0].startsWith('</')?-1:1;
      if(depth===0){result.push(tail.slice(0,token.index+token[0].length));break;}
    }
  }
  return result;
}
function matrices(html) {
  return elements(html,'span',tag=>tag.includes('data-matrix-label=')).map(source=>{
    const root=new DOMParser().parseFromString(source,'application/xml').documentElement;
    const rows=Array.from({length:+root.getAttribute('data-rows')},()=>[]);
    for(const cell of Array.from(root.getElementsByTagName('span')).filter(e=>e.hasAttribute('data-row'))){
      const raw=cell.textContent.trim().replaceAll('−','-');
      rows[+cell.getAttribute('data-row')][+cell.getAttribute('data-col')]=/^[-\d.]+$/.test(raw)?Number(raw):raw;
    }
    assert.ok(rows.every(row=>row.length===+root.getAttribute('data-columns')),'Ragged SSR matrix');
    assert.ok(root.getAttribute('aria-label').includes(`${rows.length}行${rows[0].length}列`),'Missing matrix reading order');
    return {label:root.getAttribute('data-matrix-label'),rows};
  });
}
function matrixEquals(html,label,expected){
  const matrix=matrices(html).find(m=>m.label===label);assert.ok(matrix,`Missing SSR matrix ${label}`);assert.deepEqual(matrix.rows,expected,label);
}
const c1=load(1),c4=load(4),c5=load(5);
const v01=elements(c1,'figure',tag=>tag.includes('data-visualization="V01"')).join('');
const covStatic=elements(c4,'figure',tag=>tag.includes('data-visualization="V14-static"'))[0];
const covInteractive=elements(c4,'figure',tag=>tag.includes('data-visualization="V14-interactive"'))[0];
const markov=elements(c5,'section',tag=>tag.includes('data-visualization="V18"'))[0];
assert.ok(v01 && covStatic && covInteractive && markov,'Missing visualization root');
assert.equal((v01.match(/data-visualization="V01"/g)||[]).length,3);
for(const id of ['basis-standard','basis-oblique','rotation-active','rotation-passive','order-sr','order-rs']){
  assert.ok(v01.includes(`id="${id}-title"`),id+' SVG is present in SSR');
  for(const kind of ['object','basis','part','axis'])assert.ok(v01.includes(`id="${id}-${kind}"`));
}
for(const [label,value] of [['v',[[3],[1]]],['c',[[2],[1]]],['Rv',[[-1],[3]]],['c′',[[1],[-3]]],['SRx',[[0],[1]]],['RSx',[[0],[2]]]])matrixEquals(v01,label+'的坐标列向量',value);
matrixEquals(covStatic,'已知总体协方差矩阵',[[4,1],[1,1]]);
matrixEquals(covInteractive,'当前总体协方差矩阵',[[4,1],[1,1]]);
for(const [html,probability,id] of [[covStatic,false,'cov-shape'],[covInteractive,true,'cov-probability']]){
  assert.ok(html.includes(`id="${id}-title"`));
  assert.ok(html.includes(`d="${covariancePlot(covarianceEllipse(.5),probability).path}"`),'SVG uses wrong covariance/scale');
}
assert.ok(covInteractive.includes('5.077 m') && covInteractive.includes('2.044 m') && covInteractive.includes('3.500 m²'),'Missing default scales');
assert.ok(covInteractive.includes('静态回退：ρ = 0.50'));
assert.ok(!covInteractive.includes('id="cov-rho"'),'No unusable slider in SSR');
matrixEquals(markov,'转移矩阵，列为出发，行为到达',[[.95,.03],[.05,.97]]);
matrixEquals(markov,'当前时刻的概率列向量',[[.8],[.2]]);
matrixEquals(markov,'下一时刻的概率列向量',[[.766],[.234]]);
matrixEquals(markov,'默认城市模型第二步的概率列向量',[[.73472],[.26528]]);
for(const [key,value] of [['0,0','0.95×0.8≈0.76'],['0,1','0.03×0.2≈0.006'],['1,0','0.05×0.8≈0.04'],['1,1','0.97×0.2≈0.194']]){
  const cell=elements(markov,'td',tag=>tag.includes(`data-contribution="${key}"`))[0];assert.ok(cell);
  assert.equal(cell.replace(/<[^>]*>/g,'').replace(/\s/g,''),value,'Wrong source contribution in SSR');
}
assert.ok(/<details[^>]*class="edu-fallback"[^>]*\bopen[ >]/.test(markov),'No-JS fallback must be expanded');
assert.ok(markov.includes('k=1') && markov.includes('k=2') && markov.includes('交替模型从 u₀=1 出发'),'Missing odd/even counterexample');
assert.ok(!markov.includes('<button') && !markov.includes('<select'),'No inactive JS-only controls in SSR');
for(const html of [v01,covStatic+covInteractive,markov]){
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate visualization ids');
}
console.log('Verified SSR mathematical matrices/vectors, SVG/model agreement, four source contributions, counterexamples and expanded no-JS fallback.');
