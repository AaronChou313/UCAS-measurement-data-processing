<script setup>
import standard from './figures/basis-standard.svg?raw'
import oblique from './figures/basis-oblique.svg?raw'
import active from './figures/rotation-active.svg?raw'
import passive from './figures/rotation-passive.svg?raw'
import sr from './figures/order-sr.svg?raw'
import rs from './figures/order-rs.svg?raw'
import MathMatrix from './MathMatrix.vue'
import { basisExample, matVec, rotation, solve2, formatNumber } from './math.mjs'
const props = defineProps({ kind: { type: String, default: 'basis' } })
const vector = basisExample.vector
const column = x => x.map(v => [formatNumber(v)])
const pairs = {
  basis: [{ svg: standard, name: 'v', value: vector, note: '沿标准基先走 3e₁，再走 e₂。' }, { svg: oblique, name: 'c', value: solve2(basisExample.basis,vector), note: '先走 2b₁，再走一份 b₂，物理终点不动。' }],
  rotation: [{ svg: active, name: 'Rv', value: matVec(rotation(Math.PI/2),vector), note: '固定参考轴，原箭头逆时针转过90°。' }, { svg: passive, name: 'c′', value: matVec(rotation(-Math.PI/2),vector), note: '新x′轴向上、新y′轴向左；新纵坐标为−3。' }],
  order: [{ svg: sr, name: 'SRx', value: [0,1], note: '输入 → R：(0,1) → S：(0,1)。' }, { svg: rs, name: 'RSx', value: [0,2], note: '输入 → S：(2,0) → R：(0,2)。' }],
}
</script>

<template>
  <figure :id="'v01-'+kind" class="edu-visual edu-coordinate" data-visualization="V01" :aria-label="kind === 'basis' ? '同一向量的两套坐标表示' : kind === 'rotation' ? '主动与被动旋转对照' : '旋转与缩放的顺序对照'">
    <div class="edu-figure-grid">
      <div v-for="item in pairs[props.kind]" :key="item.name" class="edu-coordinate-panel">
        <div class="edu-svg" v-html="item.svg" />
        <p class="edu-panel-note">{{ item.note }}</p>
        <div class="edu-math-line edu-math"><span v-if="kind==='basis'"><b>{{ item.name }}</b> =</span><span v-else-if="kind==='rotation'"><template v-if="item.name==='Rv'">R<b>v</b></template><template v-else><b>c</b>′</template> =</span><span v-else>{{ item.name.slice(0,2) }}<b>x</b> =</span> <MathMatrix :rows="column(item.value)" :label="item.name+'的坐标列向量'" /></div>
      </div>
    </div>
    <figcaption v-if="kind==='basis'">绿色实线是同一个物理向量。右图棕箭头分别表示一份 b₁、一份 b₂；蓝虚线把 2b₁ 与一份 b₂ 首尾相接。本例 b₂ 的长度为 <span class="edu-root">√<span>2</span></span>；系数 1 表示取一份 b₂，不是在说长度为 1。</figcaption>
    <figcaption v-else-if="kind==='rotation'">左图灰虚线是原向量，绿实线是旋转结果；右图棕轴是新坐标轴，绿色物理向量未移动。新坐标 c′ = R<sup>T</sup>v，图下均使用列向量。</figcaption>
    <figcaption v-else>R 是逆时针90°旋转，S 沿x放大2倍、沿y不变；从最右侧矩阵开始执行。蓝色空心圆标第一步的终点，绿箭头标最终结果；SR 中两点重合，因为 S 不改变纵向长度。各面板长度比例相同。</figcaption>
  </figure>
</template>
