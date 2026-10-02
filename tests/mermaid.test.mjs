import assert from 'node:assert/strict'
import test from 'node:test'
import { createMarkdownRenderer } from 'vitepress'
import { createMermaidRenderer, mermaidMarkdown } from '../.vitepress/mermaid.mjs'

const md = await createMarkdownRenderer(process.cwd(), { config: md => md.use(mermaidMarkdown) })

test('preserves diagram source without allowing Markdown to inject HTML or Vue attributes', () => {
  const source = `graph TD\nA["<script>alert('x')</script> & {{ value }}"] --> B["日本語"]\n`
  const html = md.render('```mermaid\n' + source + '```')
  assert.match(html, /^<MermaidDiagram graph="[^"<>']+" \/>\n$/)
  assert.equal(decodeURIComponent(html.match(/graph="([^"]+)"/)[1]), source)
})

test('supports the mmd alias and leaves ordinary fences unchanged', () => {
  assert.match(md.render('```mmd\ngraph TD\nA --> B\n```'), /<MermaidDiagram/)
  assert.doesNotMatch(md.render('```text\ngraph TD\nA --> B\n```'), /<MermaidDiagram/)
  assert.doesNotMatch(md.render('```text\n<x>\n```'), /<x>/)
})

test('serializes themes, uses distinct SVG ids, and keeps the security boundary strict', async () => {
  let activeTheme
  const calls = []
  const render = createMermaidRenderer(async () => ({ default: {
    initialize(config) {
      activeTheme = config.theme
      assert.equal(config.securityLevel, 'strict')
      assert.equal(config.startOnLoad, false)
    },
    async render(id, source) {
      await new Promise(resolve => setImmediate(resolve))
      calls.push({ id, source, theme: activeTheme })
      return { svg: `<svg>${source}</svg>` }
    },
  } }))
  const results = await Promise.all([render('light source', 'default'), render('dark source', 'dark')])
  assert.deepEqual(calls.map(({ source, theme }) => ({ source, theme })), [
    { source: 'light source', theme: 'default' }, { source: 'dark source', theme: 'dark' },
  ])
  assert.notEqual(calls[0].id, calls[1].id)
  assert.equal(results[1].svg, '<svg>dark source</svg>')
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
