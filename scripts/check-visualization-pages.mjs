import fs from 'node:fs';
import assert from 'node:assert/strict';
import { DOMParser } from '@xmldom/xmldom';
import { covarianceEllipse, covariancePlot, markovDistribution } from '../.vitepress/theme/visualizations/math.mjs';
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
const markov=elements(c5,'figure',tag=>tag.includes('data-visualization="V18"'))[0];
const sources=elements(c5,'figure',tag=>tag.includes('data-visualization="V18-sources"'))[0];
const periodic=elements(c5,'figure',tag=>tag.includes('data-visualization="V18-periodic"'))[0];
assert.ok(v01 && covStatic && covInteractive && markov && sources && periodic,'Missing visualization root');
assert.equal((v01.match(/data-visualization="V01"/g)||[]).length,3);
for(const id of ['basis-standard','basis-oblique','rotation-active','rotation-passive','order-sr','order-rs']){
  assert.ok(v01.includes(`id="${id}-title"`),id+' SVG is present in SSR');
  for(const kind of ['object','basis','part','axis'])assert.ok(v01.includes(`id="${id}-${kind}"`));
}
for(const [label,value] of [['v',[[3],[1]]],['c',[[2],[1]]],['Rv',[[-1],[3]]],['c′',[[1],[-3]]],['SRx',[[0],[1]]],['RSx',[[0],[2]]]])matrixEquals(v01,label+'的坐标列向量',value);
matrixEquals(covStatic,'已知总体协方差矩阵',[[4,1],[1,1]]);
for(const [html,probability,id] of [[covStatic,false,'cov-shape'],[covInteractive,true,'cov-probability']]){
  assert.ok(html.includes(`id="${id}-title"`));
  assert.ok(html.includes(`d="${covariancePlot(covarianceEllipse(.5),probability).path}"`),'SVG uses wrong covariance/scale');
}
assert.ok(covStatic.includes('edu-principal-axis'),'Static comparison must retain principal axes');
assert.ok(!covInteractive.includes('edu-principal-axis') && !covInteractive.includes('data-curve="unit"'),'Correlation task has one probability contour');
assert.equal(matrices(covInteractive).length,0,'Do not repeat a dynamic matrix in the focused correlation task');
assert.ok(covInteractive.includes('39.35%') && covInteractive.includes('95%') && covInteractive.includes('参数已知'),'Retain probability-scale and known-parameter boundaries');
assert.ok(covInteractive.includes('静态回退：ρ = 0.50'));
assert.ok(!covInteractive.includes('id="cov-rho"'),'No unusable slider in SSR');
// Static path figure distinguishes source, conditional transition and joint contribution.
const sourceGroups=elements(sources,'g',tag=>tag.includes('data-source-probability='));
assert.equal(sourceGroups.length,2);
for(const [j,expected] of [[0,[.8,.95,.76]],[1,[.2,.03,.006]]]){
  const root=new DOMParser().parseFromString(sourceGroups[j],'application/xml').documentElement;
  for(const [index,attribute] of ['data-source-probability','data-transition-probability','data-joint-contribution'].entries())assert.ok(Math.abs(+root.getAttribute(attribute)-expected[index])<1e-12);
  const paths=Array.from(root.getElementsByTagName('path'));assert.equal(paths.length,1);
  assert.equal(paths[0].getAttribute('stroke-width'),'2','Equal-width arrows must not encode different probabilities');
  assert.ok(root.textContent.includes(j===0?'0.760':'0.006'),'Actual contribution label');
}
assert.ok(sources.includes('0.760 + 0.006 = 0.766') && sources.includes('条件概率'));
// The default distribution is the actual model, with a fixed probability scale.
const distribution=elements(markov,'div',tag=>tag.includes('data-city-probability='))[0];
const current=new DOMParser().parseFromString(distribution,'application/xml').documentElement;
assert.equal(+current.getAttribute('data-time'),0);
assert.equal(+current.getAttribute('data-city-probability'),.8);assert.ok(Math.abs(+current.getAttribute('data-rural-probability')-.2)<1e-12);
const tracks=Array.from(current.getElementsByTagName('div')).filter(e=>e.getAttribute('class')==='edu-probability-track');
assert.equal(tracks.length,2);
tracks.forEach((track,j)=>{const bar=track.getElementsByTagName('span')[0];assert.ok(Math.abs(+bar.getAttribute('style').match(/width:([\d.]+)%/)[1]-[80,20][j])<1e-10,'Displayed bar lengths are probabilities');});
assert.ok(markov.includes('left:37.5%') && markov.includes('left:62.5%'),'Stationary references use correct probabilities');
assert.ok(markov.includes('76.60%') && markov.includes((100*markovDistribution('city',.8,60)[0]).toFixed(2)+'%'),'No-JS snapshot includes a later-time comparison');
assert.ok(markov.includes('居民停止迁移'),'Distribution versus individual boundary');
const periodGroups=elements(periodic,'g',tag=>tag.includes('data-time='));assert.equal(periodGroups.length,4);
for(const [k,source] of periodGroups.entries()){
  const root=new DOMParser().parseFromString(source,'application/xml').documentElement;
  const expected=markovDistribution('alternating',1,k);
  assert.equal(+root.getAttribute('data-time'),k);
  assert.equal(+root.getAttribute('data-city-probability'),expected[0]);assert.equal(+root.getAttribute('data-rural-probability'),expected[1]);
  const bars=Array.from(root.getElementsByTagName('rect'));assert.equal(bars.length,2);
  bars.forEach((bar,j)=>{assert.equal(+bar.getAttribute('height'),100*expected[j]);assert.equal(+bar.getAttribute('y'),140-100*expected[j]);});
}
assert.ok(periodic.includes('(1/2, 1/2)') && periodic.includes('从平稳分布出发才保持不变'));
for(const html of [markov,sources,periodic]){
  assert.ok(!html.includes('<table') && !html.includes('data-matrix-label=') && !html.includes('<details'),'No duplicated calculation UI');
  assert.ok(!html.includes('<button') && !html.includes('<select'),'No inactive JS-only controls in SSR');
}
// Each aid lives after the concepts it uses, not in one giant module before stationarity.
const stationarity=c5.indexOf('5.1.4 平稳分布',c5.indexOf('id="v18-sources"'));
assert.ok(c5.indexOf('id="v18-sources"')<stationarity && stationarity<c5.indexOf('id="v18-markov"'));
assert.ok(c5.indexOf('id="v18-markov"')<c5.indexOf('id="v18-periodic"'));
for(const html of [v01,covStatic+covInteractive,sources+markov+periodic]){
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate visualization ids');
}
console.log('Verified focused SSR figures: source/conditional/joint probabilities, time bars, stationary references, periodic bars, covariance scale and static fallbacks.');

