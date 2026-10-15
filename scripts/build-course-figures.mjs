import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  projectionExample,
  linspace,
  normalPdf,
  intervalExperiment,
  randomSource,
  kde,
  kdeSample,
  regressionBand,
  regressionData,
  fourFits,
  equalCorrelationData,
  squareSeries,
  sinc,
  spectrum,
  tone,
  ggmCoefficients,
  ggmSpectrum,
  noiseExample,
  highDimension,
  softThreshold,
  svdExample,
  pcaData,
  pcaAngle,
  pcaProjection,
  branchNetwork,
  convolutionInput,
  convolutionKernel,
  convolutionExample,
  multiply,
  dot,
} from "../.vitepress/theme/visualizations/full-math.mjs";
const target = fileURLToPath(
  new URL("../.vitepress/theme/visualizations/figures/full/", import.meta.url),
);
const check = process.argv.includes("--check");
const files = new Map(),
  catalog = {};
const ink = "var(--edu-ink,#333)",
  muted = "var(--edu-muted,#606872)",
  green = "var(--edu-object,#226451)",
  blue = "var(--edu-part,#3b65a0)",
  brown = "var(--edu-basis,#855224)",
  gray = "var(--edu-axis,#707a81)";
const fmt = (x) =>
  Math.abs(x) < 1e-10 ? "0" : Number(x.toFixed(3)).toString();
const esc = (x) =>
  String(x)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
function text(x, y, t, anchor = "start", color = ink) {
  return `<text x="${fmt(x)}" y="${fmt(y)}" text-anchor="${anchor}" style="font:16px system-ui,sans-serif;fill:${color === gray ? muted : color}">${esc(t)}</text>`;
}
function line(a, b, color = gray, dash = "", width = 1.5) {
  return `<line x1="${fmt(a[0])}" y1="${fmt(a[1])}" x2="${fmt(b[0])}" y2="${fmt(b[1])}" style="stroke:${color};stroke-width:${width};${dash ? "stroke-dasharray:" + dash : ""}"/>`;
}
function path(
  points,
  color = green,
  dash = "",
  width = 2.2,
  close = false,
  fill = "none",
) {
  return `<path d="${points.map((p, i) => (i ? "L" : "M") + p.map(fmt).join(",")).join(" ")}${close ? " Z" : ""}" style="fill:${fill};stroke:${color};stroke-width:${width};${dash ? "stroke-dasharray:" + dash : ""}"/>`;
}
function circle(x, y, r = 4, color = green) {
  return `<circle cx="${fmt(x)}" cy="${fmt(y)}" r="${r}" style="fill:${color}"/>`;
}
function svg(name, title, desc, body, w = 360, h = 280) {
  const id = "full-" + name;
  files.set(
    name + ".svg",
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-title ${id}-desc"><title id="${id}-title">${esc(title)}</title><desc id="${id}-desc">${esc(desc)}</desc>${body}</svg>\n`,
  );
  return name;
}
function figure(id, candidate, title, lead, panels, caption) {
  catalog[id] = { candidate, title, lead, panels, caption };
}
function plane(xmin, xmax, ymin, ymax, xticks, yticks, xlabel, ylabel) {
  const px = (x) => 48 + ((x - xmin) / (xmax - xmin)) * 282,
    py = (y) => 224 - ((y - ymin) / (ymax - ymin)) * 180;
  let body = line([48, 224], [330, 224]) + line([48, 44], [48, 224]);
  for (const x of xticks)
    body += line([px(x), 221], [px(x), 227]) + text(px(x), 248, x, "middle");
  for (const y of yticks)
    body += line([45, py(y)], [51, py(y)]) + text(39, py(y) + 5, y, "end");
  body += text(330, 274, xlabel, "end") + text(48, 22, ylabel);
  return { px, py, body };
}
function geoPlane(xmin, xmax, ymin, ymax, xticks, yticks, xlabel, ylabel) {
  const scale = Math.min(250 / (xmax - xmin), 180 / (ymax - ymin));
  const left = 48 + (282 - (xmax - xmin) * scale) / 2;
  const px = (x) => left + (x - xmin) * scale,
    py = (y) => 224 - (y - ymin) * scale;
  let body =
    line([px(xmin), 224], [px(xmax), 224]) +
    line([px(xmin), py(ymax)], [px(xmin), 224]);
  for (const x of xticks)
    body += line([px(x), 221], [px(x), 227]) + text(px(x), 248, x, "middle");
  for (const y of yticks)
    body +=
      line([px(xmin) - 3, py(y)], [px(xmin) + 3, py(y)]) +
      text(px(xmin) - 9, py(y) + 5, y, "end");
  if (xmin < 0 && xmax > 0)
    body += line([px(0), py(ymin)], [px(0), py(ymax)], gray, "1 4");
  if (ymin < 0 && ymax > 0)
    body += line([px(xmin), py(0)], [px(xmax), py(0)], gray, "1 4");
  body += text(330, 274, xlabel, "end") + text(48, 22, ylabel);
  return { px, py, body };
}
const m = projectionExample();
let b = line([35, 145], [325, 145], gray);
for (const x of [0, 0.4, 0.8, 1.2, 1.6]) {
  const p = 45 + x * 160;
  b += line([p, 141], [p, 149]) + text(p, 176, x, "middle");
}
b +=
  circle(45 + m.beta * 160, 145, 6) +
  text(45 + m.beta * 160, 110, "β̂ = 0.8", "middle", green) +
  text(324, 213, "参数 β（一个数）", "end") +
  text(36, 55, "参数空间：一维") +
  text(36, 250, "乘 X 后得到拟合向量");
svg(
  "v02-parameter",
  "一维参数空间",
  "标出最小二乘参数0.8；不是观测平面中的坐标轴。",
  b,
);
// Equal scales in the observation plane: one unit occupies 60 pixels on each axis.
const px = (x) => 70 + x * 60,
  py = (y) => 230 - y * 60;
b =
  line([px(0), py(0)], [px(2.8), py(0)]) +
  line([px(0), py(0)], [px(0), py(3.3)]);
for (const x of [0, 1, 2]) b += text(px(x), py(0) + 23, x, "middle");
for (const y of [1, 2, 3]) b += text(px(0) - 12, py(y) + 5, y, "end");
b +=
  line([px(0), py(0)], [px(1.5), py(3)], green) +
  line([px(0), py(0)], [px(2), py(1)], gray, "4 3");
b +=
  line([px(0.8), py(1.6)], [px(2), py(1)], blue, "", 2.5) +
  line([px(0), py(0)], [px(0.8), py(1.6)], green, "", 3);
const q = [0.8, 1.6],
  u = [0.06, 0.12],
  v = [0.12, -0.06];
b += path(
  [
    q.map((x, i) => x + u[i]),
    q.map((x, i) => x + u[i] + v[i]),
    q.map((x, i) => x + v[i]),
  ].map((p) => [px(p[0]), py(p[1])]),
  gray,
  "",
  1.5,
);
b +=
  circle(px(2), py(1), 4, ink) +
  circle(px(0.8), py(1.6), 4, green) +
  text(222, 174, "y = (2,1)") +
  text(115, 115, "ŷ = (0.8,1.6)", "start", green) +
  text(178, 146, "e", "start", blue) +
  text(143, 35, "列空间 C(X)", "start", green) +
  text(275, 259, "y₁", "end") +
  text(39, 34, "y₂");
svg(
  "v02-observation",
  "观测平面的正交投影",
  "列空间沿(1,2)。拟合(.8,1.6)，残差(1.2,-.6)，残差与列空间正交。两个坐标等比例。",
  b,
);
figure(
  "v02-spaces",
  "V02",
  "参数与观测，属于两个空间",
  "无量纲小例：X只有一列(1,2)，观测为(2,1)。左边选一个参数，右边看它能解释的观测部分。",
  [
    { file: "v02-parameter", title: "选参数 β" },
    { file: "v02-observation", title: "在观测空间找最近点" },
  ],
  "直角只出现在右图：e = y − ŷ 与整个列空间正交。不是参数轴与残差正交，也不是散点图中任意两条线正交。",
);
const rp = (x) => 65 + x * 75,
  rq = (y) => 230 - y * 75;
b =
  line([rp(0), rq(0)], [rp(2.7), rq(0)]) +
  line([rp(0), rq(0)], [rp(0), rq(2.7)]) +
  line([rp(0), rq(2)], [rp(2), rq(0)], green, "", 2.5);
for (const p of [
  [0.5, 1.5],
  [1, 1],
  [1.5, 0.5],
])
  b += circle(rp(p[0]), rq(p[1]), p[0] === 1 ? 6 : 4);
b +=
  text(165, 67, "β₁ + β₂ = 2", "middle") +
  text(160, 175, "(1,1)", "start", green) +
  text(300, 260, "β₁", "end") +
  text(37, 34, "β₂");
b += path(
  Array.from({ length: 41 }, (_, j) => {
    const a = (j * Math.PI) / 80;
    return [rp(Math.SQRT2 * Math.cos(a)), rq(Math.SQRT2 * Math.sin(a))];
  }),
  gray,
  "4 3",
);
svg(
  "v02-rank-parameter",
  "秩亏时有一条参数解直线",
  "A第一行(1,1)，第二行零。参数和为2皆最小残差解；(1,1)是最小范数选择。虚线是半径根号2的等范数圆弧。",
  b,
);
b =
  line([45, 224], [325, 224], green, "", 2.5) +
  line([65, 230], [65, 45]) +
  line([65, 224], [225, 224], green, "", 3) +
  line([225, 224], [225, 144], blue, "", 2.5) +
  circle(225, 224) +
  circle(225, 144, 4, ink) +
  text(243, 145, "b=(2,1)") +
  text(158, 207, "拟合(2,0)", "middle", green) +
  text(239, 190, "e", "start", blue) +
  text(40, 35, "观测空间") +
  text(325, 256, "第一分量", "end");
