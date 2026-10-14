<script setup>
import { computed, onMounted, ref } from 'vue'
import { markovModels, markovDistribution, markovStep } from './math.mjs'
const ready=ref(false), model=ref('city'), initial=ref(.8), k=ref(0), phase=ref(0)
onMounted(()=>{ready.value=true})
const chosen=computed(()=>markovModels[model.value])
const current=computed(()=>markovDistribution(model.value,initial.value,k.value))
const calculation=computed(()=>markovStep(chosen.value.matrix,current.value))
const stages=['读当前分布','计算每个来源的贡献','按行求和，得到下一分布']
const format=x=>x.toFixed(5).replace(/0+$/,'').replace(/\.$/,'')
function reset(){k.value=0;phase.value=0}
function changeModel(){initial.value=model.value==='city'?.8:1;reset()}
function next(){if(k.value>=60)return;if(phase.value<2)phase.value++;else if(k.value<60){k.value++;phase.value=0}}
function previous(){if(phase.value>0)phase.value--;else if(k.value>0){k.value--;phase.value=2}}
const shownStep=computed(()=>k.value+(phase.value===2?1:0))
const history=computed(()=>Array.from({length:shownStep.value+1},(_,j)=>({k:j,p:markovDistribution(model.value,initial.value,j)[0]})))
const horizon=computed(()=>Math.max(6,shownStep.value))
const hx=j=>42+j/horizon.value*440
const hy=p=>165-p*130
const comparison=computed(()=>[0,1,20,60].map(j=>({k:j,p:markovDistribution(model.value,initial.value,j)})))
const conclusion=computed(()=>model.value==='city'
  ? '城市模型：初值不同，分布都趋近 (0.375, 0.625)。趋近是分布的性质，居民仍可迁移；有限步图像不是极限定理的证明。'
  : model.value==='alternating'
    ? initial.value===.5 ? '交替链：恰从平稳分布 (0.5, 0.5) 出发，分布保持不变；这不能推出其他初值也收敛。' : '交替链：当前分布来回交替，不收敛；但唯一平稳分布仍为 (0.5, 0.5)。'
    : '单位矩阵：当前分布一直等于初始分布。每个概率向量都是平稳分布，没有所有初值共同趋向的唯一平稳分布。')
</script>

