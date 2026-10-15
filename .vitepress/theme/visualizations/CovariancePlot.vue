<script setup>
import { computed } from 'vue'
import { covariancePlot } from './math.mjs'
const props = defineProps({ model: { type: Object, required: true }, probability: Boolean, idPrefix: { type: String, required: true } })
const g = computed(() => covariancePlot(props.model,props.probability))
const uid = computed(() => props.idPrefix)
const ux = computed(() => (props.probability ? 2.7 : 1.7)/Math.SQRT2)
</script>

<template>
  <svg class="edu-cov-plot" viewBox="0 0 360 280" role="img" :aria-labelledby="uid+'-title '+uid+'-desc'">
    <title :id="uid+'-title'">{{ probability ? '已知二维正态的95%概率椭圆' : '标准协方差椭圆、坐标投影与主轴' }}</title>
    <desc :id="uid+'-desc'">坐标标准差为2米和1米，相关系数 {{ model.rho }}。{{ probability ? '外侧实线内部概率为95%，内虚线距离平方为1。' : '实线的Mahalanobis距离平方为1。' }}蓝线是两条主半轴，灰色点线矩形标坐标投影半宽。棕箭头只指示45度方向，绘制长度任意，不表示方差或一米。</desc>
    <defs><marker :id="uid+'-arrow'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" class="fill-basis"/></marker></defs>
    <rect width="360" height="280" class="plot-bg" rx="4"/>
    <rect :x="g.px(-g.halfWidth)" :y="g.py(g.halfHeight)" :width="2*g.halfWidth*g.scale" :height="2*g.halfHeight*g.scale" class="ghost" fill="none"/>
    <line x1="36" y1="230" x2="342" y2="230" class="axis"/><line x1="36" y1="32" x2="36" y2="230" class="axis"/>
    <line x1="36" y1="125" x2="342" y2="125" class="edu-zero-axis"/><line x1="180" y1="32" x2="180" y2="230" class="edu-zero-axis"/>
    <template v-for="x in probability ? [-4,-2,2,4] : [-2,-1,1,2]" :key="'x'+x"><line :x1="g.px(x)" y1="227" :x2="g.px(x)" y2="233" class="tick"/><text :x="g.px(x)" y="252" text-anchor="middle" class="tick-text">{{ x }}</text></template>
    <template v-for="y in [-1,1]" :key="'y'+y"><line x1="33" :y1="g.py(y)" x2="39" :y2="g.py(y)" class="tick"/><text x="28" :y="g.py(y)+6" text-anchor="end" class="tick-text">{{ y }}</text></template>
    <text x="344" y="274" text-anchor="end">x / m</text><text x="36" y="22">y / m</text><text x="180" y="252" text-anchor="middle">0</text><text x="28" y="131" text-anchor="end">0</text>
    <path v-if="probability" :d="g.innerPath" class="edu-unit-contour" fill="none" data-curve="unit"/>
    <path :d="g.path" class="object" fill="none" data-curve="boundary"/>
    <line v-for="(p,j) in g.axes" :key="j" x1="180" y1="125" :x2="g.px(p[0])" :y2="g.py(p[1])" class="edu-principal-axis"/>
    <text v-for="(p,j) in g.axes" :key="'label'+j" :x="g.px(p[0])+8" :y="g.py(p[1])-12" class="part-label edu-svg-math">{{ probability ? ['a','b'][j] : ['√λ₁','√λ₂'][j] }}</text>
    <line x1="180" y1="125" :x2="g.px(ux)" :y2="g.py(ux)" class="basis" :marker-end="'url(#'+uid+'-arrow)'"/>
    <text :x="probability ? g.px(ux)+8 : g.px(ux*.65)+12" :y="probability ? g.py(ux)+20 : g.py(ux*.65)+10" class="basis-label edu-svg-vector">u</text>
    <circle cx="180" cy="125" r="3" class="fill-object"/>
  </svg>
</template>