svg(
  "v02-rank-fit",
  "秩亏仍有唯一拟合",
  "全部参数解都映到(2,0)，不可表达的残差为(0,1)。",
  b,
);
figure(
  "v02-rank",
  "V02",
  "参数不唯一，拟合却仍唯一",
  "沿用正文A的两列相同、第二行为零的例子。",
  [
    { file: "v02-rank-parameter", title: "不同参数点，同一个和" },
    { file: "v02-rank-fit", title: "同一个投影点" },
  ],
  "广义逆选择(1,1)是最小范数约定，不是证明两个真实参数相等。不可识别方向不能由增加一个求逆公式恢复。",
);
// Chapter 2: distinct probability objects, fixed repeated experiment, and diagnostic plots.
function curve(p, fn, x0, x1, color = green, dash = "") {
  return path(
    linspace(x0, x1).map((x) => [p.px(x), p.py(fn(x))]),
    color,
    dash,
  );
}
function makePlot(name, title, desc, p, body) {
  svg(name, title, desc, p.body + body);
  return { file: name, title };
}
function point(p, x, y, c = green, r = 3.5) {
  return circle(p.px(x), p.py(y), r, c);
}
let p = plane(0, 0.1, 0, 12, [0, 0.02, 0.1], [0, 5, 10], "x / m", "密度 / m⁻¹");
let panel1 = makePlot(
  "v03-density",
  "密度：看面积",
  "均匀分布[0,0.1]米，密度10每米；前0.02米阴影面积0.2。",
  p,
  path(
    [
      [p.px(0), p.py(0)],
      [p.px(0.02), p.py(0)],
      [p.px(0.02), p.py(10)],
      [p.px(0), p.py(10)],
    ],
    blue,
    "",
    1,
    true,
    "var(--vp-c-bg-soft,#eef2f2)",
  ) +
    line([p.px(0), p.py(10)], [p.px(0.1), p.py(10)], green, "", 2.5) +
    text(150, 93, "面积 = 0.2"),
);
p = plane(0, 0.1, 0, 1, [0, 0.02, 0.1], [0, 0.2, 1], "x / m", "F(x)");
let panel2 = makePlot(
  "v03-cdf",
  "累计：读高度、反查横轴",
  "同一均匀分布的CDF，F(0.02)=0.2，0.2分位数为0.02米。",
  p,
  curve(p, (x) => 10 * x, 0, 0.1) +
    line([p.px(0), p.py(0.2)], [p.px(0.02), p.py(0.2)], blue, "4 3") +
    line([p.px(0.02), p.py(0.2)], [p.px(0.02), p.py(0)], blue, "4 3") +
    point(p, 0.02, 0.2),
);
figure(
  "v03-probability",
  "V03",
  "高度10，为什么概率没有超过1？",
  "解释补充：X在0到0.1 m均匀分布。两图描述同一段区间。",
  [panel1, panel2],
  "左图概率是密度乘区间长度；右图F(0.02)=0.2是累计概率。把纵轴q=0.2反查到横轴，就得到分位数0.02 m。",
);
p = plane(
  -3,
  3,
  0,
  2.1,
  [-3, 0, 3],
  [0, 1, 2],
  "样本均值（无量纲）",
  "抽样密度",
);
b = p.body;
for (const [i, n] of [1, 4, 25].entries()) {
  b +=
    curve(
      p,
      (x) => normalPdf(x, 0, 1 / Math.sqrt(n)),
      -3,
      3,
      [gray, blue, green][i],
      ["1 4", "5 3", ""][i],
    ) + text(265, 65 + i * 23, "n=" + n, "middle", [gray, blue, green][i]);
}
svg(
  "v04-sampling",
  "样本量增加，均值分布收窄",
  "独立N(0,1)原观测的样本均值精确服从N(0,1/n)。曲线不是一份样本的直方图。",
  b,
);
figure(
  "v04-sampling",
  "V04",
  "原观测与样本均值，不是同一个随机量",
  "固定无量纲总体X∼N(0,1)，每次独立取n个观测。这里画的是样本均值的理论密度，不是按实验编号连出的时间曲线。",
  [{ file: "v04-sampling", title: "标准误为1/√n" }],
  "n=1的曲线也是原观测密度。n=4、25时均值仍为0，标准误分别为0.5、0.2；曲线下面积始终为1。此正态例是精确结论，非正态总体须另检查CLT条件。",
);
const intervals = intervalExperiment(),
  hit = intervals.filter((x) => x.lo <= 0 && x.hi >= 0).length;
p = plane(
  -0.9,
  0.9,
  0,
  41,
  [-0.8, 0, 0.8],
  [1, 20, 40],
  "区间端点（无量纲）",
  "重复实验编号 B=40",
);
b = line([p.px(0), p.py(0)], [p.px(0), p.py(41)], gray, "4 3");
intervals.forEach((v, i) => {
  const c = v.lo <= 0 && v.hi >= 0 ? green : brown;
  b +=
    line([p.px(v.lo), p.py(i + 1)], [p.px(v.hi), p.py(i + 1)], c, "", 2) +
    point(p, v.mean, i + 1, c, 1.8);
});
makePlot(
  "v04-coverage",
  "固定真值，移动区间",
  "40次独立实验，每次25个N(0,1)观测，已知标准差1的95%均值区间；种子20261015。",
  p,
  b,
);
figure(
  "v04-coverage",
  "V04",
  "95%说的是区间方法的覆盖率",
  "每次重新抽25个N(0,1)观测，再计算均值±1.959964/5。固定真值μ=0只画一条竖虚线。",
  [{ file: "v04-coverage", title: `这40次中有${hit}个区间覆盖0` }],
  "横线与竖虚线相交才覆盖真值；棕线未覆盖。B=40控制演示重复次数，n=25控制每次样本量。种子20261015；有限模拟不必恰好95%，也不是覆盖定理的证明。",
);
p = plane(
  0,
  17,
  0,
  1,
  [0, 2, 4, 6, 7, 16],
  [],
  "观测值（无量纲）",
  "同一份9点样本",
);
b =
  line([p.px(0), 120], [p.px(7), 120], gray) +
  line([p.px(0), 105], [p.px(0), 135]) +
  line([p.px(7), 105], [p.px(7), 135]) +
  path(
    [
      [p.px(2), 95],
      [p.px(6), 95],
      [p.px(6), 145],
      [p.px(2), 145],
    ],
    green,
    "",
    2,
    true,
  ) +
  line([p.px(4), 95], [p.px(4), 145], green, "", 3) +
  circle(p.px(16), 120, 4, brown) +
  text(p.px(2), 80, "Q₁=2", "middle") +
  text(p.px(6), 175, "Q₃=6", "middle") +
  text(250, 72, "16：单独标记", "middle", brown);
makePlot(
  "v06-box",
  "箱、须与标记点",
  "数据0,1,2,3,4,5,6,7,16，线性分位数算法Q1=2,Q2=4,Q3=6；IQR4，上栅栏12。",
  p,
  b,
);
figure(
  "v06-box",
  "V06",
  "箱线图的须，不是最小值到最大值",
  "解释补充：数据为0,1,2,3,4,5,6,7,16；分位数按排序后位置(n−1)q线性插值。",
  [{ file: "v06-box", title: "IQR=4，上栅栏Q₃+1.5IQR=12" }],
  "须到栅栏内最远观测7；16单独标记。栅栏12不是须端，标记也不等于已经证明该观测有错。",
);
const kdePanels = [];
for (const h of [0.3, 0.7, 1.3]) {
  p = plane(-4, 4, 0, 0.6, [-4, 0, 4], [0, 0.3, 0.6], "x / cm", "密度 / cm⁻¹");
  let body = "";
  for (const v of kdeSample)
    body += curve(
      p,
      (x) => normalPdf(x, v, h) / kdeSample.length,
      -4,
      4,
      gray,
      "1 4",
    );
  body +=
    curve(p, (x) => kde(x, h), -4, 4) +
    kdeSample.map((v) => line([p.px(v), 224], [p.px(v), 214], brown)).join("");
  kdePanels.push(
    makePlot(
      "v06-kde-" + String(h).replace(".", ""),
      `带宽 h=${h} cm`,
      "相同七个样本；点线是每个核除以n，实线是它们的和。",
      p,
      body,
    ),
  );
}
figure(
  "v06-kde",
  "V06",
  "带宽改变每个核的宽度，不改变样本位置",
  "七个观测（cm）：−0.9, −0.7, −0.4, 0.6, 0.8, 1, 1.3。灰点线为每个核/n，绿色实线为总密度。",
  kdePanels,
  "三个图坐标相同，每个估计的全实轴积分都是1；图窗之外仍有Gaussian尾部。这里h是原坐标核标准差，单位cm，不是Scott因子的无量纲乘数。",
);
p = plane(
  -1.5,
  1.5,
  -2,
  2,
  [-1, 0, 1],
  [-2, 0, 2],
  "理论N(0,1)分位数",
  "有序观测值",
);
const qs = [-1.2815515655, -0.5244005127, 0, 0.5244005127, 1.2815515655],
  obs = [-1.4, -0.5, 0.1, 0.7, 1.9];
