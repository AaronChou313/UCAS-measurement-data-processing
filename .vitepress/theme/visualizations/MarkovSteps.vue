<script setup>
import { computed, onMounted, ref } from 'vue'
import { markovModels, markovDistribution, advanceMarkov, formatNumber } from './math.mjs'
const ready = ref(false)
const k = ref(0)
onMounted(() => { ready.value = true })
const distribution = computed(() => markovDistribution('city',.8,k.value))
const stationary = markovModels.city.stationary
const percent = p => formatNumber(p*100,2,true)
function move(action) { k.value = advanceMarkov(k.value,action) }
const fallbackCity = percent(markovDistribution('city',.8,60)[0])
</script>

<template>
  <figure id="v18-markov" class="edu-visual edu-markov" data-visualization="V18">
    <strong class="edu-title">重复迁移，分布会靠近哪里？</strong>
    <p>每步迁移概率：城市→乡村 5%，乡村→城市 3%。初始城市 80%、乡村 20%。</p>
    <div class="edu-distribution" :data-time="k" :data-city-probability="distribution[0]" :data-rural-probability="distribution[1]">
      <div class="edu-time">时刻 <span class="edu-math">k = {{ k }}</span></div>
      <div v-for="(p,i) in distribution" :key="i" class="edu-distribution-row">
        <span>{{ ['城市','乡村'][i] }}</span>
        <div class="edu-probability-track" aria-hidden="true"><span :class="i===0?'edu-bar-city':'edu-bar-rural'" :style="{width:p*100+'%'}"/><span class="edu-stationary-marker" :style="{left:stationary[i]*100+'%'}"/></div>
        <span class="edu-probability-value">{{ percent(p) }}%</span>
      </div>
      <div class="edu-distribution-scale"><span>0%</span><span>100%</span></div>
    </div>
    <div v-if="ready" class="edu-controls edu-evolution-controls">
      <button :disabled="k===60" @click="move('next')">下一步</button>
      <button :disabled="k===60" @click="move('jump')">前进 10 步</button>
      <button :disabled="k===0" @click="move('reset')">回到 k = 0</button>
    </div>
    <p v-else class="edu-note">静态对照：第一步城市为 76.60%；第 60 步约为 {{ fallbackCity }}%。启用 JavaScript 后可逐步查看。</p>
    <span class="edu-sr-only" role="status">时刻 {{ k }}，城市 {{ percent(distribution[0]) }}%，乡村 {{ percent(distribution[1]) }}%。{{ k===60?'已到演示上限，可回到初始时刻。':'' }}</span>
    <figcaption>虚线：城市 37.5%、乡村 62.5%。条长表示状态概率，整条轨道始终为 100%；分布趋近不表示居民停止迁移。{{ k===60?'演示到第 60 步为止，有限步图形不是极限证明。':'' }}</figcaption>
  </figure>
</template>