// The actual source placements must survive SSR, including every raw SVG (no JavaScript needed).
const courseCatalog=JSON.parse(fs.readFileSync(new URL('../.vitepress/theme/visualizations/figures/full/catalog.json',import.meta.url),'utf8'));
const placements=JSON.parse(fs.readFileSync(new URL('../planning/visualization-v1/placements.json',import.meta.url),'utf8'));
assert.deepEqual(new Set(placements.map(p=>p.id)),new Set(Object.keys(courseCatalog)),'Every generated aid needs a real reading position');
for(const n of [1,2,3,4,5,6]){
  const html=load(n),ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'Duplicate ID on chapter '+n);
  for(const place of placements.filter(p=>p.chapter===n)){
    const aid=elements(html,'figure',tag=>tag.includes(`id="${place.id}"`))[0],definition=courseCatalog[place.id];assert.ok(aid,'Missing SSR '+place.id);
    assert.ok(aid.includes(definition.title));assert.ok(aid.includes('<figcaption>')&&!aid.includes('<button'),'Static scientific aid is fully readable without JS');
    for(const panel of definition.panels){const svg=fs.readFileSync(new URL(`../.vitepress/theme/visualizations/figures/full/${panel.file}.svg`,import.meta.url),'utf8').trim();assert.ok(aid.includes(svg),'Actual raw SVG absent or changed: '+panel.file);}
  }
}
const kalman=elements(load(6),'figure',tag=>tag.includes('id="v26-kalman"'))[0];assert.ok(kalman);
assert.ok(kalman.includes('data-stage="0"')&&kalman.includes('data-estimate="9"')&&kalman.includes('data-variance="4"'));
assert.ok(kalman.includes('11.6 m')&&kalman.includes('1.4 m/s')&&kalman.includes('1.8 m²/s²'),'All no-JS stages have a numerical comparison');
assert.ok(!kalman.includes('<button'),'No inactive stage controls without JS');
console.log(`Verified ${placements.length} course aids / ${Object.values(courseCatalog).reduce((s,f)=>s+f.panels.length,0)} raw SVGs and V26 static fallback in production HTML.`);