b =
  line([p.px(-1.5), p.py(-1.5)], [p.px(1.5), p.py(1.5)], gray, "4 3") +
  qs.map((v, i) => point(p, v, obs[i])).join("");
makePlot(
  "v06-qq",
  "QQ点是同一累计位置的配对",
  "q=(i−0.5)/5；横坐标为标准正态分位数，纵坐标为五个有序观测；参考线y=x。",
  p,
  b,
);
figure(
  "v06-qq",
  "V06",
  "Q–Q图：配的是分位数，不是时间",
  "解释补充：有序观测−1.4, −0.5, 0.1, 0.7, 1.9；用q=(i−0.5)/5得到0.1、0.3、0.5、0.7、0.9。",
  [{ file: "v06-qq", title: "横轴不是等间距的样本编号" }],
  "本图明确采用a=0.5的绘图位置，和正文a=0.4等规则同属需声明的选择。灰虚线为y=x；位置或尺度变化会改变参考直线，5个点不能作正态性的自动判决。",
);
p = plane(
  -5,
  7,
  0,
  0.5,
  [-4, 0, 3, 6],
  [0, 0.25, 0.5],
  "候选 μ / 原量单位",
  "曲线高度（归一化显示）",
);
b =
  curve(p, (x) => normalPdf(x, 0, 2), -5, 7, gray, "1 4") +
  curve(p, (x) => normalPdf(x, 3, 1), -5, 7, blue, "5 3") +
  curve(p, (x) => normalPdf(x, 2.4, Math.sqrt(0.8)), -5, 7, green) +
  text(85, 64, "先验", "middle", gray) +
  text(275, 64, "似然形状", "middle", blue) +
  text(200, 113, "后验", "middle", green);
makePlot(
  "v08-bayes",
  "相同数据，不同参数角色",
  "已知观测3，观测噪声方差1，先验均值0方差4，后验均值2.4方差0.8。似然仅按面积归一用于形状对比。",
  p,
  b,
);
figure(
  "v08-bayes",
  "V08",
  "后验向精度更高的信息靠近",
  "沿用正文：μ先验为N(0,4)，观测y=3，噪声方差1。固定这份数据，横轴只改变候选μ。",
  [{ file: "v08-bayes", title: "先验点线 · 似然虚线 · 后验实线" }],
  "本例MLE在3，MAP与后验均值都在2.4，后验方差0.8。似然曲线为比较形状而按μ归一，它本身不是先验或后验；此高斯位置模型的巧合不构成一般的参数概率解释。",
);
// P2: a local tangent is replaced at each iterate, no animation required.
const newtonPanels = [];
let theta = 1;
for (let j = 0; j < 3; j++) {
  p = plane(
    0.8,
    1.8,
    -2.2,
    1.5,
    [1, 1.4, 1.8],
    [-2, 0, 1],
    "θ（无量纲）",
    "g(θ)=θ²−2",
  );
  const next = 0.5 * (theta + 2 / theta);
  b =
    curve(p, (x) => x * x - 2, 0.8, 1.8) +
    curve(
      p,
      (x) => 2 * theta * (x - theta) + theta * theta - 2,
      0.8,
      1.8,
      blue,
      "5 3",
    ) +
    line([p.px(0.8), p.py(0)], [p.px(1.8), p.py(0)], gray) +
    point(p, theta, theta * theta - 2) +
    point(p, next, 0, blue) +
    text(315, 65, "θ下一次≈" + fmt(next), "end", blue);
  newtonPanels.push(
    makePlot(
      "v07-newton-" + j,
      "第" + (j + 1) + "次：θ=" + fmt(theta),
      "绿色为原函数，蓝虚线为当前切线；切线的零点是下一候选。",
      p,
      b,
    ),
  );
  theta = next;
}
figure(
  "v07-newton",
  "V07",
  "下一候选来自切线零点",
  "解释补充：求θ²−2=0，初值θ₀=1。每幅图重新在当前点作切线。",
  newtonPanels,
  "蓝点落在切线的零点，不必落在原函数上。本例趋向正根√2；这三幅图不保证任意函数或初值收敛，Gauss–Newton还须重算真实残差目标。",
);

// Chapter 3: separate the object of an interval, residual direction, and spectral effects.
p = plane(
  -2.5,
  3.5,
  -3,
  7,
  [-2, 0, 2],
  [-2, 0, 2, 4, 6],
  "固定输入 x",
  "响应 y（无量纲）",
);
const band = linspace(-2.5, 3.5).map((x) => ({ x, ...regressionBand(x) }));
const polygon = (key) =>
  path(
    [
      ...band.map((v) => [p.px(v.x), p.py(v.mean + v[key])]),
      ...band.toReversed().map((v) => [p.px(v.x), p.py(v.mean - v[key])]),
    ],
    key === "prediction" ? gray : blue,
    key === "prediction" ? "5 3" : "",
    1.5,
    true,
    key === "prediction" ? "var(--vp-c-bg-soft,#f2f3f3)" : "none",
  );
b =
  polygon("prediction") +
  polygon("confidence") +
  curve(p, (x) => regressionBand(x).mean, -2.5, 3.5) +
  regressionData.x
    .map((x, i) => point(p, x, regressionData.y[i], ink))
    .join("");
makePlot(
  "v09-bands",
  "同一中心，两种区间",
  "6个固定设计点OLS；逐点95% t区间，自由度4。外虚线预测带增加一个独立新观测的噪声方差。",
  p,
  b,
);
figure(
  "v09-bands",
  "V09",
  "预测一个新读数，比估计平均响应更不确定",
  "解释补充：对6个构造观测，按同方差Gaussian线性模型拟合截距与斜率。绿色是OLS均值；蓝实线包住均值响应区间，灰虚线包住新观测预测区间。",
  [{ file: "v09-bands", title: "逐点95%，不是整条曲线同时95%" }],
  "两带在x均值附近较窄。预测标准误中的1+h*比均值标准误的h*多一个新噪声项。正确线性模型和独立同方差等条件仍需检查；图形不证明外推有效。",
);
const ff = fourFits(),
  fitNames = [
    "正向OLS：竖直差",
    "反向OLS：水平差",
    "LOC：标准差比",
    "LNS：正交差",
  ],
  fitPanels = [];
for (let j = 0; j < 4; j++) {
  p = geoPlane(
    -3,
    3,
    -2,
    6,
    [-2, 0, 2],
    [-2, 0, 2, 4, 6],
    "x（同尺度）",
    "y（同尺度）",
  );
  const slope = ff.slopes[j],
    f = (x) => ff.my + slope * (x - ff.mx);
  b =
    curve(p, f, -2.1, 2.1) +
    ff.x.map((x, i) => point(p, x, ff.y[i], ink)).join("");
  const q = [1, 2];
  let foot;
  if (j === 0) foot = [q[0], f(q[0])];
  else if (j === 1) foot = [(q[1] - ff.my) / slope + ff.mx, q[1]];
  else if (j === 3) {
    const t = (q[0] + slope * (q[1] - ff.my)) / (1 + slope * slope);
    foot = [t, f(t)];
  }
  if (foot)
    b += line(
      [p.px(q[0]), p.py(q[1])],
      [p.px(foot[0]), p.py(foot[1])],
      blue,
      "",
      3,
    );
  b += text(320, 65, "斜率≈" + fmt(slope), "end");
  fitPanels.push(
    makePlot(
      "v10-fit-" + j,
      fitNames[j],
      "同一数据和坐标；蓝线段按本图对应方向标出一项残差，LOC不标成距离最小化。",
      p,
      b,
    ),
  );
}
figure(
  "v10-fits",
  "V10",
  "同一数据，为什么得到四条线？",
  "解释补充：固定五点(−2,−1),(−1,0),(0,0),(1,2),(2,5)。各图绿线均过质心(0,1.2)，蓝段只说明损失方向。",
  fitPanels,
  "LOC取正的标准差比，不是在最小化某种点线距离。LNS按图中相同单位的欧氏度量求正交差；改变任一坐标单位会改变其问题。各图两坐标等比例；LNS蓝段垂直于其拟合线。",
);
// Same means, variances and r, without borrowing unverified Anscombe data.
const corr = equalCorrelationData();
const corrPanels = [];
for (const [j, ys] of [corr.a, corr.b].entries()) {
  p = plane(
    -5,
    5,
    -8,
    11,
    [-4, 0, 4],
    [-6, 0, 6],
    "x（无量纲）",
    "y（无量纲）",
  );
  corrPanels.push(
    makePlot(
      "v11-structure-" + j,
      j === 0 ? "对称曲线" : "构造的非单调点集",
      "两图的x相同；y均值0，y平方和相同，与x内积均为0。",
      p,
      ys.map((y, i) => point(p, corr.x[i], y)).join(""),
    ),
  );
}
figure(
  "v11-structure",
  "V11",
  "相同均值、方差和r，仍看不出数据结构",
  "两组均为明确构造的9点例，并非Anscombe原始数据。两图共用坐标，x与y的均值、样本方差及r均分别相同。",
  corrPanels,
  "两图r=0；左图y=x²−20/3却由x确定。零线性相关不意味着独立，有限散点外观也不能证明右图独立。正文的Anscombe例说明同一风险；本图提供可直接验算的反例。",
);
const sqPanels = [];
for (const terms of [1, 5, 25]) {
  p = plane(
    -0.8,
    0.8,
    -1.4,
    1.4,
    [-0.8, 0, 0.8],
    [-1, 0, 1],
    "相位 θ / rad",
    "方波近似",
  );
  b =
    path(
      [
        [-0.8, -1],
        [0, -1],
      ].map(([x, y]) => [p.px(x), p.py(y)]),
      gray,
      "5 3",
    ) +
    path(
      [
        [0, 1],
        [0.8, 1],
      ].map(([x, y]) => [p.px(x), p.py(y)]),
      gray,
      "5 3",
    ) +
    curve(p, (x) => squareSeries(x, terms), -0.8, 0.8);
  sqPanels.push(
    makePlot(
      "v12-square-" + terms,
      `${terms}项，最高谐波${2 * terms - 1}`,
      "跳点附近固定范围；虚线为两侧目标值，实线为奇次正弦部分和。",
      p,
      b,
    ),
  );
}
figure(
  "v12-square",
  "V12",
  "增加谐波，过冲变窄，峰高不随之消失",
  "解释补充：幅度±1的2π周期方波，相位θ=ωt；只放大跳点附近，并固定三个图的横纵范围。",
  sqPanels,
  "这里“5项”包含1、3、5、7、9次谐波。跳点θ=0处各部分和为0，即左右极限平均；有限图只显示现象，Gibbs极限由理论解释，不能据图声称每点一致收敛。",
);
p = geoPlane(
  -0.5,
  4.5,
  -0.5,
  4.5,
  [0, 1, 2, 3],
  [0, 2, 4],
  "余弦系数 a",
  "正弦系数 b",
);
b =
  line([p.px(0), p.py(0)], [p.px(3), p.py(4)], green, "", 2.5) +
  line([p.px(0), p.py(0)], [p.px(3), p.py(0)], blue, "5 3") +
  line([p.px(3), p.py(0)], [p.px(3), p.py(4)], blue, "5 3") +
  point(p, 3, 4) +
  text(166, 105, "A=5") +
  text(100, 202, "φ≈53.13°");
