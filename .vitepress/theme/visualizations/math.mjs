// Small, deterministic calculations shared by the lesson figures and their checks.
export function matVec(a, x) {
  return a.map(row => row.reduce((sum, value, i) => sum + value * x[i], 0));
}

export function rotation(theta) {
  return [[Math.cos(theta), -Math.sin(theta)], [Math.sin(theta), Math.cos(theta)]];
}

export function solve2(a, b) {
  const det = a[0][0] * a[1][1] - a[0][1] * a[1][0];
  if (Math.abs(det) < 1e-12) throw new RangeError('矩阵必须可逆');
  return [(a[1][1] * b[0] - a[0][1] * b[1]) / det,
    (-a[1][0] * b[0] + a[0][0] * b[1]) / det];
}

export const basisExample = Object.freeze({
  vector: [3, 1], basis: [[1, 1], [0, 1]],
});

export const markovModels = Object.freeze({
  city: { label: '城市迁移：趋向唯一平稳分布', matrix: [[.95,.03],[.05,.97]], stationary: [.375,.625] },
  alternating: { label: '交替链：有唯一平稳分布，仍可不收敛', matrix: [[0,1],[1,0]], stationary: [.5,.5] },
  identity: { label: '单位矩阵：保留初始分布，平稳分布不唯一', matrix: [[1,0],[0,1]], stationary: null },
});

export function markovStep(matrix, distribution) {
  if (!Array.isArray(matrix) || matrix.length !== 2 || matrix.some(row => !Array.isArray(row) || row.length !== 2 || row.some(v => !Number.isFinite(v) || v < 0 || v > 1)) ||
      [0,1].some(j => Math.abs(matrix[0][j]+matrix[1][j]-1) > 1e-12))
    throw new RangeError('需要非负、每列和为1的2×2转移矩阵');
  if (!Array.isArray(distribution) || distribution.length !== 2 || distribution.some(v => !Number.isFinite(v) || v < 0 || v > 1) || Math.abs(distribution[0]+distribution[1]-1) > 1e-12)
    throw new RangeError('需要两个分量非负、和为1的概率列向量');
  return {
    contributions: matrix.map(row => row.map((value,j) => value * distribution[j])),
    next: matVec(matrix,distribution),
  };
}

export function markovDistribution(model, initialCity, step) {
  if (typeof model !== 'string' || !Object.hasOwn(markovModels, model) || !Number.isFinite(initialCity) || initialCity < 0 || initialCity > 1 ||
      !Number.isInteger(step) || step < 0 || step > 60) throw new RangeError('请选择有效模型、初始概率与0—60的整数时刻');
  let p=[initialCity,1-initialCity];
  for (let k=0;k<step;k++) p=markovStep(markovModels[model].matrix,p).next;
  return p;
}

// Known bivariate Gaussian: mean 0, coordinate SDs 2 m and 1 m.
// This function does not estimate parameters from a sample.
export function covarianceEllipse(rho = .5, q = .95) {
  if (!Number.isFinite(rho) || Math.abs(rho) >= 1 || !Number.isFinite(q) || q <= 0 || q >= 1)
    throw new RangeError('需要 |ρ|<1 和 0<q<1');
  const covariance = [[4,2*rho],[2*rho,1]];
  const determinant = 4*(1-rho*rho);
  const lambda1 = (5+Math.hypot(3,4*rho))/2;
  const lambda2 = determinant/lambda1;
  const angle = .5*Math.atan2(4*rho,3);
  const s = -2*Math.log1p(-q);
  const directionVariance = 2.5+2*rho; // u = (1,1)/sqrt(2), fixed at 45 degrees.
  return { rho, q, covariance, determinant, lambda1, lambda2, angle, s,
    principalSD: [Math.sqrt(lambda1),Math.sqrt(lambda2)],
    semiaxes: [Math.sqrt(s*lambda1),Math.sqrt(s*lambda2)],
    directionVariance, directionSD: Math.sqrt(directionVariance) };
}

export function ellipsePoint(model, t, threshold = 1) {
  if (!Number.isFinite(t) || !Number.isFinite(threshold) || threshold <= 0)
    throw new RangeError('需要有限参数角和正平方距离阈值');
  const z = [Math.sqrt(threshold*model.lambda1)*Math.cos(t), Math.sqrt(threshold*model.lambda2)*Math.sin(t)];
  return matVec(rotation(model.angle),z);
}

// No clipping or renormalization: rounding belongs only to presentation.
export function formatNumber(value, digits = 3, fixed = false) {
  if (!Number.isFinite(value) || !Number.isInteger(digits) || digits < 0 || digits > 10)
    throw new RangeError('需要有限数值与0—10的整数小数位数');
  const rounded = Number(value.toFixed(digits));
  return fixed ? (Object.is(rounded,-0) ? 0 : rounded).toFixed(digits) : String(Object.is(rounded,-0) ? 0 : rounded);
}

// City-only time controls. Every displayed value still comes from matrix recursion.
export function advanceMarkov(k, action) {
  if (!Number.isInteger(k) || k < 0 || k > 60) throw new RangeError('需要0—60的整数时刻');
  if (action === 'reset') return 0;
  if (action === 'next') return Math.min(k+1,60);
  if (action === 'jump') return Math.min(k+10,60);
  throw new RangeError('未知的时间操作');
}

// Same geometry feeds the SVG path and its numerical checks. Screen y points down.
export function covariancePlot(model, probability = false) {
  if (probability && model.q !== .95) throw new RangeError('概率面板的固定坐标范围只适用于q=0.95');
  const threshold = probability ? model.s : 1;
  const scale = probability ? 28 : 50;
  const px = x => 180+scale*x, py = y => 125-scale*y;
  const pathFor = s => Array.from({length:181}, (_,i) => {
    const p = ellipsePoint(model,i*Math.PI/90,s);
    return `${i ? 'L' : 'M'}${px(p[0]).toFixed(3)},${py(p[1]).toFixed(3)}`;
  }).join(' ')+' Z';
  const axes = [0,1].map(j => {
    const angle = model.angle+j*Math.PI/2;
    const length = Math.sqrt(threshold*[model.lambda1,model.lambda2][j]);
    return [length*Math.cos(angle),length*Math.sin(angle)];
  });
  return { threshold, scale, px, py, path: pathFor(threshold), innerPath: pathFor(1), axes,
    halfWidth: 2*Math.sqrt(threshold), halfHeight: Math.sqrt(threshold) };
}
