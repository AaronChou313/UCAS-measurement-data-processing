<script setup>
import { computed, onMounted, ref } from 'vue'
import CovariancePlot from './CovariancePlot.vue'
import { covarianceEllipse } from './math.mjs'
const ready = ref(false)
const rho = ref(.5)
const announcement = ref('')
onMounted(() => { ready.value = true })
const m = computed(() => covarianceEllipse(rho.value))
const observation = computed(() => rho.value===0
  ? 'ρ = 0：椭圆与坐标轴对齐；两坐标标准差不同，所以它仍不是圆。'
  : `ρ ${rho.value>0?'>':'<'} 0：椭圆向右${rho.value>0?'上':'下'}倾斜。增大 |ρ| 会使形状更细长；固定框的宽、高不变。`)
function announce() { announcement.value = `相关系数 ${rho.value.toFixed(2)}。${observation.value}` }
function reset() { rho.value = .5; announce() }
</script>

<template>
  <figure id="v14-probability" class="edu-visual edu-covariance" data-visualization="V14-interactive">
    <strong class="edu-title">改变相关性，椭圆怎样倾斜、变细？</strong>
    <p>已知二维正态、均值为零；固定 σ<sub>x</sub> = 2 m、σ<sub>y</sub> = 1 m，只改变 ρ。</p>
    <div v-if="ready" class="edu-controls edu-rho-controls">
      <label for="cov-rho"><span>相关系数 <span class="edu-math">ρ = {{ rho.toFixed(2) }}</span></span><input id="cov-rho" v-model.number="rho" type="range" min="-0.95" max="0.95" step="0.05" :aria-valuetext="rho.toFixed(2)" @change="announce"/></label>
      <button @click="reset">恢复 ρ = 0.50</button>
    </div>
    <p v-else class="edu-note">静态回退：ρ = 0.50。启用 JavaScript 后可调节相关系数。</p>
    <span class="edu-sr-only" role="status">{{ announcement }}</span>
    <CovariancePlot :model="m" id-prefix="cov-probability" probability />
    <div class="edu-legend"><span class="edu-key-object">95% 轮廓</span><span class="edu-key-box">固定的坐标投影范围</span></div>
    <p class="edu-observe">{{ observation }}</p>
    <figcaption>只画 95% 轮廓：d<sub>M</sub><sup>2</sup> ≈ 5.991。点线框半宽约为 <span class="edu-root">√<span>5.991</span></span> σ<sub>x</sub>、<span class="edu-root">√<span>5.991</span></span> σ<sub>y</sub>，不是坐标标准差本身；两轴等比例。</figcaption>
    <p class="edu-note">上图标准轮廓 d<sub>M</sub><sup>2</sup> = 1 的内部概率仅约 39.35%，这里不再叠画。|ρ| ≤ 0.95 保证 C 正定；参数已知，本图不是样本估计的置信椭圆。</p>
  </figure>
</template>