makePlot(
  "v12-phase",
  "幅相来自系数向量",
  "a=3,b=4，则A=5,φ=atan2(4,3)，a cos t+b sin t=A cos(t−φ)。两坐标使用相同比例。",
  { ...p, body: p.body },
  b,
);
figure(
  "v12-phase",
  "V12",
  "系数向量与复系数的角度，符号相反",
  "固定a=3、b=4：绿色线连接(0,0)与(3,4)，其长度在系数度量下为A=5。",
  [{ file: "v12-phase", title: "3 cos t + 4 sin t = 5 cos(t−φ)" }],
  "φ=atan2(4,3)≈53.13°；正频复系数c₁=(3−4i)/2，所以arg(c₁)=−φ。图中两系数轴等比例；不要把正弦系数轴直接当作Im(c₁)。",
);
const boxPanels = [];
for (const T of [1, 2]) {
  p = plane(
    -2,
    2,
    -0.6,
    2.2,
    [-2, -1, 0, 1, 2],
    [0, 1, 2],
    "频率 f / Hz",
    "F(f) / s",
  );
  b =
    curve(p, (f) => T * sinc(T * f), -2, 2) +
    line([p.px(-2), p.py(0)], [p.px(2), p.py(0)], gray, "4 3");
  boxPanels.push(
    makePlot(
      "v12-box-" + T,
      `单位高度box，时宽T=${T} s`,
      "连续变换F(f)=T sinc(Tf)，保留负旁瓣；f=0取极限T，零点在非零整数/T。",
      p,
      b,
    ),
  );
}
figure(
  "v12-box",
  "V12",
  "时间越宽，首个谱零点越靠近0",
  "解释补充：以0为中心、单位高度、时宽T的矩形脉冲。这里画有符号的连续Fourier变换，不是其绝对值。",
  boxPanels,
  "T=1、2 s时首正零点分别为1、0.5 Hz，直流值分别为1、2 s。负旁瓣表示变换符号，不是负概率；取模后才成为幅值谱。",
);
p = plane(
  0,
  0.1,
  -1.2,
  1.2,
  [0, 0.05, 0.1],
  [-1, 0, 1],
  "t / s",
  "信号幅度（无量纲）",
);
b =
  curve(p, (t) => Math.cos(2 * Math.PI * 40 * t), 0, 0.1) +
  curve(p, (t) => Math.cos(2 * Math.PI * 60 * t), 0, 0.1, blue, "5 3") +
  Array.from({ length: 11 }, (_, j) =>
    point(p, j / 100, Math.cos((2 * Math.PI * 40 * j) / 100), ink),
  ).join("");
makePlot(
  "v13-alias",
  "40 Hz与60 Hz，100 Hz采样相同",
  "实余弦无相位，采样点t=j/100秒；两连续波形不同，但所有整数j的样本相同。",
  p,
  b,
);
figure(
  "v13-alias",
  "V13",
  "同一串采样点，可以来自两条不同波形",
  "固定采样率100 Hz，绿实线40 Hz、蓝虚线60 Hz；黑点是共同的采样值。",
  [{ file: "v13-alias", title: "样本点相同，连续曲线不同" }],
  "cos(2π·60j/100)=cos(2π·40j/100)对整数j成立。这里只比较这个无相位实余弦例；采样之前应限制带宽，事后补零不能恢复已经混叠的信息。",
);
const specPanels = [];
for (const n of [64, 256]) {
  p = plane(
    3,
    7,
    0,
    1.1,
    [3, 4, 5, 6, 7],
    [0, 0.5, 1],
    "频率 / Hz",
    "单侧幅值",
  );
  const data = tone(n);
  b = curve(p, (f) => spectrum(data, f).amplitude, 3, 7);
  if (n === 64) {
    for (const f of [3, 4, 5, 6, 7])
      b += point(p, f, spectrum(data, f).amplitude, blue);
    for (const f of linspace(3, 7, 17))
      b += circle(p.px(f), p.py(spectrum(data, f).amplitude), 2.3, gray);
  }
  specPanels.push(
    makePlot(
      "v13-length-" + n,
      `实际记录${n / 64} s，N=${n}`,
      "固定采样率64Hz，单频5.25Hz，矩形窗。实线为该有限记录的频率连续求和；圆点为不同频格。",
      p,
      b,
    ),
  );
}
figure(
  "v13-length",
  "V13",
  "补零只加密频格，延长记录才改变主瓣",
  "固定采样率64 Hz、信号5.25 Hz。左图实线、蓝点（1 Hz格）及灰点（补零到256点后的0.25 Hz格）来自同一份64点数据。",
  specPanels,
  "左图加密点仍落在同一条有限记录变换上；右图真的观测256点，主瓣才变窄。画的是2|X|/N幅值，非PSD；只比较正频内部，DC和Nyquist另有倍数约定。",
);
p = plane(2, 9, -80, 5, [2, 4, 6, 8], [-80, -40, 0], "频率 / Hz", "幅值 / dB");
const td = tone();
b =
  curve(
    p,
    (f) =>
      Math.max(-80, 20 * Math.log10(Math.max(1e-8, spectrum(td, f).amplitude))),
    2,
    9,
    gray,
    "5 3",
  ) +
  curve(
    p,
    (f) =>
      Math.max(
        -80,
        20 * Math.log10(Math.max(1e-8, spectrum(td, f, 64, "hann").amplitude)),
      ),
    2,
    9,
    green,
  );
makePlot(
  "v13-window",
  "降低旁瓣，同时拓宽主瓣",
  "64点5.25Hz余弦，矩形窗虚线、Hann窗实线；幅值校正除以各窗的权和，图下截到−80dB。",
  p,
  b,
);
figure(
  "v13-window",
  "V13",
  "降低远处泄漏，也要付出主瓣变宽的代价",
  "同一64点记录；灰虚线矩形窗，绿实线Hann窗。两者都按各自窗权和校正正频幅值，fₛ=64 Hz；0 dB对应幅值1。",
  [{ file: "v13-window", title: "相同记录、相同频率坐标" }],
  "Hann较低旁瓣与较宽主瓣同时出现，不代表任意近频都更容易分离。这里用相干增益校正幅值；PSD需改用窗平方和，不能复用这个纵轴。",
);

// Chapter 4: exact linear maps, explicitly labelled nonlinear boundaries and noise models.
const ellipse = (a = 1, c = 1, rho = 0) =>
  linspace(0, 2 * Math.PI, 161).map((t) => [
    a * Math.cos(t),
    c * (rho * Math.cos(t) + Math.sqrt(1 - rho * rho) * Math.sin(t)),
  ]);
const affine = [
    [1, 1],
    [0, 1],
  ],
  inputBoundary = ellipse(0.2, 0.2, 0.5),
  outputBoundary = inputBoundary.map((v) => affine.map((r) => dot(r, v)));
