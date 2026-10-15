// Structural/content preservation gate, supplemented by the documented mathematical review.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const base='f0659dd';
const files=fs.readdirSync('系统学习笔记').filter(f=>/^0[1-6]_.*\.md$/.test(f));
let paragraphs=0,formulaCount=0;
for(const file of files){
 const filename='系统学习笔记/'+file;
 const before=execFileSync('git',['show',base+':'+filename],{encoding:'utf8'}),after=fs.readFileSync(filename,'utf8');
 const headings=s=>s.match(/^#{1,6} .+$/gm)||[];
 assert.deepEqual(headings(after),headings(before),'Original headings/order changed: '+file);
 for(const anchor of before.matchAll(/<a id="[^"]+"><\/a>/g))assert.ok(after.includes(anchor[0]),'Removed anchor '+anchor[0]);
 const formulas=s=>s.match(/\$\$[\s\S]*?\$\$|(?<!\$)\$(?!\$)[^\n$]+\$(?!\$)/g)||[];
 const af=formulas(after);let cursor=0;
 for(const formula of formulas(before)){const index=af.indexOf(formula,cursor);assert.ok(index>=0,'Removed or changed formula: '+formula);cursor=index+1;formulaCount++;}
 for(const para of before.split(/\n\s*\n/).filter(p=>p.trim())){
   if(after.includes(para)){paragraphs++;continue;}
   const revisedSOI=file.startsWith('02_')&&(para.startsWith('SOI 示例：按指定基准月份')||para.startsWith('对正尺度仿射变换'));
   assert.ok(revisedSOI,'Original content changed outside reviewed SOI correction: '+file+' '+para.slice(0,100));
   assert.ok(after.includes('1933—1992')&&after.includes('完整逐月序列')&&after.includes('课件未给出'),'SOI correction context missing');
 }
}
const baselineChecklist=execFileSync('git',['show',base+':全课程知识点清单.md'],{encoding:'utf8'});
assert.equal(fs.readFileSync('全课程知识点清单.md','utf8'),baselineChecklist,'Knowledge checklist changed');
const entries=[...baselineChecklist.matchAll(/<a id="(K\d+-\d+)"><\/a>/g)].map(m=>m[1]);
assert.equal(entries.length,300);assert.equal(new Set(entries).size,300);
const tsv=fs.readFileSync('系统学习笔记/知识点覆盖索引.tsv','utf8').trim().split('\n').slice(1).map(row=>row.split('\t')[0]);
assert.deepEqual(new Set(tsv),new Set(entries));
console.log(`Preserved six-chapter heading order, explicit anchors, ${paragraphs} original blocks, ${formulaCount} original formulas and 300 checklist entries; only two declared SOI context blocks revised.`);
