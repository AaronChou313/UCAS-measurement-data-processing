import test from "node:test";
import assert from "node:assert/strict";
import {
  projectionExample,
  dot,
  kalmanExample,
  inverse2,
  multiply,
  add,
  teachingStep,
} from "../.vitepress/theme/visualizations/full-math.mjs";
const near = (a, b, t = 1e-11) =>
  assert.ok(Math.abs(a - b) < t, `${a} != ${b}`);
test("V02 projection is orthogonal and preserves norm decomposition", () => {
  const { X, y, beta, fitted, residual } = projectionExample();
  near(beta, 0.8);
  near(
    X.reduce((s, v, i) => s + v * residual[i], 0),
    0,
  );
  near(
    y.reduce((s, v) => s + v * v, 0),
    fitted.reduce((s, v) => s + v * v, 0) +
      residual.reduce((s, v) => s + v * v, 0),
  );
  for (const b of [-10, 0, 0.5, 1, 10])
    assert.ok(y.reduce((s, v, i) => s + (v - X[i] * b) ** 2, 0) >= 1.8 - 1e-12);
});
test("V26 Joseph covariance agrees with independent information-form conditioning", () => {
  const m = kalmanExample();
  assert.deepEqual(m.predicted, [10, 1]);
  assert.deepEqual(m.priorCov, [
    [4, 1],
    [1, 2],
  ]);
  assert.deepEqual(m.posterior, [11.6, 1.4]);
  near(m.innovation, 2);
  near(m.S, 5);
  near(m.gain[0], 0.8);
  near(m.gain[1], 0.2);
  const info = add(inverse2(m.priorCov), [
      [1, 0],
      [0, 0],
    ]),
    p = inverse2(info);
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) near(m.posteriorCov[i][j], p[i][j]);
  near(p[0][0], 0.8);
  near(p[1][1], 1.8);
  near(p[0][1], 0.2);
  const mean = multiply(
    p,
    add(multiply(inverse2(m.priorCov), [[10], [1]]), [[12], [0]]),
  );
  mean.forEach((v, i) => near(v[0], m.posterior[i]));
});
test("covariance inversion rejects singular, indefinite, asymmetric and malformed inputs", () => {
  for (const a of [
    [
      [1, 1],
      [1, 1],
    ],
    [
      [-1, 0],
      [0, -1],
    ],
    [
      [1, 2],
      [0, 1],
    ],
    [
      [NaN, 0],
      [0, 1],
    ],
    [[1]],
    null,
  ])
    assert.throws(() => inverse2(a), RangeError);
});
test("V26 stage controls have finite boundaries and reject invalid state/actions", () => {
  near(teachingStep(3, "next", 3), 3);
  near(teachingStep(0, "previous", 3), 0);
  near(teachingStep(2, "reset", 3), 0);
  near(teachingStep(0, "next", 3), 1);
  for (const k of [-1, 4, 0.5, NaN])
    assert.throws(() => teachingStep(k, "next", 3), RangeError);
  assert.throws(() => teachingStep(1, "play", 3), RangeError);
});

import {
  normalPdf,
  randomSource,
  intervalExperiment,
  kde,
  quantile,
  regression,
  regressionData,
  regressionBand,
  fourFits,
  equalCorrelationData,
  squareSeries,
  sinc,
  spectrum,
  tone,
  ggmCoefficients,
  ggmSpectrum,
  highDimension,
  softThreshold,
  svdExample,
  pcaAngle,
  pcaProjection,
  pcaData,
  branchNetwork,
  convolutionExample,
  convolutionInput,
  convolutionKernel,
  transpose,
} from "../.vitepress/theme/visualizations/full-math.mjs";
import { execFileSync } from "node:child_process";
const integral = (fn, a, b, n = 10000) => {
  const h = (b - a) / n;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * fn(a + i * h);
  return (sum * h) / 3;
};
const matrixNear = (a, b) =>
  a.forEach((r, i) => r.forEach((v, j) => near(v, b[i][j])));