const jacPanels = [];
for (const [j, pts] of [inputBoundary, outputBoundary].entries()) {
  p = geoPlane(
    -0.7,
    0.7,
    -0.7,
    0.7,
    [-0.6, 0, 0.6],
    [-0.6, 0, 0.6],
    "第一分量 / m",
    "第二分量 / m",
  );
  b = path(pts.map(([x, y]) => [p.px(x), p.py(y)]));
  jacPanels.push(
    makePlot(
      "v15-affine-" + j,
      j === 0 ? "输入标准协方差轮廓" : "线性映射后的轮廓",
      "C输入=[[.04,.02],[.02,.04]]；A=[[1,1],[0,1]]；输出协方差=[[.12,.06],[.06,.04]]。",
      p,
      b,
    ),
  );
}
figure(
  "v15-affine",
  "V15",
  "同一个线性映射，同时改变边界与协方差",
  "解释补充：y₁=x₁+x₂，y₂=x₂；输入均值0，两坐标标准差0.2 m、相关0.5。两图等比例、相同范围。",
  jacPanels,
  "右边是每个左边边界点乘A后的像，输出协方差精确为ACₓAᵀ。标准协方差轮廓不自动有某个通用覆盖率；若输入为已知Gaussian，其内部概率约39.35%。",
);
const nonlinPanels = [];
for (const r of [0.1, 0.8]) {
  p = geoPlane(
    -1.8,
    1.8,
    -1.8,
    1.8,
    [-1, 0, 1],
    [-1, 0, 1],
    "δy₁ / r",
    "δy₂ / r",
  );
  b =
    path(
      ellipse().map(([x, y]) => [p.px(x), p.py(y)]),
      gray,
      "5 3",
    ) + path(ellipse().map(([x, y]) => [p.px(x), p.py(y + r * x * x)]));
  nonlinPanels.push(
    makePlot(
      "v15-local-" + r.toString().replace(".", ""),
      `输入扰动半径 r=${r}`,
      "f(x1,x2)=(x1,x2+x1²)，中心0处Jacobian为I；边界像除以r后对比，灰虚线是一阶单位圆。",
      p,
      b,
    ),
  );
}
figure(
  "v15-local",
  "V15",
  "一阶近似舍掉的项，怎样随扰动缩小？",
  "解释补充：f(x₁,x₂)=(x₁,x₂+x₁²)，在0处J=I。把半径r的输入圆映射，再除以r，共用无量纲坐标。",
  nonlinPanels,
  "绿色纵坐标是sinθ+r cos²θ，灰虚线是一阶sinθ；余项随r缩小。图是输入圆边界的像，不是非线性输出的Gaussian概率椭圆，也不从边界直接推断输出协方差。",
);
const wn = noiseExample();
p = plane(
  0,
  63,
  -3.5,
  3.5,
  [0, 20, 40, 60],
  [-3, 0, 3],
  "离散时刻 j",
  "一次实现值",
);
b = "";
wn.forEach(
  (a, j) =>
    (b += path(
      a.map((v, i) => [p.px(i), p.py(v)]),
      [green, blue, gray][j],
      ["", "5 3", "1 4"][j],
      1.4,
    )),
);
makePlot(
  "v16-realizations",
  "同一个白噪声模型的三次实现",
  "独立N(0,1)白噪声，长度64，三次实现，种子20261015。折线只连接离散样本，不宣称连续模型。",
  p,
  b,
);
figure(
  "v16-realizations",
  "V16",
  "过程规定分布，一条记录只是一次实现",
  "解释补充：同一个独立N(0,1)模型，生成三条长度64的记录，种子20261015。",
  [{ file: "v16-realizations", title: "三条线，模型均值都为0、方差都为1" }],
  "有限记录的样本均值、样本方差和周期图会波动；模型的零相关、平谱结论不是说每条线或每个频点必须相等。",
);
p = plane(
  0,
  60,
  0,
  65,
  [0, 20, 40, 60],
  [0, 20, 40, 60],
  "时刻 j",
  "方差 / 驱动方差",
);
b = curve(p, (j) => j, 0, 60) + curve(p, () => 1, 0, 60, blue, "5 3");
makePlot(
  "v16-rw",
  "随机游走的方差随绝对时间变",
  "随机游走x0=0，每步独立方差1，Var(xj)=j；对白噪声Var=1。",
  p,
  b,
);
figure(
  "v16-rw",
  "V16",
  "相同单位驱动，随机游走并不平稳",
  "x₀=0，随机游走累加独立方差1的驱动；绿实线是Var(xⱼ)=j，蓝虚线是独立白噪声的恒定方差1。",
  [{ file: "v16-rw", title: "理论方差，不是单条记录的平方" }],
  "随机游走的协方差依赖绝对时刻min(j,k)，不能直接套平稳过程的普通PSD定义。有限记录中近似低频斜率−2，并不能证明存在可积的平稳谱。",
);
const models = [
  { name: "白噪声", k: 0, phi: 0, c: gray, dash: "1 4" },
  { name: "FOGM φ=0.8", k: -2, phi: 0.8, c: blue, dash: "5 3" },
  { name: "GGM κ=−1, φ=0.97", k: -1, phi: 0.97, c: green, dash: "" },
];
p = plane(
  0,
  Math.PI,
  0,
  1.05,
  [0, 1, 2, 3],
  [0, 0.5, 1],
  "ω / (rad/采样间隔)",
  "S(ω) / S(0)",
);
b = "";
models.forEach(
  (m) =>
    (b += curve(
      p,
      (w) => ggmSpectrum(w, m.k, m.phi) / ggmSpectrum(0, m.k, m.phi),
      0,
      Math.PI,
      m.c,
      m.dash,
    )),
);
makePlot(
  "v16-spectrum",
  "先固定生成模型，再比较谱形",
  "无限过去、单位驱动方差的平稳模型；S=(1+φ²−2φ cosω)^(κ/2)，除以零频值，只比形状。",
  p,
  b,
);
p = plane(
  0,
  30,
  0,
  1.05,
  [0, 10, 20, 30],
  [0, 0.5, 1],
  "滞后 ℓ / 采样间隔",
  "C(ℓ) / C(0)",
);
b = "";
models.forEach((m) => {
  const h = ggmCoefficients(m.k, m.phi),
    den = dot(h, h);
  const ac = Array.from(
    { length: 31 },
    (_, lag) => h.slice(lag).reduce((s, v, j) => s + v * h[j], 0) / den,
  );
  b += path(
    ac.map((v, j) => [p.px(j), p.py(v)]),
    m.c,
    m.dash,
  );
});
makePlot(
  "v16-correlation",
  "同一模型对应的相关形状",
  "由课程因果滤波系数h计算归一自协方差，截断8192项；这里φ<1，指数尾部可忽略。",
  p,
  b,
);
figure(
  "v16-models",
  "V16",
  "低频偏重，对应较长的相关记忆",
  "灰点线：白噪声；蓝虚线：FOGM φ=0.8；绿实线：课程GGM κ=−1、φ=0.97。两图均按各自零点值归一，只比较形状。",
  [
    { file: "v16-spectrum", title: "理论谱形" },
    { file: "v16-correlation", title: "自协方差形状" },
  ],
  "模型采用无限过去的平稳初始化，驱动方差1。GGM系数为正文递推，非人为低频截止的拼接谱；8192项数值相关有截断误差。归一化后不能比较绝对噪声方差。",
);
// P2: same geometric ellipse, different probability mechanisms, analytic moments in captions.
const mechanismPanels = [];
for (let j = 0; j < 3; j++) {
  p = geoPlane(
    -5,
    5,
    -5,
    5,
    [-4, 0, 4],
    [-4, 0, 4],
    "x（无量纲）",
    "y（无量纲）",
  );
  const rng = randomSource(20261015 + j);
  let pts = [];
  for (let k = 0; k < 240; k++) {
    if (j === 2) pts.push([2 * rng.normal(), rng.normal()]);
    else {
      const t = 2 * Math.PI * rng.uniform(),
        r = j === 0 ? Math.sqrt(rng.uniform()) : 1;
      pts.push([2 * r * Math.cos(t), r * Math.sin(t)]);
    }
  }
  b =
    pts
      .filter(([x, y]) => Math.abs(x) <= 5 && Math.abs(y) <= 5)
      .map(([x, y]) => point(p, x, y, green, 1.5))
      .join("") +
    path(
      ellipse(2, 1).map(([x, y]) => [p.px(x), p.py(y)]),
      gray,
      "5 3",
    );
  mechanismPanels.push(
    makePlot(
      "v17-mechanism-" + j,
      ["内部均匀：C=E/4", "参数角均匀：C=E/2", "Gaussian：C=E"][j],
      "每格240点、种子20261015加格编号；虚线同为x²/4+y²=1，理论中心0，有限样本不强制中心化为0。",
      p,
      b,
    ),
  );
}
figure(
  "v17-mechanisms",
  "V17",
  "同一个椭圆外观，不代表同一种协方差",
  "解释补充：E=diag(4,1)，三格使用同一虚线x²/4+y²=1。各240点，种子依次20261015、20261016、20261017；超出图窗的Gaussian点不绘出。",
  mechanismPanels,
  "C是生成总体的协方差，不是这240点计算出的样本矩阵。中格按参数角均匀，不按弧长均匀；右格无界Gaussian，虚线只是约39.35%内部概率轮廓，不是真实外边界。",
);
// Chapter 5: quantities have different domains and denominators; do not combine their meanings.
const dimTasks = [
  [
    "grid",
    1,
    20,
    (d) => highDimension(d).logGrid,
    "log₁₀(格子数)",
    [1, 10, 20],
    [0, 10, 20],
    "每轴10格：总数10ᵈ",
    "格子总数增长，不是任何学习任务的样本复杂度定理。",
  ],
  [
    "ball",
    1,
    20,
    (d) => Math.log10(highDimension(d).ball),
    "log₁₀(球/立方体)",
    [1, 10, 20],
    [-8, -4, 0],
    "球占包围立方体的比例",
    "分母是[-R,R]ᵈ体积；只有立方体均匀抽样才直接是入球概率。",
  ],
  [
    "shell",
    1,
    100,
    (d) => highDimension(d).shell,
    "外侧10%球壳概率",
    [1, 50, 100],
    [0, 0.5, 1],
    "均匀球内：1−0.9ᵈ",
    "分母是整个球；不是上一图的立方体，更不是Gaussian概率。",
  ],
  [
    "distance",
    1,
    100,
    (d) => highDimension(d).distanceCV,
    "平方距离的相对标准差",
    [1, 50, 100],
    [0, 0.7, 1.4],
    "两个独立标准Gaussian点",
    "D²的均值2d、方差8d；相对标准差√(2/d)缩小，距离本身并不趋零。",
  ],
];
for (const [id, lo, hi, fn, label, xt, yt, title, caption] of dimTasks) {
  const ylo = Math.min(...yt),
    yhi = Math.max(...yt);
  p = plane(lo, hi, ylo, yhi, xt, yt, "整数维数 d", label);
  b = path(
    Array.from({ length: hi - lo + 1 }, (_, i) => [
      p.px(lo + i),
      p.py(fn(lo + i)),
    ]),
  );
  for (const d of xt) b += point(p, d, fn(d));
  makePlot(
    "v19-" + id,
    title,
    "每个点对应整数维数；连线仅帮助读趋势，横轴不是连续时间。",
    p,
    b,
  );
  figure(
    "v19-" + id,
    "V19",
    title,
    "解释补充：图中各点为解析公式在整数维数上的值，不是高维物体的三维替身。",
    [{ file: "v19-" + id, title: label }],
    caption,
  );
}
// Fold membership is repeated fitting, not passing a single preprocessor through all folds.
b = text(34, 28, "固定12个训练样本，3折轮流留出");
for (let j = 0; j < 12; j++) b += text(68 + j * 23, 59, j + 1, "middle");
for (let i = 0; i < 3; i++) {
  b += text(5, 100 + i * 46, "第" + (i + 1) + "轮");
  for (let j = 0; j < 12; j++) {
    const validation = Math.floor(j / 4) === i;
    b +=
      `<rect x="${57 + j * 23}" y="${76 + i * 46}" width="21" height="28" style="fill:none;stroke:${validation ? blue : green};stroke-width:${validation ? 2.5 : 1}"/>` +
      text(
        67.5 + j * 23,
        96 + i * 46,
        validation ? "验" : "训",
        "middle",
        validation ? blue : green,
      );
  }
}
b +=
  text(35, 235, "每轮：8点拟合全部预处理 → 4点验证") +
  text(35, 264, "最终测试集锁定，不参与选配置");
