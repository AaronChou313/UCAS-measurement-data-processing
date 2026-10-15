<script setup>
import { formatNumber } from './math.mjs'
defineProps({ model: { type: Object, required: true }, probability: Boolean })
const f = x => formatNumber(x,3,true)
</script>

<template>
  <table class="edu-readings" aria-label="协方差各类尺度及数值">
    <caption>量、公式与当前数值（≈ 表示小数经舍入）</caption>
    <thead><tr><th scope="col">量与计算</th><th scope="col">数值</th></tr></thead>
    <tbody>
      <tr data-reading="coordinate"><th scope="row">坐标标准差<small><span class="edu-math">σ<sub>x</sub>，σ<sub>y</sub></span> · 始终固定</small></th><td><span>2 m</span><span>1 m</span></td></tr>
      <tr data-reading="principal"><th scope="row">主轴标准差<small class="edu-math"><span class="edu-root">√<span>λ<sub>1</sub></span></span>，<span class="edu-root">√<span>λ<sub>2</sub></span></span> · 由 |ρ| 决定</small></th><td><span>≈ {{ f(model.principalSD[0]) }} m</span><span>≈ {{ f(model.principalSD[1]) }} m</span></td></tr>
      <tr data-reading="projection"><th scope="row">45° 投影方差<small class="edu-math"><b>u</b><sup>T</sup>C<b>u</b> = 2.5 + 2ρ</small><small>随 ρ 增大而增大</small></th><td>≈ {{ f(model.directionVariance) }} m²</td></tr>
      <tr data-reading="projection-sd"><th scope="row">该方向投影标准差<small class="edu-math"><span class="edu-root">√<span><b>u</b><sup>T</sup>C<b>u</b></span></span></small></th><td>≈ {{ f(model.directionSD) }} m</td></tr>
      <tr v-if="probability" data-reading="probability"><th scope="row">95% 概率半轴<small class="edu-math">a = <span class="edu-root">√<span>sλ<sub>1</sub></span></span>，b = <span class="edu-root">√<span>sλ<sub>2</sub></span></span></small></th><td><span>≈ {{ f(model.semiaxes[0]) }} m</span><span>≈ {{ f(model.semiaxes[1]) }} m</span></td></tr>
    </tbody>
  </table>
</template>
