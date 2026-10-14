<script setup>
import { computed, onMounted, ref } from 'vue'
import CovariancePlot from './CovariancePlot.vue'
import { covarianceEllipse } from './math.mjs'
const ready=ref(false), rho=ref(.5), announcement=ref('')
onMounted(()=>{ready.value=true})
const m=computed(()=>covarianceEllipse(rho.value))
const f=x=>x.toFixed(3)
function announce(){announcement.value=`相关系数 ${rho.value.toFixed(2)}，主轴倾角 ${(m.value.angle*180/Math.PI).toFixed(2)} 度，概率半轴 ${f(m.value.semiaxes[0])} 米和 ${f(m.value.semiaxes[1])} 米。`}
function reset(){rho.value=.5;announce()}
</script>

<template>
  <figure id="v14-probability" class="edu-visual" data-visualization="V14-interactive">
    <strong class="edu-title">预测后再调 ρ：边缘尺度不变，联合形状会怎样？</strong>
    <p>仍取已知二维正态，均值为零、σ<sub>x</sub> = 2 m、σ<sub>y</sub> = 1 m。固定内部概率 q = 95%，s = −2 log(0.05) ≈ 5.991，√s ≈ 2.448。先预测：把 ρ 改为负值，哪些长度保持不变？</p>
    <div v-if="ready" class="edu-controls edu-rho-controls">
      <label for="cov-rho">相关系数 ρ = {{ rho.toFixed(2) }}<input id="cov-rho" v-model.number="rho" type="range" min="-0.95" max="0.95" step="0.05" :aria-valuetext="rho.toFixed(2)" @change="announce"/></label>
      <button @click="reset">重置为 ρ = 0.50</button>
    </div>
    <p v-else class="edu-note">静态回退：以下图表固定在 ρ = 0.50，已包含全部尺度关系。启用 JavaScript 后只增加相关系数调节；概率与边缘标准差始终固定。</p>
    <span class="edu-sr-only" role="status">{{ announcement }}</span>
    <p class="edu-cov-matrix"><strong>C(ρ) / m² = ((4, {{ f(2*rho) }}), ({{ f(2*rho) }}, 1))</strong><br/>λ₁ ≈ {{ f(m.lambda1) }} m²，λ₂ ≈ {{ f(m.lambda2) }} m²；ψ ≈ {{ (m.angle*180/Math.PI).toFixed(2) }}°</p>
    <CovariancePlot :rho="rho" probability />
    <figcaption>两轴同一比例、所有 ρ 设置下坐标范围固定。绿色实线包围 95% 概率；内侧蓝虚线为 d<sub>M</sub><sup>2</sup> = 1。灰色外切矩形半宽为 √s σ<sub>x</sub> ≈ 4.895 m、√s σ<sub>y</sub> ≈ 2.448 m，保持不变，不能读成 2 m、1 m。</figcaption>
    <table tabindex="0"><caption>四类量对照（理论值的近似小数）</caption><thead><tr><th scope="col">量及计算</th><th scope="col">当前值</th><th scope="col">随 ρ 变化？</th></tr></thead><tbody>
      <tr><th scope="row">坐标标准差 σ<sub>x</sub>；σ<sub>y</sub></th><td>2 m；1 m</td><td>固定</td></tr>
      <tr><th scope="row">主轴标准差 √λ₁；√λ₂</th><td>{{ f(m.principalSD[0]) }} m；{{ f(m.principalSD[1]) }} m</td><td>由 |ρ| 决定</td></tr>
      <tr><th scope="row">45° 投影方差 uᵀCu = 2.5 + 2ρ</th><td>{{ f(m.directionVariance) }} m²</td><td>随 ρ 增大而增大</td></tr>
      <tr><th scope="row">该方向标准差 √(uᵀCu)</th><td>{{ f(m.directionSD) }} m</td><td>方差开平方</td></tr>
      <tr><th scope="row">95% 概率半轴 a；b</th><td>{{ f(m.semiaxes[0]) }} m；{{ f(m.semiaxes[1]) }} m</td><td>分别为 √s × 主轴标准差</td></tr>
    </tbody></table>
    <p class="edu-observe">观察：ρ 变号使倾斜方向翻转；|ρ| 增大使一个主轴拉长、另一个缩短，x、y 边缘标准差仍不变。95% 是每个已知分布各自内部的概率，不能把形状变化读成覆盖率变化。</p>
    <p>固定 u = (1, 1)ᵀ / √2 时，概率椭圆沿 u 的<strong>投影半宽</strong>为 √s √(uᵀCu) ≈ {{ f(Math.sqrt(m.s)*m.directionSD) }} m。这是投影的最远位置，通常不同于沿 u 射线与边界交点的半径，也不是主半轴 a 或 b。</p>
    <p class="edu-note">范围 |ρ| ≤ 0.95 保证 C 正定。ρ = ±1 会退化成线，本图不套用求逆公式。没有随机点云；不表示有限样本恰有 95% 点落在内部，也不构造均值置信椭圆或未来观测预测椭圆。所有边界曲线自身的概率为零。</p>
  </figure>
</template>