svg(
  "v20-folds",
  "三折验证的信息边界",
  "十二个样本每轮八训四验；标准化、插补、PCA和模型都只在该轮八个训练样本拟合。",
  b,
);
figure(
  "v20-folds",
  "V20",
  "不是只重拟合最后一个模型",
  "沿用正文12样本、3折数例：每一行是一轮完整训练，每个样本恰好验证一次；最终测试集不在这12点中。",
  [{ file: "v20-folds", title: "每列轮流验证一次，其余轮次用于训练" }],
  "每轮重新拟合插补、标准化、PCA和模型，再把同一套规则应用到该轮验证点。选定配置后才用全部12点重拟合；相关的时间、地域或同一个体数据须改用适合应用的分组方式。",
);
const regPanels = [];
for (let j = 0; j < 2; j++) {
  p = geoPlane(-1.5, 4, -1.5, 2.7, [-1, 0, 2, 4], [-1, 0, 2], "β₁", "β₂");
  const center = [2, 0.6],
    sol = j === 0 ? [1, 0] : [1, 0.3],
    radius = j === 0 ? 1 : Math.sqrt(1.09);
  b = "";
  for (const r of [Math.hypot(center[0] - sol[0], center[1] - sol[1]), 1.6])
    b += path(
      ellipse(r, r).map(([x, y]) => [p.px(x + center[0]), p.py(y + center[1])]),
      gray,
      "4 3",
    );
  b +=
    j === 0
      ? path(
          [
            [1, 0],
            [0, 1],
            [-1, 0],
            [0, -1],
          ].map(([x, y]) => [p.px(x), p.py(y)]),
          blue,
          "",
          2,
          true,
        )
      : path(
          ellipse(radius, radius).map(([x, y]) => [p.px(x), p.py(y)]),
          blue,
        );
  b +=
    point(p, ...center, gray) +
    point(p, ...sol, green, 5) +
    text(87, 65, j === 0 ? "接触(1,0)" : "接触(1,0.3)", "start", green);
  regPanels.push(
    makePlot(
      "v22-geometry-" + j,
      j === 0 ? "L1：菱形尖角" : "L2：圆形边界",
      "损失为1/2||β−z||²，z=(2,.6)；两图约束半径不同，只比较接触结构。",
      p,
      b,
    ),
  );
}
figure(
  "v22-geometry",
  "V22",
  "尖角为什么给零系数留下机会？",
  "解释补充：固定损失½‖β−z‖²，z=(2,0.6)。灰虚线是损失等值圆，蓝线为约束边界；绿色为首次接触解。",
  regPanels,
  "左图L1半径1，对应正文Lasso λ=1，解(1,0)；右图L2半径√1.09，对应‖β−z‖²+λ‖β‖²中λ=1，解(1,0.3)。两种目标的½与λ尺度不同，不据同一λ宣称公平强度；尖角只是稀疏直觉，严格条件在正文。",
);
p = plane(
  0,
  4,
  0,
  1,
  [0, 1, 2, 4],
  [0, 0.5, 1],
  "λ（无量纲）",
  "相对OLS的收缩因子",
);
b =
  curve(p, (l) => 100 / (100 + l), 0, 4, green) +
  path(
    [...linspace(0, 0.05, 101), ...linspace(0.05, 4, 201).slice(1)].map((l) => [
      p.px(l),
      p.py(0.01 / (0.01 + l)),
    ]),
    blue,
    "5 3",
  ) +
  text(160, 68, "σ=10", "middle", green) +
  text(135, 200, "σ=0.1", "middle", blue);
makePlot(
  "v22-shrink",
  "小奇异方向收缩更强",
  "与正文一致σ=10和0.1，λ从0到4；因子σ²/(σ²+λ)。",
  p,
  b,
);
figure(
  "v22-shrink",
  "V22",
  "Ridge不是把所有系数乘同一个数",
  "沿用正文奇异值10与0.1，画的是每个非零奇异方向相对其OLS系数的比例。",
  [{ file: "v22-shrink", title: "相同λ，对两个方向作用不同" }],
  "λ=1时两个比例约0.9901与0.0099。图不是原坐标各个系数都单调收缩的保证，也不是Ridge求解权重σ/(σ²+λ)本身。",
);
p = plane(
  -3,
  3,
  -3,
  3,
  [-3, -1, 0, 1, 3],
  [-3, -1, 0, 1, 3],
  "z：无惩罚估计",
  "β̂：阈值后系数",
);
b =
  curve(p, (z) => softThreshold(z, 1), -3, 3) +
  curve(p, (z) => z / 2, -3, 3, blue, "5 3");
makePlot(
  "v22-threshold",
  "零平台与连续收缩",
  "绿实线soft(z,1)，蓝虚线z/2；对应各自明确目标尺度的λ=1正交例。",
  p,
  b,
);
figure(
  "v22-threshold",
  "V22",
  "Lasso为什么能得到精确的0？",
  "解释补充：XᵀX=I。绿实线为正文软阈值λ=1；蓝虚线为未带½的Ridge目标λ=1，输出z/2。",
  [{ file: "v22-threshold", title: "−1≤z≤1时，软阈值输出0" }],
  "零平台来自绝对值在0处的次梯度区间；不是把所有OLS系数随意截小。一般相关设计不能逐个使用这条正交公式。",
);

// Chapter 6: retain identified directions through SVD; scores and reconstructed vectors stay distinct.
const sm = svdExample(),
  stages = [
    sm.vt,
    multiply(sm.s, sm.vt),
    sm.A,
    multiply(
      multiply(sm.u, [
        [2, 0],
        [0, 0],
      ]),
      sm.vt,
    ),
  ],
  svdPanels = [];
