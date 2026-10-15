<script setup>
import { markovModels, markovStep, formatNumber } from './math.mjs'
const initial = [.8,.2]
const matrix = markovModels.city.matrix
const calculation = markovStep(matrix,initial)
const f = n => formatNumber(n,3,true)
</script>

<template>
  <figure id="v18-sources" class="edu-visual edu-markov-sources" data-visualization="V18-sources">
    <strong class="edu-title">到达城市的概率，来自两条路径</strong>
    <svg viewBox="0 0 360 310" role="img" aria-labelledby="markov-source-title markov-source-desc">
      <title id="markov-source-title">两个互斥来源汇入下一时刻的城市概率</title>
      <desc id="markov-source-desc">当前城市概率0.8，乡村概率0.2；分别乘条件转移概率0.95与0.03，得到联合概率贡献0.760与0.006，相加为下一步城市概率0.766。箭头等宽，不用粗细编码概率。</desc>
      <defs><marker id="markov-source-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>
      <g v-for="(p,j) in initial" :key="j" :data-source-probability="p" :data-transition-probability="matrix[0][j]" :data-joint-contribution="calculation.contributions[0][j]" :class="j===0?'edu-source-city':'edu-source-rural'">
        <rect :x="j===0?8:202" y="16" width="150" height="64" rx="4" fill="none" stroke="currentColor"/>
        <text :x="j===0?83:277" y="42" text-anchor="middle">{{ j===0?'当前城市':'当前乡村' }}</text>
        <text :x="j===0?83:277" y="66" text-anchor="middle">概率 {{ p }}</text>
        <path :d="j===0?'M83 86 V175 Q83 195 135 218':'M277 86 V175 Q277 195 225 218'" fill="none" stroke="currentColor" stroke-width="2" marker-end="url(#markov-source-arrow)"/>
        <rect :x="j===0?5:199" y="104" width="156" height="64" class="edu-flow-label-bg"/>
        <text :x="j===0?83:277" y="124" text-anchor="middle">× {{ matrix[0][j] }}（条件概率）</text>
        <text :x="j===0?83:277" y="153" text-anchor="middle" class="edu-flow-contribution">贡献 {{ f(calculation.contributions[0][j]) }}</text>
      </g>
      <rect x="62" y="222" width="236" height="72" rx="4" fill="none" class="object"/>
      <text x="180" y="250" text-anchor="middle">下一步城市概率</text>
      <text x="180" y="278" text-anchor="middle" class="edu-svg-math" data-source-sum="city">{{ f(calculation.contributions[0][0]) }} + {{ f(calculation.contributions[0][1]) }} = {{ f(calculation.next[0]) }}</text>
    </svg>
    <figcaption>先沿每条路径相乘，再把互斥来源相加。只画到达城市的两条路径；箭头等宽，概率由标注给出。</figcaption>
  </figure>
</template>
