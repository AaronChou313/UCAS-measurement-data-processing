<script setup>
import CovariancePlot from './CovariancePlot.vue'
import { covarianceEllipse } from './math.mjs'
const m=covarianceEllipse(.5)
</script>

<template>
  <figure id="v14-shape" class="edu-visual" data-visualization="V14-static">
    <strong class="edu-title">同一个 C，三种不同的尺度读法</strong>
    <p>已知均值为零，C = ((4, 1), (1, 1)) m²；即 σ<sub>x</sub> = 2 m、σ<sub>y</sub> = 1 m、ρ = 0.5。这里没有抽样，也没有估计参数。</p>
    <CovariancePlot />
    <figcaption>等比例坐标。灰色点线外切矩形的横、纵半宽为 2 m、1 m；它们是椭圆的坐标投影半宽，并非主轴长度。棕色 u 只标方向，箭头长度不编码方差。</figcaption>
    <table tabindex="0"><caption>先看对象，再看单位（数值四舍五入）</caption><thead><tr><th scope="col">所量的对象</th><th scope="col">本例数值</th><th scope="col">应怎样读</th></tr></thead><tbody>
      <tr><th scope="row">坐标标准差 σ<sub>x</sub>、σ<sub>y</sub></th><td>2 m；1 m</td><td>x、y 两轴的边缘散布</td></tr>
      <tr><th scope="row">主轴标准差 √λ₁、√λ₂</th><td>{{ m.principalSD[0].toFixed(3) }} m；{{ m.principalSD[1].toFixed(3) }} m</td><td>最大、最小投影标准差</td></tr>
      <tr><th scope="row">45° 方向投影方差 uᵀCu</th><td>3.500 m²</td><td>u = (1, 1)ᵀ / √2 是单位向量</td></tr>
      <tr><th scope="row">该方向投影标准差</th><td>{{ m.directionSD.toFixed(3) }} m</td><td>先把随机向量投影，再求标准差</td></tr>
    </tbody></table>
    <p class="edu-observe">主轴倾角约 16.85°，并不沿 x 轴或 45° 方向。uᵀCu 是方差，开平方才是长度；这条投影标准差也不是沿 u 射线走到椭圆边界的距离。</p>
    <p class="edu-note">本图先只解释 d<sub>M</sub><sup>2</sup> = 1 的几何。它没有一维“±1σ”的 68.27% 联合覆盖率；下一节再确定二维概率尺度。</p>
  </figure>
</template>
