<script setup>
import { computed } from 'vue'
import MathMatrix from './MathMatrix.vue'
import { markovStep, formatNumber } from './math.mjs'
const props = defineProps({ matrix: { type: Array, required: true }, distribution: { type: Array, required: true }, k: { type: Number, required: true }, phase: { type: Number, default: 1 } })
const calculation = computed(() => markovStep(props.matrix,props.distribution))
const f = x => formatNumber(x,5)
const sums = computed(() => calculation.value.contributions.map(row => [row.map(f).join(' + ')]))
const next = computed(() => calculation.value.next.map(v => [f(v)]))
</script>

<template>
  <div class="edu-calculation">
    <table class="edu-contributions" aria-label="按到达状态分行的概率来源贡献">
      <caption>每行合并两个来源：P<sub>ij</sub>p<sub>k,j</sub>。小数经舍入，≈ 表示近似值。</caption>
      <thead><tr><th scope="col">到达</th><th scope="col" class="edu-source-city">来自城市</th><th scope="col" class="edu-source-rural">来自乡村</th></tr></thead>
      <tbody><tr v-for="(row,i) in calculation.contributions" :key="i"><th scope="row">{{ ['城市','乡村'][i] }}</th><td v-for="(value,j) in row" :key="j" :class="j===0?'edu-source-city':'edu-source-rural'" :data-contribution="i+','+j"><span class="edu-product">{{ f(matrix[i][j]) }} × {{ f(distribution[j]) }}</span><strong>≈ {{ f(value) }}</strong></td></tr></tbody>
    </table>
    <p v-if="phase===1" class="edu-note">先核对四个乘积。下一阶段把同一行的两项相加。</p>
    <template v-if="phase===2">
      <div class="edu-output-label"><strong>输出：下一分布</strong><span class="edu-math"><b>p</b><sub>{{ k+1 }}</sub> = P<b>p</b><sub>{{ k }}</sub></span></div>
      <div class="edu-math-line edu-result" data-result="next-distribution">
        <span class="edu-math"><b>p</b><sub>{{ k+1 }}</sub> ≈ <MathMatrix :rows="sums" label="各到达状态的来源贡献之和" /></span>
        <span class="edu-math">≈ <MathMatrix :rows="next" label="下一时刻的概率列向量" /></span>
      </div>
      <div v-for="(row,i) in calculation.contributions" :key="'bar'+i" class="edu-bar-row"><span>{{ ['城市','乡村'][i] }}</span><div class="edu-bar-track edu-stacked" aria-hidden="true"><span class="edu-bar-city" :style="{width:row[0]*100+'%'}"/><span class="edu-bar-rural" :style="{width:row[1]*100+'%'}"/></div><span>{{ (calculation.next[i]*100).toFixed(2) }}%</span></div>
      <p class="edu-note">理论上两分量之和为 1；显示的小数可能有舍入差。段长是对总概率的贡献：绿色来自城市，蓝色来自乡村；不直接表示转移概率。</p>
    </template>
  </div>
</template>
