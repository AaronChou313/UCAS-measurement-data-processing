// Small fixed teaching models. Coordinates, values and tests share these inputs.
export const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
export const transpose = (a) => a[0].map((_, j) => a.map((r) => r[j]));
export const multiply = (a, b) =>
  a.map((r) => transpose(b).map((c) => dot(r, c)));
export const add = (a, b) => a.map((r, i) => r.map((v, j) => v + b[i][j]));
export const inverse2 = (a) => {
  if (
    !Array.isArray(a) ||
    a.length !== 2 ||
    a.some(
      (r) =>
        !Array.isArray(r) ||
        r.length !== 2 ||
        r.some((v) => !Number.isFinite(v)),
    ) ||
    a[0][0] <= 0 ||
    Math.abs(a[0][1] - a[1][0]) > 1e-12
  )
    throw new RangeError("需要对称正定二维矩阵");
  const d = a[0][0] * a[1][1] - a[0][1] * a[1][0];
  if (!Number.isFinite(d) || d <= 0)
    throw new RangeError("需要正定可逆的二维协方差");
  return [
    [a[1][1] / d, -a[0][1] / d],
    [-a[1][0] / d, a[0][0] / d],
  ];
};
export function projectionExample() {
  const X = [1, 2],
    y = [2, 1],
    beta = dot(X, y) / dot(X, X);
  const fitted = X.map((v) => v * beta),
    residual = y.map((v, i) => v - fitted[i]);
  return { X, y, beta, fitted, residual };
}
export const kalmanInput = {
  previous: [9, 1],
  P0: [
    [4, -1],
    [-1, 2],
  ],
  F: [
    [1, 1],
    [0, 1],
  ],
  Q: [
    [0, 0],
    [0, 0],
  ],
  H: [[1, 0]],
  R: 1,
  z: 12,
};
export function kalmanExample() {
  const { previous, P0, F, Q, H, R, z } = kalmanInput;
  const predicted = F.map((r) => dot(r, previous));
  const priorCov = add(multiply(multiply(F, P0), transpose(F)), Q);
  const innovation = z - dot(H[0], predicted),
    S = multiply(multiply(H, priorCov), transpose(H))[0][0] + R;
  const gain = multiply(priorCov, transpose(H)).map((r) => r[0] / S);
  const posterior = predicted.map((v, i) => v + gain[i] * innovation);
  const a = [
    [1 - gain[0], 0],
    [-gain[1], 1],
  ];
  const joseph = add(
    multiply(multiply(a, priorCov), transpose(a)),
    gain.map((v) => gain.map((w) => v * R * w)),
  );
  return {
    previous,
    previousCov: P0,
    predicted,
    priorCov,
    innovation,
    S,
    gain,
    posterior,
    posteriorCov: joseph,
    z,
    R,
  };
}
export function teachingStep(value, action, max) {
  if (
    !Number.isInteger(max) ||
    max < 0 ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > max
  )
    throw new RangeError("无效的演示阶段");
  if (action === "next") return Math.min(max, value + 1);
  if (action === "previous") return Math.max(0, value - 1);
  if (action === "reset") return 0;
  throw new RangeError("未知的演示操作");
}

export const linspace = (a, b, n = 201) =>
  Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
