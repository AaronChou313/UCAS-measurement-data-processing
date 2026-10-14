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
  return {
    contributions: matrix.map(row => row.map((value,j) => value * distribution[j])),
    next: matVec(matrix,distribution),
  };
}

export function markovDistribution(model, initialCity, step) {
  if (!(model in markovModels) || !Number.isFinite(initialCity) || initialCity < 0 || initialCity > 1 ||
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
