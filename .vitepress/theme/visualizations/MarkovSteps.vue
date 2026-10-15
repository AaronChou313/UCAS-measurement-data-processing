<script setup>
import { computed, onMounted, ref } from 'vue'
import MathMatrix from './MathMatrix.vue'
import MarkovCalculation from './MarkovCalculation.vue'
import { markovModels, markovDistribution, markovStep, navigateMarkov, formatNumber } from './math.mjs'
const ready = ref(false)
const model = ref('city')
const initial = ref(.8)
const state = ref({ k: 0, phase: 0 })
onMounted(() => { ready.value = true })
const k = computed(() => state.value.k)
const phase = computed(() => state.value.phase)
const chosen = computed(() => markovModels[model.value])
const current = computed(() => markovDistribution(model.value,initial.value,k.value))
const f = x => formatNumber(x,5)
const matrixRows = computed(() => chosen.value.matrix.map(row => row.map(f)))
const nextDistribution = computed(() => markovStep(chosen.value.matrix,current.value).next)
const currentRows = computed(() => current.value.map(v => [f(v)]))
const stages = ['读矩阵与当前分布','计算来源贡献','合计下一分布']
const actions = ['显示来源贡献','合计下一分布','进入下一时刻']
const labels = { city: '城市迁移（收敛）', alternating: '交替链（周期2）', identity: '单位矩阵（保持初值）' }
function move(action) { state.value = navigateMarkov(state.value,action) }
function restart() { move('reset') }
function reset() { model.value = 'city'; initial.value = .8; restart() }
function changeModel() { initial.value = model.value==='city' ? .8 : 1; restart() }
const shownStep = computed(() => k.value+(phase.value===2 ? 1 : 0))
const history = computed(() => Array.from({length:shownStep.value+1},(_,j) => ({k:j,p:markovDistribution(model.value,initial.value,j)[0]})))
const horizon = computed(() => Math.max(6,shownStep.value))
const hx = j => 36+j/horizon.value*300
const hy = p => 155-p*120
const times = [0,1,2,3,20,60]
const conclusion = computed(() => model.value==='city'
  ? '城市模型：任意初分布都趋向城市概率 0.375、乡村概率 0.625。居民仍可迁移；分布趋近不表示随机状态停止改变。'
  : model.value==='alternating'
    ? initial.value===.5 ? '交替链：恰从平稳分布出发，分布不变；其他初值不一定收敛。唯一平稳分布的城市概率为 0.5。' : '交替链：当前分布不断交替，不收敛；它仍有唯一平稳分布，城市与乡村概率各为 0.5。'
    : '单位矩阵：每步都等于初值；每个分布都平稳，没有所有初值共同趋向的唯一平稳分布。')
</script>

