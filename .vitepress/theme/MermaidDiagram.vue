<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { renderMermaid } from '../mermaid.mjs'

const props = defineProps({ graph: { type: String, required: true } })
const { isDark, frontmatter } = useData()
const source = computed(() => decodeURIComponent(props.graph))
const theme = computed(() => frontmatter.value.mermaidTheme || (isDark.value ? 'dark' : 'default'))
const svg = ref('')
const failed = ref(false)
let revision = 0
let stop

async function draw() {
  const current = ++revision
  failed.value = false
  try {
    const result = await renderMermaid(source.value, theme.value)
    if (current === revision) svg.value = result.svg
  } catch {
    if (current === revision) {
      svg.value = ''
      failed.value = true
    }
  }
}

onMounted(() => {
  stop = watch([source, theme], draw, { immediate: true })
})
onBeforeUnmount(() => {
  ++revision
  stop?.()
})
</script>

<template>
  <div class="mermaid">
    <div v-if="svg" v-html="svg" />
    <template v-else>
      <p v-if="failed" role="status">図を表示できませんでした。図の定義を表示します。</p>
      <pre><code>{{ source }}</code></pre>
    </template>
  </div>
</template>

<style scoped>
.mermaid { overflow-x: auto; margin: 16px 0; }
.mermaid :deep(svg) { display: block; margin: auto; }
</style>
