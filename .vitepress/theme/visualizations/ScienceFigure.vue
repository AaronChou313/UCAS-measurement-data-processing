<script setup>
import { computed } from "vue";
import catalog from "./figures/full/catalog.json";
const props = defineProps({ id: { type: String, required: true } });
const sources = import.meta.glob("./figures/full/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});
const figure = computed(() => {
  if (!catalog[props.id]) throw new Error("Unknown course figure " + props.id);
  return catalog[props.id];
});
</script>
<template>
  <figure
    :id="id"
    class="edu-visual edu-science"
    :data-visualization="figure.candidate"
  >
    <strong class="edu-title">{{ figure.title }}</strong>
    <p>{{ figure.lead }}</p>
    <div class="edu-figure-grid">
      <div v-for="panel in figure.panels" :key="panel.file">
        <strong class="edu-panel-title">{{ panel.title }}</strong>
        <div
          class="edu-science-svg"
          v-html="sources['./figures/full/' + panel.file + '.svg']"
        />
      </div>
    </div>
    <figcaption>{{ figure.caption }}</figcaption>
  </figure>
</template>