export function normalPdf(x, mu = 0, sd = 1) {
  if (!(sd > 0) || ![x, mu, sd].every(Number.isFinite))
    throw new RangeError("正态标准差必须为正，参数必须有限");
  return Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
}
// Mulberry32 + Box–Muller; a seed and ordered calls completely determine a figure.
export function randomSource(seed = 20261015) {
  let a = seed >>> 0;
  const uniform = () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    uniform,
    normal: () =>
      Math.sqrt(-2 * Math.log(1 - uniform())) *
      Math.cos(2 * Math.PI * uniform()),
  };
}
export function intervalExperiment() {
  const rng = randomSource(20261015),
    n = 25,
    B = 40,
    z = 1.959963984540054;
  return Array.from({ length: B }, () => {
    const mean =
      Array.from({ length: n }, () => rng.normal()).reduce((a, b) => a + b, 0) /
      n;
    return { mean, lo: mean - z / Math.sqrt(n), hi: mean + z / Math.sqrt(n) };
  });
}
export const kdeSample = [-0.9, -0.7, -0.4, 0.6, 0.8, 1, 1.3];
export function kde(x, h, data = kdeSample) {
  if (
    !(h > 0) ||
    !Number.isFinite(h) ||
    !Number.isFinite(x) ||
    !data.length ||
    data.some((v) => !Number.isFinite(v))
  )
    throw new RangeError("KDE需要有限样本与正带宽");
  return data.reduce((s, v) => s + normalPdf(x, v, h), 0) / data.length;
}
export function quantile(data, p) {
  if (
    !data.length ||
    data.some((v) => !Number.isFinite(v)) ||
    !Number.isFinite(p) ||
    p < 0 ||
    p > 1
  )
    throw new RangeError("无效分位数");
  const a = [...data].sort((a, b) => a - b),
    k = (a.length - 1) * p,
    i = Math.floor(k);
  return a[i] + (a[Math.min(i + 1, a.length - 1)] - a[i]) * (k - i);
}
export function regression(x, y) {
  if (
    x.length !== y.length ||
    x.length < 3 ||
    [...x, ...y].some((v) => !Number.isFinite(v))
  )
    throw new RangeError("回归输入无效");
  const n = x.length,
    mx = x.reduce((a, b) => a + b) / n,
    my = y.reduce((a, b) => a + b) / n;
  const xx = x.reduce((s, v) => s + (v - mx) ** 2, 0),
    yy = y.reduce((s, v) => s + (v - my) ** 2, 0),
    xy = x.reduce((s, v, i) => s + (v - mx) * (y[i] - my), 0);
  if (xx === 0) throw new RangeError("自变量无变动");
  const b = xy / xx,
    a = my - b * mx,
    sse = x.reduce((s, v, i) => s + (y[i] - a - b * v) ** 2, 0);
  return {
    n,
    mx,
    my,
    xx,
    yy,
    xy,
    a,
    b,
    sse,
    s2: sse / (n - 2),
    r: xy / Math.sqrt(xx * yy),
  };
}
export const regressionData = {
  x: [-2, -1, 0, 1, 2, 3],
  y: [-0.8, 0.2, 0.5, 2.1, 2.4, 4.1],
};
export function regressionBand(x) {
  const m = regression(regressionData.x, regressionData.y),
    h = 1 / m.n + (x - m.mx) ** 2 / m.xx,
    c = 2.7764451051977987;
  return {
    mean: m.a + m.b * x,
    confidence: c * Math.sqrt(m.s2 * h),
    prediction: c * Math.sqrt(m.s2 * (1 + h)),
  };
}
export function fourFits() {
  const x = [-2, -1, 0, 1, 2],
    y = [-1, 0, 0, 2, 5],
    m = regression(x, y),
    d = m.yy - m.xx;
  return {
    x,
    y,
    ...m,
    slopes: [
      m.b,
      m.yy / m.xy,
      Math.sign(m.xy) * Math.sqrt(m.yy / m.xx),
      (d + Math.sqrt(d * d + 4 * m.xy * m.xy)) / (2 * m.xy),
    ],
  };
}
export function equalCorrelationData() {
  const x = linspace(-4, 4, 9),
    a = x.map((v) => v * v - 20 / 3);
  let b = [1, -2, 3, -1, 0, 2, -3, 1, -1];
  const avg = b.reduce((s, v) => s + v, 0) / 9;
  b = b.map((v) => v - avg);
  const projection = dot(x, b) / dot(x, x);
  b = b.map((v, i) => v - projection * x[i]);
  const scale = Math.sqrt(dot(a, a) / dot(b, b));
  return { x, a, b: b.map((v) => v * scale) };
}
export function squareSeries(t, terms) {
  return Array.from({ length: terms }, (_, i) => {
    const k = 2 * i + 1;
    return ((4 / Math.PI) * Math.sin(k * t)) / k;
  }).reduce((s, v) => s + v, 0);
}
export const sinc = (x) =>
  Math.abs(x) < 1e-12 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
export function spectrum(data, frequency, fs = 64, window = "rect") {
  if (
    !data.length ||
    !data.every(Number.isFinite) ||
    !Number.isFinite(frequency) ||
    !(fs > 0) ||
    !Number.isFinite(fs) ||
    !["rect", "hann"].includes(window) ||
    data.length < 2
  )
    throw new RangeError("无效频谱输入");
  const w = data.map((_, j) =>
    window === "hann"
      ? 0.5 - 0.5 * Math.cos((2 * Math.PI * j) / (data.length - 1))
      : 1,
  );
  const sumw = w.reduce((s, v) => s + v, 0);
  if (!(sumw > 0)) throw new RangeError("窗权和必须为正");
  let re = 0,
    im = 0;
  data.forEach((v, j) => {
    const a = (2 * Math.PI * frequency * j) / fs;
    re += v * w[j] * Math.cos(a);
    im -= v * w[j] * Math.sin(a);
  });
  return { re, im, amplitude: (2 * Math.hypot(re, im)) / sumw };
}
export const tone = (n = 64, f = 5.25, fs = 64) =>
  Array.from({ length: n }, (_, j) => Math.cos((2 * Math.PI * f * j) / fs));