test("V03/V04/V06 densities integrate to one; Gaussian mean scale and KDE bandwidth remain separate", () => {
  for (const n of [1, 4, 25])
    near(
      integral((x) => normalPdf(x, 0, 1 / Math.sqrt(n)), -10, 10),
      1,
    );
  for (const h of [0.3, 0.7, 1.3])
    near(
      integral((x) => kde(x, h), -16, 16),
      1,
    );
  near(quantile([0, 1, 2, 3, 4, 5, 6, 7, 16], 0.25), 2);
  near(quantile([0, 1, 2, 3, 4, 5, 6, 7, 16], 0.75), 6);
  for (const h of [0, -1, NaN, Infinity])
    assert.throws(() => kde(0, h), RangeError);
  assert.throws(() => quantile([], 1), RangeError);
  assert.throws(() => quantile([1, 2], 1.1), RangeError);
});
test("V04 seed fixes repeated samples but does not force exactly 95% coverage", () => {
  assert.deepEqual(intervalExperiment(), intervalExperiment());
  const first = intervalExperiment()[0];
  near(first.hi - first.lo, (2 * 1.959963984540054) / 5);
  const randomA = randomSource(1),
    randomB = randomSource(1);
  for (let j = 0; j < 20; j++) near(randomA.normal(), randomB.normal());
  near(
    integral((x) => normalPdf(x), -1.959963984540054, 1.959963984540054),
    0.95,
    1e-10,
  );
});
test("V08 product of prior and likelihood gives the normalized posterior, not arbitrary curve peaks", () => {
  const evidence = normalPdf(3, 0, Math.sqrt(5));
  for (const mu of [-4, 0, 1, 2.4, 3, 6])
    near(
      (normalPdf(mu, 0, 2) * normalPdf(3, mu, 1)) / evidence,
      normalPdf(mu, 2.4, Math.sqrt(0.8)),
    );
});
test("V09 t4 critical value and extra predictive variance independently checked", () => {
  const t = 2.7764451051977987;
  near(
    0.5 + integral((x) => (3 / 8) * (1 + (x * x) / 4) ** -2.5, 0, t),
    0.975,
    1e-11,
  );
  const m = regression(regressionData.x, regressionData.y);
  for (const x of [-2.5, 0.5, 3.5]) {
    const b = regressionBand(x);
    near(
      b.prediction * b.prediction - b.confidence * b.confidence,
      t * t * m.s2,
    );
    assert.ok(b.prediction > b.confidence);
  }
  assert.throws(() => regression([1, 1, 1], [1, 2, 3]), RangeError);
});
test("V10 each slope corresponds to its own objective and centroid", () => {
  const m = fourFits();
  near(m.xx, 10);
  near(m.yy, 22.8);
  near(m.xy, 14);
  near(m.slopes[0], 1.4);
  near(m.slopes[1], 22.8 / 14);
  near(m.slopes[2], Math.sqrt(2.28));
  const loss = (b) =>
      m.x.reduce(
        (s, x, i) => s + (m.y[i] - m.my - b * x) ** 2 / (1 + b * b),
        0,
      ),
    h = 1e-5;
  near((loss(m.slopes[3] + h) - loss(m.slopes[3] - h)) / (2 * h), 0, 1e-8);
  assert.ok(loss(m.slopes[3]) < loss(m.slopes[0]));
});
test("V11 equal summary statistics do not erase the nonlinear dependence", () => {
  const { x, a, b } = equalCorrelationData();
  near(
    a.reduce((s, v) => s + v),
    0,
  );
  near(
    b.reduce((s, v) => s + v),
    0,
  );
  near(dot(x, a), 0);
  near(dot(x, b), 0);
  near(dot(a, a), dot(b, b));
  a.forEach((v, i) => near(v, x[i] ** 2 - 20 / 3));
});
test("V12 Fourier coefficients, signed box transform and phase triangle have consistent normalization", () => {
  near(squareSeries(0, 25), 0);
  near(squareSeries(0.4, 1), (4 / Math.PI) * Math.sin(0.4));
  near(sinc(0), 1);
  near(sinc(1), 0);
  assert.ok(sinc(1.5) < 0);
  near(Math.hypot(3, 4), 5);
  near(Math.atan2(-4, 3), -Math.atan2(4, 3));
  for (const T of [1, 2]) {
    for (const f of [0, 0.2, 0.7, 1.5])
      near(
        integral((t) => Math.cos(2 * Math.PI * f * t), -T / 2, T / 2),
        T * sinc(T * f),
      );
  }
});
test("V13 aliasing equality, zero-padded grids, direct DFT Parseval and window endpoints", () => {
  for (let j = 0; j < 101; j++)
    near(
      Math.cos((2 * Math.PI * 40 * j) / 100),
      Math.cos((2 * Math.PI * 60 * j) / 100),
    );
  const a = tone(64),
    padded = [...a, ...Array(192).fill(0)];
  for (const f of [4, 5, 5.25, 6])
    near(spectrum(a, f).re, spectrum(padded, f).re);
  let power = 0;
  for (let k = 0; k < 64; k++) {
    const ft = spectrum(a, k);
    power += ft.re * ft.re + ft.im * ft.im;
  }
  near(power / 64, dot(a, a), 1e-10);
  near(spectrum(tone(64, 5), 5).amplitude, 1);
  assert.throws(() => spectrum([1, 2], 0.5, 64, "hann"), RangeError);
  assert.throws(() => spectrum(a, 1, 0), RangeError);
  assert.throws(() => spectrum(a, 1, 64, "bad"), RangeError);
});
test("V15 affine covariance and nonlinear mapped-boundary remainder use actual model", () => {
  const C = [
      [0.04, 0.02],
      [0.02, 0.04],
    ],
    A = [
      [1, 1],
      [0, 1],
    ];
  matrixNear(multiply(multiply(A, C), transpose(A)), [
    [0.12, 0.06],
    [0.06, 0.04],
  ]);
  for (const r of [0.1, 0.8])
    for (const a of [0, 0.3, 1, 2]) {
      const input = [r * Math.cos(a), r * Math.sin(a)],
        y = [input[0], input[1] + input[0] ** 2];
      near(y[1] / r - Math.sin(a), r * Math.cos(a) ** 2);
    }
});
test("V16 GGM recurrence independently reproduces analytic transfer spectrum and FOGM powers", () => {
  for (const phi of [0, 0.8, 0.97]) {
    const h = ggmCoefficients(-2, phi, 100);
    h.forEach((v, j) => near(v, phi ** j));
  }
  const h = ggmCoefficients(-1, 0.97);
  for (const w of [0, 0.1, 0.7, Math.PI]) {
    const re = h.reduce((s, v, j) => s + v * Math.cos(w * j), 0),
      im = h.reduce((s, v, j) => s - v * Math.sin(w * j), 0);
    near(
      re * re + im * im,
      1 / Math.sqrt(1 + 0.97 ** 2 - 2 * 0.97 * Math.cos(w)),
      2e-10,
    );
    near(re * re + im * im, ggmSpectrum(w, -1, 0.97), 2e-10);
  }
  for (const phi of [-0.1, 1, NaN])
    assert.throws(() => ggmCoefficients(-1, phi), RangeError);
});
test("V19 high-dimensional quantities checked against low-dimensional volumes and Gaussian moments", () => {
  near(highDimension(2).ball, Math.PI / 4);
  near(highDimension(3).ball, Math.PI / 6);
  near(highDimension(10).ball, Math.PI ** 5 / 120 / 1024);
  near(highDimension(2).shell, 0.19);
  near(highDimension(2).side, 0.1);
  near(highDimension(100).distanceCV, Math.sqrt(0.02));
  for (const d of [0, 1.5, 201, NaN])
    assert.throws(() => highDimension(d), RangeError);
});
test("V22 constraint contacts obey KKT, shrinkage and exact zero interval", () => {
  const z = [2, 0.6],
    lasso = [1, 0],
    ridge = [1, 0.3];
  near(lasso[0] - z[0] + 1, 0);
  assert.ok(Math.abs(lasso[1] - z[1]) <= 1);
  ridge.forEach((b, j) => near(2 * (b - z[j]) + 2 * b, 0));
  for (const z of [-3, -1, -0.4, 0, 0.4, 1, 3]) {
    const b = softThreshold(z, 1);
    if (b === 0) assert.ok(Math.abs(z) <= 1);
    else near(b - z + Math.sign(b), 0);
  }
  assert.throws(() => softThreshold(1, -1), RangeError);
});
test("V23 SVD and rank-one error checked by Gram eigenvalues and Frobenius norm", () => {
  const { A, u, s, vt } = svdExample();
  matrixNear(multiply(transpose(u), u), [
    [1, 0],
    [0, 1],
  ]);
  matrixNear(multiply(vt, transpose(vt)), [
    [1, 0],
    [0, 1],
  ]);
  const G = multiply(transpose(A), A),
    tr = G[0][0] + G[1][1],
    det = G[0][0] * G[1][1] - G[0][1] * G[1][0];
  near(tr, 4.25);
  near(det, 1);
  const rank1 = multiply(
    multiply(u, [
      [2, 0],
      [0, 0],
    ]),
    vt,
  );
  near(
    A.flat().reduce((sum, v, i) => sum + (v - rank1.flat()[i]) ** 2, 0),
    0.25,
  );
  near(s[0][0], 2);
});
test("V24 PCA optimum solves an independent Gram eigenproblem; score is scalar, reconstruction vector", () => {
  const g = multiply(transpose(pcaData), pcaData);
  matrixNear(g, [
    [12, 6],
    [6, 4],
  ]);
  const m = pcaProjection(pcaAngle),
    eigen = 8 + 2 * Math.sqrt(13);
  near(m.retained, eigen);
  m.v.forEach((v, i) => near(dot(g[i], m.v), eigen * v));
  for (const t of [0, pcaAngle, Math.PI / 2]) {
    const q = pcaProjection(t);
    near(q.retained + q.residual, 16);
    q.reconstructed.forEach((r, i) =>
      near(
        dot(
          pcaData[i].map((v, j) => v - r[j]),
          q.v,
        ),
        0,
      ),
    );
  }
  assert.throws(() => pcaProjection(NaN), RangeError);
});
test("V28 all branch and parameter gradients match independent finite differences", () => {
  const inputs = [2, 0.5, 0, 1, 0],
    m = branchNetwork(...inputs),
    expected = [m.dh, ...m.grads],
    h = 1e-5;
  expected.forEach((v, j) => {
    const a = [...inputs],
      b = [...inputs];
    a[j] += h;
    b[j] -= h;
    near(
      (branchNetwork(...a).loss - branchNetwork(...b).loss) / (2 * h),
      v,
      1e-9,
    );
  });
  near(m.loss, 4);
  near(m.dh1, -1);
  near(m.dh2, 2);
  near(m.dh, 1);
});
test("V29 shared convolution paths accumulate, including nonuniform upstream gradients", () => {
  const m = convolutionExample();
  assert.deepEqual(m.out, [
    [-4, -4],
    [-4, -4],
  ]);
  assert.deepEqual(m.dw, [
    [12, 16],
    [24, 28],
  ]);
  assert.deepEqual(m.dx, [
    [1, 1, 0],
    [1, 0, -1],
    [0, -1, -1],
  ]);
  const up = [
      [1, 2],
      [3, 4],
    ],
    n = convolutionExample(undefined, undefined, up);
  assert.deepEqual(n.dw, [
    [37, 47],
    [67, 77],
  ]);
  assert.deepEqual(n.dx, [
    [1, 2, 0],
    [3, 3, -2],
    [0, -3, -4],
  ]);
  near(n.db, 10);
  const objective = (x, w) =>
      convolutionExample(x, w).out.reduce(
        (s, r, i) => s + r.reduce((t, v, j) => t + v * up[i][j], 0),
        0,
      ),
    h = 1e-5;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      const a = structuredClone(convolutionInput),
        b = structuredClone(convolutionInput);
      a[i][j] += h;
      b[i][j] -= h;
      near(
        (objective(a, convolutionKernel) - objective(b, convolutionKernel)) /
          (2 * h),
        n.dx[i][j],
        1e-8,
      );
    }
  for (let i = 0; i < 2; i++)
    for (let j = 0; j < 2; j++) {
      const a = structuredClone(convolutionKernel),
        b = structuredClone(convolutionKernel);
      a[i][j] += h;
      b[i][j] -= h;
      near(
        (objective(convolutionInput, a) - objective(convolutionInput, b)) /
          (2 * h),
        n.dw[i][j],
        1e-8,
      );
    }
  assert.throws(() => convolutionExample([[1]]), RangeError);
});
test("W02/W03 Python source helpers execute without external packages", () => {
  execFileSync("python3", ["scripts/test-source-models.py"], { stdio: "pipe" });
});