for (let j = 0; j < 4; j++) {
  p = geoPlane(
    -2.5,
    2.5,
    -2.5,
    2.5,
    [-2, 0, 2],
    [-2, 0, 2],
    "当前第一坐标",
    "当前第二坐标",
  );
  const mat = stages[j],
    pts = ellipse().map((v) => mat.map((r) => dot(r, v)));
  b = path(pts.map(([x, y]) => [p.px(x), p.py(y)]));
  for (let k = 0; k < (j === 3 ? 1 : 2); k++) {
    const e = mat.map((r) => r[k]);
    b +=
      line(
        [p.px(0), p.py(0)],
        [p.px(e[0]), p.py(e[1])],
        k === 0 ? blue : brown,
        "5 3",
        2.5,
      ) +
      point(p, ...e, k === 0 ? blue : brown, 5) +
      text(
        p.px(e[0]) + 7,
        p.py(e[1]) - 8,
        j === 3 ? "e1、e2" : "e" + (k + 1),
        "start",
        k === 0 ? blue : brown,
      );
  }
  svdPanels.push(
    makePlot(
      "v23-stage-" + j,
      [
        "① Vᵀ：输入正交变换",
        "② ΣVᵀ：两个方向不同缩放",
        "③ UΣVᵀ：输出正交变换",
        "④ 舍去σ₂：圆被压成线段",
      ][j],
      "A=R30° diag(2,.5) R−45°；e1/e2标签跟踪原始标准基的像，圆周不带标记时无法看出旋转。",
      p,
      b,
    ),
  );
}
figure(
  "v23-svd",
  "V23",
  "同一组标记，依次经过SVD三步",
  "解释补充：A=R(30°)diag(2,0.5)R(−45°)。起始为单位圆；蓝e1、棕e2始终标原始两标准基经当前运算后的像。",
  svdPanels.slice(0, 3),
  "正交映射在此例是旋转，一般也可能反射；输入与输出通常不是同一个空间。圆周旋转后外形仍是圆，标记向量才使第一步方向变化可见。",
);
figure(
  "v23-rank",
  "V23",
  "把一个奇异值设为0，丢掉什么？",
  "继续上图同一矩阵，把第二奇异值0.5改为0；不是只压缩文件里的零方向。",
  [svdPanels[3]],
  "原单位圆变成线段，一整个输入方向不可恢复。本例两个原标准基的像重合，合并标为e1、e2；Frobenius误差和谱误差均为0.5。紧分解保留所有非零奇异值，只有此处的截断才丢失信息。",
);
const pcaPanels = [];
for (const [j, angle] of [0, pcaAngle, Math.PI / 2].entries()) {
  p = geoPlane(
    -2.7,
    2.7,
    -2.7,
    2.7,
    [-2, 0, 2],
    [-2, 0, 2],
    "中心化特征 x₁",
    "中心化特征 x₂",
  );
  const m = pcaProjection(angle);
  b = line(
    [p.px(-2.5 * m.v[0]), p.py(-2.5 * m.v[1])],
    [p.px(2.5 * m.v[0]), p.py(2.5 * m.v[1])],
    green,
  );
  pcaData.forEach((v, i) => {
    const f = m.reconstructed[i];
    b +=
      line([p.px(v[0]), p.py(v[1])], [p.px(f[0]), p.py(f[1])], gray, "1 4") +
      point(p, ...v, ink) +
      point(p, ...f, green, 3);
  });
  pcaPanels.push(
    makePlot(
      "v24-pca-" + j,
      `方向${((angle * 180) / Math.PI).toFixed(2)}°：保留${m.retained.toFixed(2)}`,
      "六个中心化样本，黑点原始，绿点投影重建，点线连接残差；保留量为得分平方和，非样本方差。",
      p,
      b,
    ),
  );
}
figure(
  "v24-pca",
  "V24",
  "留下最多投影变化，也就丢掉最少重建信息",
  "解释补充：六点±(2,1)、±(1,1)、±(1,0)，均值0。每幅只投影到一条过原点的直线。",
  pcaPanels,
  "总平方和16：三个方向保留/残差分别为12/4、15.2111/0.7889、4/12。得分是沿单位方向的一个标量，绿点则是“得分×方向”的二维重建。最优方向约28.155°，保留95.069%方差；此目标没有使用预测标签。",
);
// P2: a complete time–space view already expresses propagation, no video needed.
const hx = (s) => 55 + (s / (2 * Math.PI)) * 260,
  ht = (t) => 224 - (t / (2 * Math.PI)) * 180;
b = "";
for (let ti = 0; ti < 36; ti++)
  for (let si = 0; si < 52; si++) {
    const v = Math.cos(
        ((ti + 0.5) / 36) * 2 * Math.PI - ((si + 0.5) / 52) * 2 * Math.PI,
      ),
      a = Math.abs(v);
    b += `<rect x="${fmt(hx((si / 52) * 2 * Math.PI))}" y="${fmt(ht(((ti + 1) / 36) * 2 * Math.PI))}" width="5.1" height="5.1" style="fill:${v >= 0 ? green : blue};fill-opacity:${fmt(0.15 + 0.85 * a)}"/>`;
  }
b +=
  line([hx(0), ht(0)], [hx(2 * Math.PI), ht(2 * Math.PI)], ink, "5 3", 2) +
  text(48, 22, "时间 t / s") +
  text(315, 274, "空间 s / m", "end") +
  text(48, 248, "0") +
  text(310, 248, "2π", "middle") +
  text(43, 49, "2π", "end") +
  line([hx(0), ht(Math.PI)], [hx(Math.PI), ht(2 * Math.PI)], ink, "1 4", 2) +
  `<rect x="138" y="110" width="100" height="25" style="fill:var(--vp-c-bg,#fff)"/>` +
  text(188, 130, "波峰 +1", "middle") +
  `<rect x="78" y="67" width="100" height="25" style="fill:var(--vp-c-bg,#fff)"/>` +
  text(128, 87, "波谷 −1", "middle");
svg(
  "v25-wave",
  "传播波的时空斜纹",
  "x(t,s)=cos(ωt−ks)，角频率1弧度每秒，波数1弧度每米；本例等相位线s/(1 m)=t/(1 s)，传播速度1米每秒。正值绿色、负值蓝色，透明度随绝对值。",
  b,
);
figure(
  "v25-wave",
  "V25",
  "一次看完整时间，不必逐帧追踪波峰",
  "解释补充：x(t,s)=cos(ωt−ks)，ω=1 rad/s、k=1 rad/m。横轴空间、纵轴时间；绿为正、蓝为负，颜色深浅为绝对值。",
  [{ file: "v25-wave", title: "虚线是波峰(+1)，点线是波谷(−1)" }],
  "时间增大时，沿虚线追踪同一波峰（点线为相差π的波谷），ds/dt=1 m/s。解析重建的空间因子是exp(−iks)；若画V而非其共轭，辐角符号反向。图不是从有限数据估出的CEOF，也不证明任意混合信号只有一个传播速度。",
);
p = geoPlane(-1.8, 1.8, -1.8, 1.8, [-1, 0, 1], [-1, 0, 1], "z₁", "z₂");
b =
  path(
    ellipse(Math.SQRT2, Math.SQRT2).map(([x, y]) => [p.px(x), p.py(y)]),
    green,
  ) +
  point(p, 0, Math.SQRT2, blue) +
  text(180, 122, "z₁²+z₂²=2", "middle");
makePlot(
  "v27-dependence",
  "Cov(z)=I，仍然相互制约",
  "θ在[0,2π)均匀，z1=√2cosθ,z2=√2sinθ；边缘均值0方差1，协方差0，但平方和恒为2。",
  p,
  b,
);
figure(
  "v27-dependence",
  "V27",
  "白化只消除二阶相关，没有消除全部依赖",
  "解析反例：θ均匀，z₁=√2 cosθ、z₂=√2 sinθ。总体协方差已经是I，无需再进行任何白化。",
  [{ file: "v27-dependence", title: "知道一个坐标的大小，会限制另一个坐标" }],
  "协方差由角度积分得到，不是靠图上点“看着圆”证明。z₁²+z₂²恒为2，所以两分量不独立；这不是满足独立源假设的ICA恢复实验。",
);
function arrow(a, c, color = gray) {
  const dx = c[0] - a[0],
    dy = c[1] - a[1],
    l = Math.hypot(dx, dy),
    u = [dx / l, dy / l],
    v = [-u[1], u[0]];
  return (
    line(a, c, color, "", 1.8) +
    path(
      [
        c.map((x, i) => x - 7 * u[i] + 3 * v[i]),
        c,
        c.map((x, i) => x - 7 * u[i] - 3 * v[i]),
      ],
      color,
      "",
      1.8,
    )
  );
}
function node(x, y, first, second) {
  return (
    `<rect x="${x - 42}" y="${y - 29}" width="84" height="58" rx="3" style="fill:var(--vp-c-bg,#fff);stroke:${gray}"/>` +
    text(x, y - 4, first, "middle") +
    text(x, y + 19, second, "middle", green)
  );
}
const bn = branchNetwork();
b =
  arrow([82, 140], [143, 78]) +
  arrow([82, 140], [143, 202]) +
  arrow([227, 78], [272, 140]) +
  arrow([227, 202], [272, 140]);
b +=
  node(46, 140, "输入 h", "2") +
  node(185, 78, "a₁=.5h", bn.a1) +
  node(185, 202, "a₂=h", bn.a2) +
  node(314, 140, "总损失 L", bn.loss) +
  text(180, 25, "L = ½(a₁−3)² + ½a₂²", "middle") +
  text(180, 268, "前向值保存后，再开始求导", "middle");
svg(
  "v28-forward",
  "共享输入的前向计算",
  "h=2分成两支，a1=1,a2=2，损失2+2=4；此时尚未改变参数。",
  b,
);
b =
  arrow([285, 140], [228, 78], blue) +
  arrow([285, 140], [228, 202], blue) +
  arrow([143, 78], [88, 140], blue) +
  arrow([143, 202], [88, 140], blue);
b +=
  node(46, 140, "∂L/∂h", bn.dh) +
  node(185, 78, "∂L/∂a₁", "−2") +
  node(185, 202, "∂L/∂a₂", "2") +
  node(314, 140, "损失 L", "上游1") +
  text(93, 82, "×0.5", "middle", blue) +
  text(95, 213, "×1", "middle", blue) +
  text(175, 25, "回到共享节点：−1 + 2 = 1", "middle") +
  text(180, 268, "各路径先乘，再在共享输入处求和", "middle");
