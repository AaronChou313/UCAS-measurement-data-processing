<script setup>
import { computed } from 'vue'
const props = defineProps({ rows: { type: Array, required: true }, label: { type: String, required: true }, cellChars: { type: Number, default: 2 } })
const description = computed(() => `${props.label}，${props.rows.length}行${props.rows[0].length}列；` + props.rows.map((row,i) => `第${i+1}行：${row.join('，')}`).join('；'))
</script>

<template>
  <span class="edu-math-matrix" role="math" :aria-label="description" :data-matrix-label="label" :data-rows="rows.length" :data-columns="rows[0].length">
    <span class="edu-matrix-grid" aria-hidden="true" :style="{gridTemplateColumns:`repeat(${rows[0].length}, minmax(${cellChars}ch, auto))`}">
      <template v-for="(row,i) in rows" :key="i"><span v-for="(value,j) in row" :key="j" :data-row="i" :data-col="j">{{ String(value).replace(/^-/, '−') }}</span></template>
    </span>
  </span>
</template>
