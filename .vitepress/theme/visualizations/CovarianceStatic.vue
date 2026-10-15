<script setup>
import CovariancePlot from './CovariancePlot.vue'
import MathMatrix from './MathMatrix.vue'
import { covarianceEllipse } from './math.mjs'
const m = covarianceEllipse(.5)
</script>

<template>
  <figure id="v14-shape" class="edu-visual edu-covariance" data-visualization="V14-static">
    <strong class="edu-title">同一个 C，分清坐标方向与主轴方向</strong>
    <p>总体均值为零、协方差已知。比较点线框半宽与蓝色主半轴；它们沿不同方向衡量散布。</p>
    <div class="edu-math-line edu-cov-summary">
      <span class="edu-math">C = <MathMatrix :rows="m.covariance" :cell-chars="6" label="已知总体协方差矩阵" /> m²</span>
      <span>ρ = 0.5；<span class="edu-math">σ<sub>x</sub> = 2 m，σ<sub>y</sub> = 1 m</span></span>
    </div>
    <CovariancePlot :model="m" id-prefix="cov-shape" />
    <div class="edu-legend"><span class="edu-key-object">轮廓：<span class="edu-math">d<sub>M</sub><sup>2</sup> = 1</span></span><span class="edu-key-principal">蓝线：主轴标准差</span><span class="edu-key-box">点线框：坐标投影范围</span></div>
    <figcaption>两坐标等比例，内部直虚线是零坐标参考。矩形横、纵半宽是 2 m、1 m；蓝色主半轴约 2.074 m、0.835 m。方向方差与 45° 投影的计算见图后正文。</figcaption>
    <p class="edu-note">本图只解释标准轮廓 d<sub>M</sub><sup>2</sup> = 1 的形状，不将它解释为一维“±1σ”的 68.27% 区域。</p>
  </figure>
</template>
