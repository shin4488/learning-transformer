import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'
import { createMarkdownRenderer } from 'vitepress'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMermaidRenderer, mermaidMarkdown } from '../.vitepress/mermaid.mjs'

const otherFences = [
  ['text fence containing a diagram', '```text\ngraph TD\nA --> B\n```'],
  ['text fence containing HTML', '```text\n<x>\n```'],
]
// VitePress keeps one renderer per process, so record its output before the Mermaid plugin is added.
const withoutMermaid = new Map()
const md = await createMarkdownRenderer(process.cwd(), {
  config: (renderer) => {
    for (const [, fence] of otherFences) withoutMermaid.set(fence, renderer.render(fence))
    renderer.use(mermaidMarkdown)
  },
})

// VitePress compiles each page's HTML as a Vue template.
// Render it with a stand-in MermaidDiagram that records what the real component would receive.
async function renderPage(html) {
  const diagrams = []
  const MermaidDiagram = {
    props: { graph: { type: String, required: true } },
    inheritAttrs: false,
    setup(props, { attrs }) {
      // The diagram component reads its source with decodeURIComponent.
      diagrams.push({ source: decodeURIComponent(props.graph), attrs: { ...attrs } })
      return () => null
    },
  }
  const page = await renderToString(createSSRApp({ template: html, components: { MermaidDiagram } }))
  return { page, diagrams }
}

test('passes a Mermaid fence to one diagram component without letting its source inject HTML or Vue syntax', async () => {
  const source = `graph TD\nA["<script>alert('x')</script> & {{ value }}"] --> B["日本語"]\n`
  const { page, diagrams } = await renderPage(md.render('```mermaid\n' + source + '```'))
  assert.deepEqual(diagrams, [{ source, attrs: {} }])
  // Vue marks fragments and empty components with comments, which are not page content.
  assert.match(page, /^(?:<!--[^<>]*-->)*$/)
})

test('treats an mmd fence the same as a mermaid fence', () => {
  const source = 'graph TD\nA --> B\n'
  assert.equal(md.render('```mmd\n' + source + '```'), md.render('```mermaid\n' + source + '```'))
})

for (const [name, fence] of otherFences) {
  test(`renders a ${name} the same as without Mermaid support`, () => {
    assert.equal(md.render(fence), withoutMermaid.get(fence))
  })
}

// Like the real library, initialize() replaces one global configuration that render() reads.
// render() yields before reading it, so renders that are not serialized see a later call's configuration.
function fakeMermaid() {
  let config
  const renders = []
  const mermaid = {
    initialize(next) { config = next },
    async render(id, source) {
      await new Promise(resolve => setImmediate(resolve))
      renders.push({ id, source, config })
      return { svg: `<svg>${source}</svg>` }
    },
  }
  return { load: async () => ({ default: mermaid }), renders }
}

test('renders overlapping diagrams with the theme each one requested and returns each SVG to its caller', async () => {
  const { load, renders } = fakeMermaid()
  const render = createMermaidRenderer(load)
  const results = await Promise.all([render('light source', 'default'), render('dark source', 'dark')])
  assert.deepEqual(results.map(({ svg }) => svg), ['<svg>light source</svg>', '<svg>dark source</svg>'])
  assert.deepEqual(
    Object.fromEntries(renders.map(({ source, config }) => [source, config.theme])),
    { 'light source': 'default', 'dark source': 'dark' },
  )
})

// Mermaid scopes the styles inside each SVG to its id.
test('gives each diagram on a page a distinct SVG id', async () => {
  const { load, renders } = fakeMermaid()
  const render = createMermaidRenderer(load)
  await Promise.all([render('first', 'default'), render('second', 'default')])
  assert.equal(new Set(renders.map(({ id }) => id)).size, 2)
})

test('initializes Mermaid with the strict security level and without automatic rendering on page load', async () => {
  const { load, renders } = fakeMermaid()
  await createMermaidRenderer(load)('graph TD\nA --> B\n', 'default')
  assert.equal(renders[0].config.securityLevel, 'strict')
  assert.equal(renders[0].config.startOnLoad, false)
})

test('a malformed diagram does not prevent subsequent diagrams from rendering', async () => {
  const render = createMermaidRenderer(async () => ({ default: {
    initialize() {},
    async render(id, source) {
      if (source === 'invalid') throw new Error('Parse error')
      return { svg: '<svg>valid</svg>' }
    },
  } }))
  const invalid = render('invalid', 'default')
  const valid = render('valid', 'default')
  await assert.rejects(invalid, /Parse error/)
  assert.equal((await valid).svg, '<svg>valid</svg>')
})

// The most series any xychart in the book draws, counted from the chapter sources.
async function seriesPerChart() {
  const chapters = (await readdir(process.cwd())).filter(name => /^\d{2}-.*\.md$/.test(name))
  let most = 0
  for (const chapter of chapters) {
    const source = await readFile(chapter, 'utf8')
    for (const [, chart] of source.matchAll(/```mermaid\nxychart-beta\n([\s\S]*?)```/g)) {
      most = Math.max(most, chart.match(/^\s*(?:line|bar)\b/gm)?.length ?? 0)
    }
  }
  return most
}

// WCAG relative luminance and contrast ratio. Graphical objects need 3:1 against adjacent colors (WCAG 2.1, 1.4.11).
function contrast(a, b) {
  const luminance = (color) => {
    const hex = { white: 'ffffff' }[color] ?? color.replace('#', '')
    const full = hex.length === 3 ? [...hex].map(c => c + c).join('') : hex
    const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255)
      .map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

test('draws every series of the book\'s xy charts in a color that stands out from the chart background in both themes', async () => {
  const series = await seriesPerChart()
  assert.ok(series >= 1)
  // Read the colors the real Mermaid resolves for each render. Drawing itself needs a browser, so it is skipped.
  const { default: mermaid } = await import('mermaid')
  const render = createMermaidRenderer(async () => ({ default: {
    initialize: (config) => mermaid.initialize(config),
    async render() { return mermaid.mermaidAPI.getConfig().themeVariables.xyChart },
  } }))
  // Ending with the light theme again covers a theme change after a dark render.
  for (const theme of ['default', 'dark', 'default']) {
    const { backgroundColor, plotColorPalette } = await render('xychart-beta', theme)
    for (const color of plotColorPalette.split(',').slice(0, series)) {
      assert.ok(contrast(color, backgroundColor) >= 3, `${theme}: ${color} on ${backgroundColor}`)
    }
  }
})
