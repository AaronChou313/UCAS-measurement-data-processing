<script setup>
import CovariancePlot from './CovariancePlot.vue'
import CovarianceReadings from './CovarianceReadings.vue'
import MathMatrix from './MathMatrix.vue'
import { covarianceEllipse, formatNumber } from './math.mjs'
const m = covarianceEllipse(.5)
</script>

<template>
  <figure id="v14-shape" class="edu-visual edu-covariance" data-visualization="V14-static">
    <strong class="edu-title">同一个 C，分清坐标方向与主轴方向</strong>
    <p>下面的总体均值为零，协方差已知。先比较矩形半宽与蓝色主半轴，再看数值表；这里没有抽样或估计参数。</p>
    <div class="edu-math-line edu-cov-summary">
      <span class="edu-math">C = <MathMatrix :rows="m.covariance" :cell-chars="6" label="已知总体协方差矩阵" /> m²</span>
      <span>ρ = 0.5；<span class="edu-math">σ<sub>x</sub> = 2 m，σ<sub>y</sub> = 1 m</span></span>
    </div>
    <CovariancePlot :model="m" id-prefix="cov-shape" />
    <div class="edu-legend"><span class="edu-key-object">轮廓：<span class="edu-math">d<sub>M</sub><sup>2</sup> = 1</span></span><span class="edu-key-principal">蓝线：主轴标准差</span><span class="edu-key-box">点线框：坐标投影范围</span></div>
    <figcaption>两坐标等比例，内部直虚线是零坐标参考。矩形横、纵半宽是 2 m、1 m；蓝色主半轴约 2.074 m、0.835 m。棕箭头示意45°单位方向 <b class="edu-math">u</b>，绘制长度任意。</figcaption>
    <CovarianceReadings :model="m" />
    <p class="edu-observe">主方向倾角约 {{ formatNumber(m.angle*180/Math.PI,2) }}°，既不是 x 轴，也不是 45° 方向。投影方差的单位是 m²，开平方才得到长度。</p>
    <p class="edu-note">本图只解释形状。二维区域 d<sub>M</sub><sup>2</sup> ≤ 1 不具有一维“±1σ”的 68.27% 覆盖率；下一节再选概率尺度。投影标准差也不是沿 <b class="edu-math">u</b> 射线走到边界的半径。</p>
  </figure>
</template>
