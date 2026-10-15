<script setup>
import { markovDistribution } from './math.mjs'
const steps = [0,1,2,3].map(k => ({k,p:markovDistribution('alternating',1,k)}))
</script>

<template>
  <figure id="v18-periodic" class="edu-visual edu-markov-period" data-visualization="V18-periodic">
    <strong class="edu-title">交替链：分布没有靠近平稳分布</strong>
    <svg viewBox="0 0 360 190" role="img" aria-labelledby="markov-period-title markov-period-desc">
      <title id="markov-period-title">周期2的交替链，初始全部在城市</title>
      <desc id="markov-period-desc">从城市概率1开始，时刻0、1、2、3的分布依次为(1,0)、(0,1)、(1,0)、(0,1)。绿色城市，蓝色乡村；每对柱的概率和为1。</desc>
      <line x1="32" y1="140" x2="348" y2="140" class="axis"/>
      <text x="6" y="47">1</text><text x="6" y="145">0</text>
      <g v-for="({k,p},j) in steps" :key="k" :data-time="k" :data-city-probability="p[0]" :data-rural-probability="p[1]">
        <rect :x="53+j*78" :y="140-p[0]*100" width="18" :height="p[0]*100" class="fill-object"/>
        <rect :x="77+j*78" :y="140-p[1]*100" width="18" :height="p[1]*100" class="fill-part"/>
        <text :x="74+j*78" y="174" text-anchor="middle">k={{ k }}</text>
        <text :x="74+j*78" y="24" text-anchor="middle" class="edu-svg-math">({{ p[0] }}, {{ p[1] }})</text>
      </g>
    </svg>
    <div class="edu-legend"><span class="edu-key-object">城市概率</span><span class="edu-key-principal">乡村概率</span></div>
    <figcaption>每对柱按“城市、乡村”排序，零高柱表示概率 0。唯一平稳分布是 (1/2, 1/2)，但从本图初值会一直交替；若从平稳分布出发才保持不变。</figcaption>
  </figure>
</template>
