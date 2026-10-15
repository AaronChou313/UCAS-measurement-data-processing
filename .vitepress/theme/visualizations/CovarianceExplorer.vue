<script setup>
import { computed, onMounted, ref } from 'vue'
import CovariancePlot from './CovariancePlot.vue'
import CovarianceReadings from './CovarianceReadings.vue'
import MathMatrix from './MathMatrix.vue'
import { covarianceEllipse, formatNumber } from './math.mjs'
const ready = ref(false)
const rho = ref(.5)
const announcement = ref('')
onMounted(() => { ready.value = true })
const m = computed(() => covarianceEllipse(rho.value))
const f = x => formatNumber(x,3,true)
const covarianceRows = computed(() => m.value.covariance.map(row => row.map(f)))
function announce() {
  announcement.value = `相关系数 ${rho.value.toFixed(2)}，主方向 ${formatNumber(m.value.angle*180/Math.PI,2,true)} 度；坐标标准差仍为2米和1米，概率半轴为${f(m.value.semiaxes[0])}米和${f(m.value.semiaxes[1])}米。`
}
function reset() { rho.value = .5; announce() }
</script>

<template>
  <figure id="v14-probability" class="edu-visual edu-covariance" data-visualization="V14-interactive">
    <strong class="edu-title">只改变相关性，哪些尺度保持不变？</strong>
    <p>已知二维正态，均值为零，坐标标准差固定为 2 m 和 1 m，内部概率固定为 95%。先预测：ρ 变号后，主方向和两条主半轴会怎样？</p>
    <div v-if="ready" class="edu-controls edu-rho-controls">
      <label for="cov-rho"><span>相关系数 <span class="edu-math">ρ = {{ rho.toFixed(2) }}</span></span><input id="cov-rho" v-model.number="rho" type="range" min="-0.95" max="0.95" step="0.05" :aria-valuetext="rho.toFixed(2)" @change="announce"/></label>
      <button @click="reset">恢复 ρ = 0.50</button>
    </div>
    <p v-else class="edu-note">静态回退：ρ = 0.50，图、矩阵与数值表均可直接阅读；启用 JavaScript 后可调节相关系数。</p>
    <span class="edu-sr-only" role="status">{{ announcement }}</span>
    <div class="edu-cov-summary">
      <div class="edu-math edu-math-line">C(ρ) = <MathMatrix :rows="covarianceRows" :cell-chars="6" label="当前总体协方差矩阵" /> m²</div>
      <div class="edu-eigenvalues"><span>主方差：<span class="edu-math">λ<sub>1</sub> ≈ {{ f(m.lambda1) }} m²，λ<sub>2</sub> ≈ {{ f(m.lambda2) }} m²</span></span><span>主方向：<span class="edu-math">ψ ≈ {{ formatNumber(m.angle*180/Math.PI,2,true) }}°</span></span></div>
    </div>
    <CovariancePlot :model="m" id-prefix="cov-probability" probability />
    <div class="edu-legend"><span class="edu-key-object">外轮廓：<span class="edu-math">d<sub>M</sub><sup>2</sup> = s</span></span><span class="edu-key-unit">内虚线：<span class="edu-math">d<sub>M</sub><sup>2</sup> = 1</span></span><span class="edu-key-principal">蓝线：a、b</span></div>
    <figcaption>坐标范围固定、两轴等比例，内部直虚线是零坐标参考。外轮廓内部概率为 95%；点线外切框半宽始终约 4.895 m、2.448 m。棕箭头示意45°单位方向 <b class="edu-math">u</b>，绘制长度任意。</figcaption>
    <p class="edu-scale edu-math">q = 0.95，s = −2 log(1 − q) ≈ {{ f(m.s) }}<br/><span class="edu-root">√<span>s</span></span> ≈ {{ f(Math.sqrt(m.s)) }}：主轴标准差乘这个倍数，才是概率半轴。</p>
    <CovarianceReadings :model="m" probability />
    <p class="edu-observe">ρ 变号，倾斜方向翻转；|ρ| 增大，一条主半轴拉长，另一条缩短。坐标标准差和内部概率保持不变，形状与面积却可以变化。</p>
    <details class="edu-projection-details"><summary>45° 投影怎样对应图形与公式？</summary>
      <div class="edu-math-line edu-math"><b>u</b> = <span class="edu-fraction"><span>1</span><span class="edu-root">√<span>2</span></span></span><MathMatrix :rows="[[1],[1]]" label="投影方向的列向量" /></div>
      <p>将随机向量投影到这个单位方向，方差为 <span class="edu-math"><b>u</b><sup>T</sup>C<b>u</b> = 2.5 + 2ρ</span>。概率椭圆的投影半宽为 <span class="edu-math"><span class="edu-root">√<span>s</span></span><span class="edu-root">√<span><b>u</b><sup>T</sup>C<b>u</b></span></span></span> ≈ {{ f(Math.sqrt(m.s)*m.directionSD) }} m；它一般既不是主半轴，也不是沿 <b class="edu-math">u</b> 射线与边界交点的半径。正文紧接着给出两种长度的推导。</p>
    </details>
    <p class="edu-note">|ρ| ≤ 0.95 保证 C 正定；ρ = ±1 的退化情形不套用求逆公式。这里使用已知总体参数，概率属于内部，边界本身概率为零；没有生成随机点云，也不保证有限样本恰有95%点在内部。这不是样本均值置信椭圆或未来观测预测椭圆。</p>
  </figure>
</template>
