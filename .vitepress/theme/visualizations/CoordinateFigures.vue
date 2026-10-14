<script setup>
import standard from './figures/basis-standard.svg?raw'
import oblique from './figures/basis-oblique.svg?raw'
import active from './figures/rotation-active.svg?raw'
import passive from './figures/rotation-passive.svg?raw'
import sr from './figures/order-sr.svg?raw'
import rs from './figures/order-rs.svg?raw'
const props = defineProps({ kind: { type: String, default: 'basis' } })
const pairs = { basis: [standard, oblique], rotation: [active, passive], order: [sr, rs] }
</script>

<template>
  <figure :id="'v01-'+kind" class="edu-visual" data-visualization="V01" :aria-label="kind === 'basis' ? '同一向量的两套坐标表示' : kind === 'rotation' ? '主动与被动旋转对照' : '旋转与缩放的顺序对照'">
    <div class="edu-figure-grid">
      <div v-for="(svg, i) in pairs[props.kind]" :key="i" class="edu-svg" v-html="svg" />
    </div>
    <figcaption>实线箭头：当前对象；虚线折线：分量构造或第一步；细轴：固定参考。图中各面板采用相同长度比例。</figcaption>
  </figure>
</template>
