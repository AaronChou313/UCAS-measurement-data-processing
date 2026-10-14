<script setup>
import { computed } from 'vue'
import { covarianceEllipse, ellipsePoint } from './math.mjs'
const props=defineProps({rho:{type:Number,default:.5},probability:{type:Boolean,default:false}})
const m=computed(()=>covarianceEllipse(props.rho))
const scale=computed(()=>props.probability?34:66)
const threshold=computed(()=>props.probability?m.value.s:1)
const px=x=>240+scale.value*x, py=y=>170-scale.value*y
const pathFor=s=>Array.from({length:181},(_,i)=>{const p=ellipsePoint(m.value,i*Math.PI/90,s);return `${i?'L':'M'}${px(p[0]).toFixed(3)},${py(p[1]).toFixed(3)}`}).join(' ')+' Z'
const axes=computed(()=>[0,1].map(j=>{
  const length=Math.sqrt(threshold.value*[m.value.lambda1,m.value.lambda2][j]);
  const angle=m.value.angle+j*Math.PI/2;
  return [length*Math.cos(angle),length*Math.sin(angle)]
}))
const halfWidth=computed(()=>2*Math.sqrt(threshold.value))
const halfHeight=computed(()=>Math.sqrt(threshold.value))
const extent=computed(()=>props.probability?[6,3.5]:[3.1,2.1])
const uid=computed(()=>props.probability?'cov-probability':'cov-shape')
</script>

<template>
  <svg class="edu-cov-plot" viewBox="0 0 480 330" role="img" :aria-labelledby="uid+'-title '+uid+'-desc'">
    <title :id="uid+'-title'">{{ probability?'已知二维正态的 95% 概率椭圆':'标准协方差椭圆、坐标投影与主轴' }}</title>
    <desc :id="uid+'-desc'">均值为零，坐标标准差为 2 米和 1 米，相关系数 {{ rho }}。{{ probability?'外侧实线是平方 Mahalanobis 距离等于 5.991 的边界；内侧虚线是距离平方等于 1。':'实线的平方 Mahalanobis 距离等于 1，外切矩形半宽为坐标标准差。' }}蓝色两根线沿主轴，棕色箭头只标 45 度投影方向，不表示标准差的长度。</desc>
    <defs><marker :id="uid+'-arrow'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" class="fill-basis"/></marker></defs>
    <rect width="480" height="330" class="plot-bg" rx="4"/>
    <text x="18" y="29" class="plot-heading">{{ probability?'固定 q = 95%，只改变 ρ':'固定 C：先分清形状与方向' }}</text>
    <rect :x="px(-halfWidth)" :y="py(halfHeight)" :width="2*halfWidth*scale" :height="2*halfHeight*scale" class="ghost" fill="none"/>
    <line :x1="px(-extent[0])" y1="170" :x2="px(extent[0])" y2="170" class="axis"/>
    <line x1="240" :y1="py(-extent[1])" x2="240" :y2="py(extent[1])" class="axis"/>
    <template v-for="x in probability?[-4,-2,2,4]:[-2,-1,1,2]" :key="'x'+x"><line :x1="px(x)" y1="166" :x2="px(x)" y2="174" class="tick"/><text :x="px(x)" y="192" text-anchor="middle" class="tick-text">{{ x }}</text></template>
    <template v-for="y in [-1,1]" :key="'y'+y"><line x1="236" :y1="py(y)" x2="244" :y2="py(y)" class="tick"/><text x="228" :y="py(y)+5" text-anchor="end" class="tick-text">{{ y }}</text></template>
    <text x="444" y="159">x / m</text><text x="250" y="53">y / m</text><text x="221" y="191">0</text>
    <path v-if="probability" :d="pathFor(1)" class="part" fill="none"/>
    <path :d="pathFor(threshold)" class="object" fill="none"/>
    <line v-for="(p,j) in axes" :key="j" x1="240" y1="170" :x2="px(p[0])" :y2="py(p[1])" class="part"/>
    <text v-for="(p,j) in axes" :key="'label'+j" :x="px(p[0])+10" :y="py(p[1])-10" class="part-label">{{ probability?['a','b'][j]:['√λ₁','√λ₂'][j] }}</text>
    <line x1="240" y1="170" :x2="px((probability?2.7:1.7)/Math.SQRT2)" :y2="py((probability?2.7:1.7)/Math.SQRT2)" class="basis" :marker-end="'url(#'+uid+'-arrow)'"/>
    <text :x="px((probability?2.7:1.7)/Math.SQRT2)+8" :y="py((probability?2.7:1.7)/Math.SQRT2)-3" class="basis-label">u（45°）</text>
    <circle cx="240" cy="170" r="3" class="fill-object"/>
    <text x="18" y="304" class="muted-label">实线：d<tspan baseline-shift="sub" font-size="13">M</tspan>² = {{ probability?'s':'1' }}；{{ probability?'内虚线：':'蓝虚线：主轴标准差' }}<template v-if="probability">d<tspan baseline-shift="sub" font-size="13">M</tspan>² = 1</template></text>
  </svg>
</template>
