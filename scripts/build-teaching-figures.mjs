import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { basisExample, matVec, rotation } from '../.vitepress/theme/visualizations/math.mjs';

const output = fileURLToPath(new URL('../.vitepress/theme/visualizations/figures/', import.meta.url));
const check = process.argv.includes('--check');
const px = x => 142 + x * 43;
const py = y => 203 - y * 43;
const point = ([x, y]) => `${px(x)},${py(y)}`;
const neat = x => Math.abs(x) < 1e-10 ? 0 : Number(x.toFixed(3));
const label = (x, y, text, extra = '') => `<text x="${x}" y="${y}" ${extra}>${text}</text>`;
function line(a, b, kind = 'object', arrow = true) {
  return `<line x1="${px(a[0])}" y1="${py(a[1])}" x2="${px(b[0])}" y2="${py(b[1])}" class="${kind}" ${arrow ? 'marker-end="url(#ID-' + kind + ')"' : ''}/>`;
}
function frame(id, title, description, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 330" role="img" aria-labelledby="${id}-title ${id}-desc">
<title id="${id}-title">${title}</title><desc id="${id}-desc">${description}</desc>
<defs>${['object', 'basis', 'part', 'axis'].map(k => `<marker id="${id}-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" class="fill-${k}"/></marker>`).join('')}</defs>
<rect x="0" y="0" width="360" height="330" class="plot-bg" rx="4"/>
${label(18, 28, title, 'class="plot-heading"')}
${line([-2.65, 0], [4.4, 0], 'axis')}${line([0, -1.8], [0, 3.65], 'axis')}
${[-2,-1,1,2,3,4].map(x => `${line([x,-.06],[x,.06],'tick',false)}${label(px(x),py(0)+18,x,'text-anchor="middle" class="tick-text"')}`).join('')}
${[-1,1,2,3].map(y => `${line([-.06,y],[.06,y],'tick',false)}${label(px(0)-12,py(y)+4,y,'text-anchor="end" class="tick-text"')}`).join('')}
${label(px(4.4)-3,py(0)-10,'x', 'class="axis-label"')}${label(px(0)+10,py(3.65)+4,'y','class="axis-label"')}
${label(px(0)-14,py(0)+18,'O','class="tick-text"')}
${body.replaceAll('ID-', id + '-')}
</svg>\n`.replaceAll('ID-', id + '-');
}
const v = basisExample.vector;
const object = line([0,0],v) + `<circle cx="${px(3)}" cy="${py(1)}" r="3" class="fill-object"/>`;
const figures = new Map();
figures.set('basis-standard.svg', frame('basis-standard','标准基：坐标 (3, 1)', '固定向量从原点指向(3,1)，先走3个横向标准基，再走1个纵向标准基。',
  line([0,0],[3,0],'part')+line([3,0],v,'part')+object+
  label(193,251,'3e₁','class="part-label"')+label(279,185,'e₂','class="part-label"')+
  label(239,143,'v = (3, 1)','class="object-label"')+label(18,292,'先沿 e₁ 走 3，再沿 e₂ 走 1。')+label(18,314,'箭头终点是固定参考中的 (3, 1)。')));
figures.set('basis-oblique.svg', frame('basis-oblique','斜基：坐标 (2, 1)', '物理向量仍指向(3,1)，新基b1=(1,0)、b2=(1,1)。先走2b1，再走b2，得到同一向量。',
  line([0,0],[1,0],'basis')+line([0,0],[1,1],'basis')+
  line([0,0],[2,0],'part')+line([2,0],v,'part')+object+
  label(173,251,'2b₁','class="part-label"')+label(251,195,'b₂','class="part-label"')+
  label(170,147,'b₂ = (1, 1)','class="basis-label"')+label(282,162,'v','class="object-label"')+
  label(18,292,'v = 2b₁ + b₂，物理箭头没有动。')+label(18,314,'B 改变了，坐标随之改为 (2, 1)。')));
const active = matVec(rotation(Math.PI / 2),v).map(neat);
figures.set('rotation-active.svg', frame('rotation-active','主动：转向量，轴不动', '标准坐标轴固定，向量(3,1)逆时针旋转90度成为(-1,3)。',
  line([0,0],v,'ghost',false)+line([0,0],active)+
  label(238,145,'原 v = (3, 1)','class="muted-label"')+label(19,58,'Rv = (−1, 3)','class="object-label"')+
  label(18,292,'同一套轴，比较变换前后的对象。')+label(18,314,'R(π/2)v = (−1, 3)ᵀ。')));
const passive = matVec(rotation(-Math.PI / 2),v).map(neat);
figures.set('rotation-passive.svg', frame('rotation-passive','被动：转坐标轴，向量不动', '物理箭头仍从原点指向(3,1)。新横轴向上，新纵轴向左，新坐标为(1,-3)。',
  line([0,0],[0,3.2],'basis')+line([0,0],[-2.5,0],'basis')+object+
  line([0,0],[0,1],'part')+line([0,1],v,'part')+
  label(151,57,'x′','class="basis-label"')+label(26,190,'y′','class="basis-label"')+
  label(236,143,'v 仍是原箭头','class="object-label"')+
  label(18,292,`新坐标 = (1, ${passive[1] === -3 ? '−3' : passive[1]})。`)+label(18,314,'沿 x′ 走 1，沿 y′ 走 −3；c′ = Rᵀv。')));
for (const [name, first, last, title, detail] of [
  ['order-sr.svg',[0,1],[0,1],'SR：先旋转，再缩放','S 对纵向不再拉长：终点 (0, 1)。'],
  ['order-rs.svg',[2,0],[0,2],'RS：先缩放，再旋转','横向先拉长到 2：终点 (0, 2)。'],
]) {
  figures.set(name, frame(name.slice(0,-4),title,detail,
    line([0,0],[1,0],'ghost',false)+line([0,0],first,'part')+line([0,0],last)+
    label(198,251,'输入 (1, 0)','class="muted-label"')+
    label(155,py(last[1])-10,`输出 (0, ${last[1]})`,'class="object-label"')+
    label(18,292,'R = R(π/2)，S = diag(2, 1)。')+label(18,314,detail)));
}
fs.mkdirSync(output, { recursive: true });
for (const [name, svg] of figures) {
  const dest = path.join(output, name);
  if (check) {
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8') !== svg) throw new Error(`Figure out of date: ${name}`);
  } else fs.writeFileSync(dest, svg);
}
console.log(`${check ? 'Verified' : 'Generated'} ${figures.size} deterministic coordinate SVGs.`);
