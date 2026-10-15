<script setup>
import { computed, onMounted, ref } from "vue";
import { kalmanExample, teachingStep } from "./full-math.mjs";
const m = kalmanExample(),
  stage = ref(0),
  ready = ref(false);
onMounted(() => (ready.value = true));
const names = [
  "上一时刻 k−1",
  "当前 k：预测",
  "当前 k：读入观测",
  "当前 k：更新",
];
const estimate = computed(() =>
  stage.value === 0 ? m.previous : stage.value < 3 ? m.predicted : m.posterior,
);
const covariance = computed(() =>
  stage.value === 0
    ? m.previousCov
    : stage.value < 3
      ? m.priorCov
      : m.posteriorCov,
);
const notes = [
  "上一时刻估计位置9 m、速度1 m/s。图中是估计及其误差尺度，真实状态未知。",
  "经过1 s匀速预测，位置变为10 m，速度不变。本例Q=0，预测位置方差仍为4 m²；预测不一定增大每个分量的方差。",
  "位置观测z=12 m，比预测多2 m。这2 m是创新，不是已知的真实误差。位置观测噪声标准差为1 m。",
  "位置修正1.6 m，速度也修正0.4 m/s：先验的位置-速度相关项使位置观测能够影响速度。",
];
const x = (v, i) => (i === 0 ? 36 + (v - 5) * 24 : 36 + (v + 2) * 60);
const sd = (i) => Math.sqrt(covariance.value[i][i]);
function move(a) {
  stage.value = teachingStep(stage.value, a, 3);
}
</script>
<template>
  <figure id="v26-kalman" class="edu-visual edu-kalman" data-visualization="V26">
    <strong class="edu-title">预测与观测，怎样共同修正估计？</strong>
    <p>
      固定使用上方二维数例：状态为位置和速度，间隔1
      s；只观测位置。每次看一个阶段。
    </p>
    <strong class="edu-kalman-stage">{{ names[stage] }}</strong>
    <svg
      viewBox="0 0 360 252"
      role="img"
      aria-labelledby="kalman-title kalman-desc"
      :data-stage="stage"
    >
      <title id="kalman-title">{{ names[stage] }}的位置和速度估计</title>
      <desc id="kalman-desc">
        {{
          notes[stage]
        }}两行分别使用米和米每秒，线段是估计值加减一个边缘标准差，不是二维置信区域。
      </desc>
      <g
        v-for="i in [0, 1]"
        :key="i"
        :data-estimate="estimate[i]"
        :data-variance="covariance[i][i]"
      >
        <text x="16" :y="i * 115 + 24">
          {{ i === 0 ? "位置 / m" : "速度 / (m/s)" }}
        </text>
        <line
          x1="36"
          :y1="i * 115 + 82"
          x2="324"
          :y2="i * 115 + 82"
          class="axis"
        />
        <template
          v-for="v in i === 0 ? [6, 8, 10, 12, 14, 16] : [-2, 0, 2]"
          :key="v"
        >
          <line
            :x1="x(v, i)"
            :y1="i * 115 + 78"
            :x2="x(v, i)"
            :y2="i * 115 + 86"
            class="tick"
          />
          <text :x="x(v, i)" :y="i * 115 + 108" text-anchor="middle">
            {{ v }}
          </text>
        </template>
        <line
          :x1="x(estimate[i] - sd(i), i)"
          :y1="i * 115 + 58"
          :x2="x(estimate[i] + sd(i), i)"
          :y2="i * 115 + 58"
          class="object"
        />
        <circle
          :cx="x(estimate[i], i)"
          :cy="i * 115 + 58"
          r="5"
          class="fill-object"
        />
        <template v-if="i === 0 && stage >= 2">
          <line :x1="x(m.z, 0)" y1="38" :x2="x(m.z, 0)" y2="72" class="part" />
          <text :x="x(m.z, 0) + 9" y="44" class="part-label">z=12</text>
        </template>
      </g>
    </svg>
    <div class="edu-legend">
      <span class="edu-key-object">估计值 ± 1个边缘标准差</span
      ><span v-if="stage >= 2" class="edu-key-principal">位置观测</span>
    </div>
    <p class="edu-observe" role="status">{{ notes[stage] }}</p>
    <div v-if="ready" class="edu-controls">
      <button :disabled="stage === 0" @click="move('previous')">上一步</button
      ><button :disabled="stage === 3" @click="move('next')">
        {{ stage === 3 ? "已更新" : "下一步" }}</button
      ><button :disabled="stage === 0" @click="move('reset')">重置</button>
    </div>
    <figcaption>
      绿色点与线不是未知真值。两行单位、尺度不同；不把它们画成等单位欧氏椭圆。增益、创新协方差与Joseph更新在正文逐式核对。
    </figcaption>
    <p v-if="!ready" class="edu-note">
      静态对照：预测(10 m, 1 m/s) → 观测位置12 m → 更新(11.6 m, 1.4
      m/s)。更新后两分量方差为0.8 m²、1.8 m²/s²。
    </p>
  </figure>
</template>