<template>
  <section id="v18-markov" class="edu-visual edu-markov" aria-label="Markov 链分步教学" data-visualization="V18">
    <header class="edu-intro">
      <strong class="edu-title">从两个来源，算出下一步分布</strong>
      <p>先预测默认城市模型：城市已有 80%，即使乡村有人迁入，下一年城市比例也一定上升吗？先算乘积，再按到达状态相加。</p>
    </header>
    <div v-if="ready" class="edu-controls">
      <label>转移模型<select v-model="model" @change="changeModel"><option v-for="(item,id) in markovModels" :key="id" :value="id">{{ item.label }}</option></select></label>
      <label>初始城市概率<select v-model.number="initial" @change="reset"><option v-for="n in [0,.375,.5,.8,1]" :key="n" :value="n">{{ n }}（乡村 {{ format(1-n) }}）</option></select></label>
    </div>
    <p v-else class="edu-note">静态阅读：下面给出默认模型的初始分布与完整手算表。启用 JavaScript 后可回退、推进和切换反例。</p>
    <div class="edu-matrix-row">
      <div>
        <strong>列 = 出发，行 = 到达</strong>
        <table tabindex="0" class="edu-matrix"><caption>转移矩阵 P（各列概率和为 1）</caption><thead><tr><th scope="col">到达 ＼ 出发</th><th scope="col">城市</th><th scope="col">乡村</th></tr></thead><tbody><tr v-for="(row,i) in chosen.matrix" :key="i"><th scope="row">{{ ['城市','乡村'][i] }}</th><td v-for="(v,j) in row" :key="j">{{ format(v) }}</td></tr></tbody></table>
      </div>
      <div class="edu-current"><strong>当前：时刻 k = {{ k }}</strong><p>p<sub>k</sub> = ({{ format(current[0]) }}, {{ format(current[1]) }})ᵀ</p>
        <div v-for="(v,i) in current" :key="i" class="edu-bar-row"><span>{{ ['城市','乡村'][i] }}</span><div class="edu-bar-track"><span :style="{width:(v*100)+'%'}" :class="i===0?'edu-bar-city':'edu-bar-rural'" /></div><span>{{ (v*100).toFixed(2) }}%</span></div>
        <p class="edu-note">这里是状态概率，不是某个居民的实际位置。</p>
      </div>
    </div>
    <div v-if="ready" class="edu-controls edu-step-controls"><button :disabled="k===0 && phase===0" @click="previous">上一步</button><button :disabled="k===60" @click="next">{{ phase===2?'进入下一时刻':'下一步' }}</button><button @click="reset">重置</button><span>{{ k===60 ? '已到演示上限：时刻 60，可回退或重置' : `时刻 ${k} → ${k+1} · 阶段 ${phase+1}/3` }}</span></div>
    <div class="edu-stage" aria-live="polite" aria-atomic="true">
      <strong>{{ phase+1 }}. {{ stages[phase] }}（k = {{ k }}）</strong>
      <p v-if="phase===0">固定本页矩阵 P，输入当前 p<sub>{{ k }}</sub> = ({{ format(current[0]) }}, {{ format(current[1]) }})ᵀ。下一步的城市概率必须合并“原在城市”和“原在乡村”两条互斥路径。<template v-if="ready && k<60">点击下一步查看各乘积。</template><template v-else-if="k===60">已到演示上限，可回退检查计算或重置初值。</template><template v-else>下方静态回退表列出默认模型的完整乘积与求和。</template></p>
      <template v-else>
        <div v-for="(row,i) in calculation.contributions" :key="i" class="edu-equation">
          <strong>到达{{ ['城市','乡村'][i] }}：</strong>
          <span class="edu-source-city">{{ format(chosen.matrix[i][0]) }} × {{ format(current[0]) }} = {{ format(row[0]) }}（来自城市）</span>
          <span class="edu-source-rural">{{ format(chosen.matrix[i][1]) }} × {{ format(current[1]) }} = {{ format(row[1]) }}（来自乡村）</span>
          <span v-if="phase===2" class="edu-sum">相加：{{ format(row[0]) }} + {{ format(row[1]) }} = <b>{{ format(calculation.next[i]) }}</b></span>
        </div>
        <p v-if="phase===1">每个乘积都是 P<sub>ij</sub>p<sub>k,j</sub>：先到达当前出发状态，再走对应的转移路径。两条来源现在还没有相加。</p>
        <template v-else>
          <p><strong>p<sub>{{ k+1 }}</sub> = Pp<sub>{{ k }}</sub> = ({{ format(calculation.next[0]) }}, {{ format(calculation.next[1]) }})ᵀ</strong>；两项和为 {{ format(calculation.next[0]+calculation.next[1]) }}。</p>
          <div v-for="(row,i) in calculation.contributions" :key="i" class="edu-bar-row"><span>{{ ['城市','乡村'][i] }}</span><div class="edu-bar-track edu-stacked"><span class="edu-bar-city" :style="{width:row[0]*100+'%'}"/><span class="edu-bar-rural" :style="{width:row[1]*100+'%'}"/></div><span>{{ (calculation.next[i]*100).toFixed(2) }}%</span></div>
          <p class="edu-note">堆叠段按来源区分：绿色段来自城市，蓝色段来自乡村；段长是总概率的贡献，不是转移概率本身。</p>
        </template>
      </template>
    </div>
    <figure class="edu-history"><svg viewBox="0 0 510 216" role="img" aria-label="城市概率随离散时刻变化；横轴是已展示的时刻，纵轴是概率">
      <line x1="42" y1="165" x2="482" y2="165" class="axis"/><line x1="42" y1="35" x2="42" y2="165" class="axis"/>
      <text x="42" y="22">城市概率</text><text x="430" y="211">时刻 k</text><text x="27" y="169">0</text><text x="27" y="39">1</text>
      <template v-if="chosen.stationary"><line x1="42" :y1="hy(chosen.stationary[0])" x2="482" :y2="hy(chosen.stationary[0])" class="part"/><text x="190" :y="hy(chosen.stationary[0])-12">平稳分布：城市概率 {{ chosen.stationary[0] }}</text></template>
      <circle v-for="item in history" :key="item.k" :cx="hx(item.k)" :cy="hy(item.p)" r="3.5" class="fill-object"/>
      <text x="42" y="187">0</text><text x="470" y="187">{{ horizon }}</text>
    </svg><figcaption>仅显示已经完成的离散递推点；横轴随已展示步数扩展，纵轴始终为 0—1。虚线是平稳分布参照，不代表当前分布一定收敛。</figcaption></figure>
    <p class="edu-observe">{{ conclusion }}</p>
    <details class="edu-fallback" :open="!ready"><summary>静态回退：默认前两步与三个模型的长期对比</summary>
      <p>城市模型从 (0.8, 0.2)ᵀ 出发：第一步城市 0.95×0.8 + 0.03×0.2 = 0.766，乡村 0.05×0.8 + 0.97×0.2 = 0.234；第二步为 (0.73472, 0.26528)ᵀ。这是完整确定的概率递推，不是居民抽样模拟。</p>
      <table tabindex="0"><caption>固定初值下的精确递推（小数经舍入）</caption><thead><tr><th>模型与初值</th><th>k=0</th><th>k=1</th><th>k=20</th><th>k=60</th></tr></thead><tbody><tr v-for="id in ['city','alternating','identity']" :key="id"><th scope="row">{{ id==='city'?'城市，u₀=0.8':id==='alternating'?'交替，u₀=1':'单位矩阵，u₀=1' }}</th><td v-for="j in [0,1,20,60]" :key="j">{{ format(markovDistribution(id,id==='city'?.8:1,j)[0]) }}</td></tr></tbody></table>
      <p>城市模型满足 u<sub>k</sub> = 0.375 + 0.92<sup>k</sup>(u<sub>0</sub>−0.375)。交替模型从 u₀=1 出发，奇数步为 0、偶数步为 1，故偶数步表相同不表示收敛。单位矩阵则每步都等于初值。</p>
    </details>
    <details v-if="ready"><summary>当前设置：查看较长时刻的城市概率</summary><ul><li v-for="item in comparison" :key="item.k">k={{ item.k }}：{{ format(item.p[0]) }}</li></ul><p>这是所选矩阵和初值的递推结果；有限个时刻的表不能替代收敛条件。</p></details>
  </section>
</template>
