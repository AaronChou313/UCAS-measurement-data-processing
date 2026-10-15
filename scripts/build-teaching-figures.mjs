import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { basisExample, matVec, rotation } from '../.vitepress/theme/visualizations/math.mjs';
const output = fileURLToPath(new URL('../.vitepress/theme/visualizations/figures/',import.meta.url));
const check = process.argv.includes('--check');
const px = x => 142+43*x, py = y => 203-43*y;
const neat = x => Math.abs(x)<1e-10 ? 0 : Number(x.toFixed(3));
const label = (x,y,text,extra='') => `<text x="${x}" y="${y}" ${extra}>${text}</text>`;
function line(a,b,kind='object',arrow=true) {
  return `<line x1="${px(a[0])}" y1="${py(a[1])}" x2="${px(b[0])}" y2="${py(b[1])}" class="${kind}" data-from="${a.join(',')}" data-to="${b.join(',')}" ${arrow ? `marker-end="url(#ID-${kind})"` : ''}/>`;
}
function frame(id,title,description,body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 285" role="img" aria-labelledby="${id}-title ${id}-desc">
<title id="${id}-title">${title}</title><desc id="${id}-desc">${description}</desc>
<defs>${['object','basis','part','axis'].map(k=>`<marker id="${id}-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="fill-${k}"/></marker>`).join('')}</defs>
<rect width="360" height="285" class="plot-bg" rx="4"/>
${label(18,28,title,'class="plot-heading"')}
${line([-2.65,0],[4.4,0],'axis')}${line([0,-1.8],[0,3.65],'axis')}
${[-2,-1,1,2,3,4].map(x=>line([x,-.06],[x,.06],'tick',false)+label(px(x),py(0)+18,x,'text-anchor="middle" class="tick-text"')).join('')}
${[-1,1,2,3].map(y=>line([-.06,y],[.06,y],'tick',false)+label(px(0)-12,py(y)+4,y,'text-anchor="end" class="tick-text"')).join('')}
${label(px(4.4)-3,py(0)-10,'x',id==='rotation-passive'?'class="muted-label"':'')}${label(px(0)+(id==='rotation-passive'?-20:10),py(3.65)+4,'y',id==='rotation-passive'?'class="muted-label"':'')}${label(px(0)-14,py(0)+18,'O','class="tick-text"')}
${body}
</svg>\n`.replaceAll('ID-',id+'-');
}
const v=basisExample.vector;
const object=line([0,0],v)+`<circle cx="${px(v[0])}" cy="${py(v[1])}" r="3" class="fill-object"/>`;
const figures=new Map();
figures.set('basis-standard.svg',frame('basis-standard','标准基：坐标 (3, 1)','同一向量指向(3,1)，按标准基先走3e1，再走e2。',
  line([0,0],[3,0],'part')+line([3,0],v,'part')+object+
  label(193,251,'3e₁','class="part-label"')+label(279,185,'e₂','class="part-label"')+label(239,143,'v','class="object-label edu-svg-vector"')));
figures.set('basis-oblique.svg',frame('basis-oblique','斜基：坐标 (2, 1)','b1=(1,0)、b2=(1,1)。棕箭头各是一份基向量；蓝虚线先走2b1再走b2，物理终点仍为(3,1)。b2不要求单位长度。',
  line([0,0],[1,0],'basis')+line([0,0],[1,1],'basis')+line([0,0],[2,0],'part')+line([2,0],v,'part')+object+
  label(204,265,'2b₁','class="part-label"')+label(280,194,'b₂','class="part-label"')+
  label(160,141,'b₂','class="basis-label edu-svg-vector"')+label(164,243,'b₁','class="basis-label edu-svg-vector"')+label(282,162,'v','class="object-label edu-svg-vector"')));
const active=matVec(rotation(Math.PI/2),v).map(neat);
figures.set('rotation-active.svg',frame('rotation-active','主动：转向量，轴不动','固定标准坐标轴，向量(3,1)逆时针旋转90度成为(-1,3)。',
  line([0,0],v,'ghost',false)+line([0,0],active)+label(238,145,'原 v','class="muted-label"')+label(70,58,'Rv','class="object-label edu-svg-vector"')));
figures.set('rotation-passive.svg',frame('rotation-passive','被动：转坐标轴，向量不动','物理向量不动；新横轴向上，新纵轴向左，新坐标为(1,-3)，等于R的转置乘原坐标。',
  line([0,0],[0,3.2],'basis')+line([0,0],[-2.5,0],'basis')+object+line([0,0],[0,1],'part')+line([0,1],v,'part')+
  label(151,57,'x′','class="basis-label"')+label(26,190,'y′','class="basis-label"')+label(236,143,'v 不动','class="object-label edu-svg-vector"')));
const r=rotation(Math.PI/2),s=[[2,0],[0,1]],input=[1,0];
for(const [name,first,final,title] of [
  ['order-sr',matVec(r,input),matVec(s,matVec(r,input)),'SR：先旋转，再缩放'],
  ['order-rs',matVec(s,input),matVec(r,matVec(s,input)),'RS：先缩放，再旋转'],
]) {
  const a=first.map(neat),b=final.map(neat);
  figures.set(name+'.svg',frame(name,title,`R为逆时针90度，S=diag(2,1)。输入(1,0)，第一步(${a})，最终(${b})。蓝空心圆为第一步终点，绿色为最终向量。`,
    line([0,0],input,'ghost',false)+line([0,0],a,'part')+line([0,0],b)+`<circle cx="${px(a[0])}" cy="${py(a[1])}" r="6" class="part" fill="none"/>`+
    label(198,251,'输入 (1, 0)','class="muted-label"')+label(155,py(b[1])-10,`输出 (0, ${b[1]})`,'class="object-label"')));
}
if(!check)fs.mkdirSync(output,{recursive:true});
for(const [name,svg] of figures){
  const dest=path.join(output,name);
  if(check){if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==svg)throw new Error(`Figure out of date: ${name}`);}
  else fs.writeFileSync(dest,svg);
}
console.log(`${check?'Verified':'Generated'} ${figures.size} deterministic coordinate SVGs.`);