export function ggmCoefficients(kappa, phi, n = 8192) {
  if (
    !Number.isFinite(kappa) ||
    !Number.isFinite(phi) ||
    phi < 0 ||
    phi >= 1 ||
    !Number.isInteger(n) ||
    n < 1
  )
    throw new RangeError("GGM需要0≤φ<1与正整数长度");
  const h = [1];
  for (let j = 1; j < n; j++)
    h.push(((phi * (j - kappa / 2 - 1)) / j) * h[j - 1]);
  return h;
}
export function ggmSpectrum(omega, kappa, phi) {
  if (
    !Number.isFinite(omega) ||
    !Number.isFinite(kappa) ||
    !Number.isFinite(phi) ||
    phi < 0 ||
    phi >= 1
  )
    throw new RangeError("无效GGM参数");
  return (1 + phi * phi - 2 * phi * Math.cos(omega)) ** (kappa / 2);
}
export function noiseExample() {
  const rng = randomSource(20261015);
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 64 }, () => rng.normal()),
  );
}
export function ballRatio(d) {
  if (!Number.isInteger(d) || d < 1 || d > 200)
    throw new RangeError("只接受1到200的整数维数");
  if (d === 1) return 1;
  if (d === 2) return Math.PI / 4;
  return (ballRatio(d - 2) * Math.PI) / (2 * d);
}
export function highDimension(d) {
  if (!Number.isInteger(d) || d < 1 || d > 200)
    throw new RangeError("无效维数");
  return {
    logGrid: d * Math.log10(10),
    side: 0.01 ** (1 / d),
    ball: ballRatio(d),
    shell: 1 - 0.9 ** d,
    distanceCV: Math.sqrt(2 / d),
  };
}
export const softThreshold = (z, lambda) => {
  if (!Number.isFinite(z) || !Number.isFinite(lambda) || lambda < 0)
    throw new RangeError("无效阈值");
  return Math.sign(z) * Math.max(Math.abs(z) - lambda, 0);
};
export const rotation = (a) => [
  [Math.cos(a), -Math.sin(a)],
  [Math.sin(a), Math.cos(a)],
];
export function svdExample() {
  const vt = rotation(-Math.PI / 4),
    s = [
      [2, 0],
      [0, 0.5],
    ],
    u = rotation(Math.PI / 6);
  return { vt, s, u, A: multiply(multiply(u, s), vt) };
}
export const pcaData = [
  [2, 1],
  [-2, -1],
  [1, 1],
  [-1, -1],
  [1, 0],
  [-1, 0],
];
export const pcaAngle = 0.5 * Math.atan2(12, 8);
export function pcaProjection(theta) {
  if (!Number.isFinite(theta)) throw new RangeError("角度必须有限");
  const v = [Math.cos(theta), Math.sin(theta)],
    scores = pcaData.map((p) => dot(p, v)),
    reconstructed = scores.map((s) => v.map((x) => x * s)),
    retained = dot(scores, scores);
  return { v, scores, reconstructed, retained, residual: 16 - retained };
}
export function branchNetwork(h = 2, w1 = 0.5, b1 = 0, w2 = 1, b2 = 0) {
  const a1 = w1 * h + b1,
    a2 = w2 * h + b2,
    loss = 0.5 * (a1 - 3) ** 2 + 0.5 * a2 * a2,
    d1 = a1 - 3,
    d2 = a2;
  return {
    a1,
    a2,
    loss,
    dh1: d1 * w1,
    dh2: d2 * w2,
    dh: d1 * w1 + d2 * w2,
    grads: [d1 * h, d1, d2 * h, d2],
  };
}
export const convolutionInput = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ],
  convolutionKernel = [
    [1, 0],
    [0, -1],
  ];
export function convolutionExample(
  input = convolutionInput,
  kernel = convolutionKernel,
  upstream = [
    [1, 1],
    [1, 1],
  ],
) {
  if (
    input.length !== 3 ||
    input.some((r) => r.length !== 3) ||
    kernel.length !== 2 ||
    kernel.some((r) => r.length !== 2) ||
    upstream.length !== 2 ||
    upstream.some((r) => r.length !== 2) ||
    [...input.flat(), ...kernel.flat(), ...upstream.flat()].some(
      (v) => !Number.isFinite(v),
    )
  )
    throw new RangeError("固定例需要3×3输入、2×2核和2×2上游梯度");
  const out = [
      [0, 0],
      [0, 0],
    ],
    dx = Array.from({ length: 3 }, () => [0, 0, 0]),
    dw = [
      [0, 0],
      [0, 0],
    ];
  let db = 0;
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const g = upstream[i][j];
      db += g;
      for (let u = 0; u < 2; u++)
        for (let v = 0; v < 2; v++) {
          out[i][j] += input[i + u][j + v] * kernel[u][v];
          dw[u][v] += input[i + u][j + v] * g;
          dx[i + u][j + v] += kernel[u][v] * g;
        }
    }
  return { out, dx, dw, db };
}