<template>
  <section id="v18-markov" class="edu-visual edu-markov" aria-label="Markov 链分步教学" data-visualization="V18">
    <strong class="edu-title">从两个来源，算出下一步分布</strong>
    <p>默认例中城市占 80%。乡村有人迁入，城市总比例就一定上升吗？先预测，再检查四个来源乘积。</p>
    <div v-if="ready" class="edu-controls">
      <label>转移模型<select v-model="model" @change="changeModel"><option v-for="(item,id) in labels" :key="id" :value="id">{{ item }}</option></select></label>
      <label>初始城市概率<select v-model.number="initial" @change="restart"><option v-for="n in [0,.375,.5,.8,1]" :key="n" :value="n">{{ n }}（乡村 {{ f(1-n) }}）</option></select></label>
    </div>
    <p v-else class="edu-note">静态阅读：下方展开的手算包含默认模型的完整贡献、结果和反例对照。</p>
    <div class="edu-markov-input">
      <div><strong>规则：P</strong><div class="edu-math-line edu-math">P = <MathMatrix :rows="matrixRows" label="转移矩阵，列为出发，行为到达" /></div></div>
      <div class="edu-current"><strong>输入：时刻 {{ k }}</strong><div class="edu-math-line edu-math"><span><b>p</b><sub>{{ k }}</sub> {{ k===0 ? '=' : '≈' }}</span> <MathMatrix :rows="currentRows" label="当前时刻的概率列向量" /></div></div>
    </div>
    <p class="edu-note">行、列均按“城市、乡村”排序。P 的列是出发、行是到达，每列和为 1；<b class="edu-math">p</b><sub>{{ k }}</sub> 是状态概率，不是某个居民的位置。</p>
    <div v-if="ready" class="edu-controls edu-step-controls">
      <button :disabled="k===0 && phase===0" @click="move('previous')">上一步</button>
      <button :disabled="k===60" @click="move('next')">{{ k===60 ? '已到时刻60' : actions[phase] }}</button>
      <button @click="reset">恢复默认</button>
      <span class="edu-step-label">{{ k===60 ? '可回退检查或恢复默认' : `时刻 ${k} → ${k+1} · ${phase+1}/3` }}</span>
    </div>
    <div class="edu-stage" :data-step="k" :data-phase="phase">
      <strong>{{ k===60 ? '已到演示终点' : `${phase+1}. ${stages[phase]}` }}</strong>
      <p v-if="phase===0">{{ k===60 ? '当前分布仍可从上方读取。有限步图像不能证明极限，可回退检查已有计算。' : ready ? '先读当前列向量。求下一步的城市概率时，要合并“原在城市”和“原在乡村”两条互斥路径。' : '当前分布与矩阵已给出；下方“静态手算与长期对比”展开完整计算。' }}</p>
      <MarkovCalculation v-else :matrix="chosen.matrix" :distribution="current" :k="k" :phase="phase" />
    </div>
    <span class="edu-sr-only" role="status">时刻 {{ k }}，{{ k===60 ? '到达演示上限' : `阶段${phase+1}：${stages[phase]}` }}。当前城市概率 {{ f(current[0]) }}，乡村概率 {{ f(current[1]) }}。<template v-if="phase===2">下一步城市概率 {{ f(nextDistribution[0]) }}，乡村概率 {{ f(nextDistribution[1]) }}。</template></span>
    <figure class="edu-history"><svg viewBox="0 0 360 205" role="img" aria-label="城市概率的离散递推历史；固定概率纵轴，点不作连续连线">
      <line x1="36" y1="155" x2="336" y2="155" class="axis"/><line x1="36" y1="35" x2="36" y2="155" class="axis"/>
      <text x="36" y="22">城市概率</text><text x="336" y="198" text-anchor="end">时刻 k</text><text x="22" y="160" text-anchor="end">0</text><text x="22" y="40" text-anchor="end">1</text>
      <template v-if="chosen.stationary"><line x1="36" :y1="hy(chosen.stationary[0])" x2="336" :y2="hy(chosen.stationary[0])" class="part"/><text x="200" :y="hy(chosen.stationary[0])-10">π₁ = {{ chosen.stationary[0] }}</text></template>
      <circle v-for="item in history" :key="item.k" :cx="hx(item.k)" :cy="hy(item.p)" r="3.5" class="fill-object"/>
      <text x="36" y="177">0</text><text x="328" y="177">{{ horizon }}</text>
    </svg><figcaption>只画已完成的递推点；横轴随步数扩展，纵轴固定为 0—1。<template v-if="chosen.stationary">虚线标平稳分布的城市概率 π₁，不保证当前分布一定趋向它。</template><template v-else>此模型的每个初分布都平稳，因此不画一条共同的平稳参照线。</template></figcaption></figure>
    <p class="edu-observe">{{ conclusion }}</p>
    <details class="edu-fallback" :open="!ready"><summary>静态手算与长期对比</summary>
      <p>默认城市模型第一步：按来源计算，再按到达状态求和。</p>
      <MarkovCalculation :matrix="markovModels.city.matrix" :distribution="[.8,.2]" :k="0" :phase="2" />
      <div class="edu-math-line edu-math"><span>第二步：<b>p</b><sub>2</sub> =</span> <MathMatrix :rows="[[.73472],[.26528]]" label="默认城市模型第二步的概率列向量" /></div>
      <p class="edu-note">下面表格较宽，可横向滚动；聚焦表格后可用方向键查看。</p>
      <table tabindex="0" class="edu-long-table"><caption>城市概率 u<sub>k</sub> = p<sub>k,1</sub>（小数经舍入）</caption><thead><tr><th scope="col">模型与初值</th><th v-for="j in times" :key="j" scope="col">k={{ j }}</th></tr></thead><tbody><tr v-for="id in ['city','alternating','identity']" :key="id"><th scope="row">{{ id==='city' ? '城市，u₀=0.8' : id==='alternating' ? '交替，u₀=1' : '单位矩阵，u₀=1' }}</th><td v-for="j in times" :key="j">{{ f(markovDistribution(id,id==='city' ? .8 : 1,j)[0]) }}</td></tr><tr v-if="ready"><th scope="row">当前设置，u₀={{ initial }}</th><td v-for="j in times" :key="j">{{ f(markovDistribution(model,initial,j)[0]) }}</td></tr></tbody></table>
      <p>城市模型有 <span class="edu-math">u<sub>k</sub> = 0.375 + 0.92<sup>k</sup>(u<sub>0</sub> − 0.375)</span>。交替模型从 u₀=1 出发，奇数步为 0、偶数步为 1；单位矩阵始终等于初值。有限数值表不代替正文的收敛条件。</p>
    </details>
  </section>
</template>
