import assert from 'node:assert/strict'
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
  // Vue marks fragments and empty components with comments, which are not page content.
  return { content: page.replace(/<!--[\s\S]*?-->/g, ''), diagrams }
}

test('passes a Mermaid fence to one diagram component without letting its source inject HTML or Vue syntax', async () => {
  const source = `graph TD\nA["<script>alert('x')</script> & {{ value }}"] --> B["日本語"]\n`
  const { content, diagrams } = await renderPage(md.render('```mermaid\n' + source + '```'))
  assert.deepEqual(diagrams, [{ source, attrs: {} }])
  assert.equal(content, '')
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