svg(
  "v28-backward",
  "分支梯度必须相加",
  "一支贡献−2乘0.5=−1，另一支2乘1=2；h总梯度1，不是任一分支梯度。",
  b,
);
figure(
  "v28-branches",
  "V28",
  "一个输入通向两个损失，梯度怎样回来？",
  "解释补充：共享h=2，a₁=0.5h、a₂=h；L=½(a₁−3)²+½a₂²。先看前向值，再沿反向箭头看敏感性。",
  [
    { file: "v28-forward", title: "① 前向：输入值与损失值" },
    { file: "v28-backward", title: "② 反向：对输入值的导数" },
  ],
  "反向图绿色数值是导数，不是新的前向值。h的两项贡献−1和2相加得1；任何参数都在全图梯度累积完成后统一更新。矩阵外积、转置与批量平均仍按正文处理。",
);
function grid(values, x, y, cell = 38, highlight = []) {
  let s = "";
  values.forEach((row, i) =>
    row.forEach((v, j) => {
      const chosen = highlight.some(([a, b]) => a === i && b === j);
      s +=
        `<rect x="${x + j * cell}" y="${y + i * cell}" width="${cell}" height="${cell}" style="fill:none;stroke:${chosen ? blue : gray};stroke-width:${chosen ? 2.7 : 1}"/>` +
        text(
          x + (j + 0.5) * cell,
          y + (i + 0.5) * cell + 6,
          v,
          "middle",
          chosen ? blue : ink,
        );
    }),
  );
  return s;
}
const cv = convolutionExample();
const convPanels = [];
for (let k = 0; k < 2; k++) {
  const ij = k === 0 ? [0, 0] : [1, 1];
  b =
    text(18, 28, "输入3×3") +
    text(210, 28, "核2×2") +
    grid(convolutionInput, 20, 55, 40, [
      [ij[0], ij[1]],
      [ij[0], ij[1] + 1],
      [ij[0] + 1, ij[1]],
      [ij[0] + 1, ij[1] + 1],
    ]) +
    grid(convolutionKernel, 215, 55, 40) +
    text(
      20,
      213,
      k === 0 ? "1×1 + 2×0 + 4×0 + 5×(−1)" : "5×1 + 6×0 + 8×0 + 9×(−1)",
    ) +
    text(180, 260, "输出 = −4", "middle", green);
  const name = "v29-window-" + k;
  svg(
    name,
    "共享核的第" + (k === 0 ? "一" : "四") + "个窗口",
    "stride1,padding0，CNN互相关不反转核；四个输出均−4。",
    b,
  );
  convPanels.push({
    file: name,
    title: k === 0 ? "左上窗口" : "右下窗口：核保持不变",
  });
}
figure(
  "v29-windows",
  "V29",
  "换的是输入窗口，不是核的数值",
  "沿用正文输入1到9、核[[1,0],[0,−1]]；单输入/输出通道、stride=1、padding=0。",
  convPanels,
  "两个未画窗口同样输出−4，最终输出2×2。CNN这里做不反核的互相关，与第三章定义中反转核的数学卷积区分；参数共享不等于复制一组可独立更新的新核。",
);
b =
  grid(cv.dx, 120, 65, 40) +
  text(180, 27, "损失为四个输出之和", "middle") +
  text(180, 225, "中心：−1（左上窗口）", "middle", blue) +
  text(180, 254, "+1（右下窗口）=0", "middle", green);
svg(
  "v29-gradients",
  "重叠窗口的输入梯度相加",
  "完整输入梯度[[1,1,0],[1,0,-1],[0,-1,-1]]；中心0源于两条非零路径抵消，不是中心未参与计算。",
  b,
);
figure(
  "v29-gradients",
  "V29",
  "放回重叠像素时，必须加，不能覆盖",
  "固定L为四个输出之和，即每个输出的上游梯度都是1。表格是∂L/∂输入，不再是前向像素值。",
  [{ file: "v29-gradients", title: "中心0是两项抵消，不是没有路径" }],
  "左上窗口经核右下角贡献−1，右下窗口经核左上角贡献+1。权梯度也对四个窗口累积为[[12,16],[24,28]]；im2col展开后仍须保留这种共享关系。",
);
b =
  text(180, 27, "D：行是时间，列是地点", "middle") +
  grid(
    [
      [1, 2, 3],
      [4, 5, 6],
    ],
    115,
    62,
    40,
  ) +
  text(85, 90, "t₁", "middle") +
  text(85, 130, "t₂", "middle") +
  text(135, 53, "A", "middle") +
  text(175, 53, "B", "middle") +
  text(215, 53, "C", "middle") +
  arrow([175, 148], [175, 181], blue) +
  text(180, 210, "axis=0均值：(2.5,3.5,4.5)", "middle", blue) +
  text(180, 253, "axis=1均值：(2,5)", "middle", green);
svg(
  "v30-axis",
  "数组归约的轴就是被消去的维度",
  "2×3时间行地点列数据；沿axis0消去时间得三个地点均值，axis1消去地点得两个时刻均值。",
  b,
);
figure(
  "v30-axis",
  "V30",
  "axis指定被消去的轴，不是结果的方向",
  "解释补充：两时刻、三地点，D=[[1,2,3],[4,5,6]]。行列语义先于数组形状。",
  [{ file: "v30-axis", title: "消去时间，留下每个地点；反之亦然" }],
  "PCA按列去时间均值应使用axis=0；axis=1回答每个时刻的空间平均。转置后轴角色必须一起交换，reshape只改变排列形状，不替代这种语义判断。",
);
b =
  text(180, 25, "乱序长表 → 按键填入矩阵", "middle") +
  text(20, 64, "(B,t₂,4)") +
  text(20, 99, "(A,t₁,1)") +
  text(20, 134, "(A,t₂,3)") +
  arrow([125, 103], [185, 103], blue) +
  grid(
    [
      [1, "缺测"],
      [3, 4],
    ],
    205,
    65,
    45,
  ) +
  text(226, 53, "A", "middle") +
  text(271, 53, "B", "middle") +
  text(190, 94, "t₁", "end") +
  text(190, 137, "t₂", "end") +
  text(180, 213, "地点顺序固定 A,B；时刻顺序 t₁,t₂", "middle") +
  text(180, 253, "缺少(B,t₁) ≠ 观测值0", "middle", brown);
svg(
  "v30-index",
  "用地点时刻键填表，不能直接reshape",
  "三条乱序长记录，两个时刻两个地点；缺失B在t1的值保留缺测，同一个键不可重复填入而不处理。",
  b,
);
figure(
  "v30-index",
  "V30",
  "长表里缺一条记录，矩阵不能补成假0",
  "解释补充：左侧每条记录是(地点,时刻,观测值)。右侧固定行列索引再逐条填入，空缺明确标记。",
  [{ file: "v30-index", title: "先核唯一键、排序与缺测，再谈SVD" }],
  "reshape既不会替你排序，也不会发现重复键。空间图还原要沿同一个地点顺序与缺测掩码；分解成功只能说明数组可计算，不说明地点已经对齐。",
);
// P2: the exact scale slice needs no approximate coloured-noise grid.
p = plane(
  0.3,
  6,
  -10,
  42,
  [1, 2, 4, 6],
  [-10, 0, 20, 40],
  "尺度 v=σ²（无量纲）",
  "两倍负对数似然（略常数）",
);
b =
  curve(p, (v) => 6 * Math.log(v), 0.3, 6, blue, "5 3") +
  curve(p, (v) => 12 / v, 0.3, 6, gray, "1 4") +
  curve(p, (v) => 6 * Math.log(v) + 12 / v, 0.3, 6, green) +
  line([p.px(2), p.py(-10)], [p.px(2), p.py(30)], brown, "4 3") +
  text(240, 64, "总和", "middle", green) +
  text(240, 110, "6 log v", "middle", blue) +
  text(240, 185, "12/v", "middle", gray);
makePlot(
  "v31-likelihood",
  "两项竞争，而非只最小化残差权重",
  "固定协方差形状C0和剖面残差Q0=12,n=6；C=vC0,v>0，尺度最优v=Q0/n=2。",
  p,
  b,
);
figure(
  "v31-likelihood",
  "V31",
  "把噪声方差调大，为什么不总能提高似然？",
  "解释补充：C=vC₀，固定正定形状C₀，n=6、剖面残差二次型Q₀=12。三条曲线共用同一尺度v>0。",
  [{ file: "v31-likelihood", title: "绿总和 · 蓝logdet项 · 灰二次型" }],
  "12/v一直下降，6 log v却增加，总和在v=2最小。这是固定形状下的精确尺度切片；不是对谱指数和任意协方差共同优化的通用结果，也不是无偏方差的分母n−p。",
);

files.set("catalog.json", JSON.stringify(catalog, null, 2) + "\n");
if (!check) fs.mkdirSync(target, { recursive: true });
for (const [name, content] of files) {
  if (check) {
    if (
      !fs.existsSync(target + name) ||
      fs.readFileSync(target + name, "utf8") !== content
    )
      throw new Error("Generated figure differs: " + name);
  } else fs.writeFileSync(target + name, content);
}
console.log(
  `${check ? "Verified" : "Generated"} ${files.size - 1} course SVGs and ${Object.keys(catalog).length} figure entries.`,
);
