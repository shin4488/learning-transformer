// Keep authored diagrams usable on GitHub; only the site's fence renderer changes.
export function mermaidMarkdown(md) {
  const fallback = md.renderer.rules.fence
  md.renderer.rules.fence = (tokens, index, options, env, self) => {
    const token = tokens[index]
    if (!['mermaid', 'mmd'].includes(token.info.trim())) {
      return fallback(tokens, index, options, env, self)
    }
    const graph = encodeURIComponent(token.content).replace(/'/g, '%27')
    return `<MermaidDiagram graph="${graph}" />\n`
  }
}

// Mermaid configuration is global. Serialize initialization and rendering so
// concurrent diagrams and theme changes cannot borrow each other's settings.
export function createMermaidRenderer(load = () => import('mermaid')) {
  let queue = Promise.resolve()
  let nextId = 0
  return (graph, theme) => {
    const pending = queue.then(async () => {
      const { default: mermaid } = await load()
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        suppressErrorRendering: true,
        layout: 'dagre',
        look: 'classic',
        theme,
      })
      return mermaid.render(`book-diagram-${++nextId}`, graph)
    })
    queue = pending.catch(() => {})
    return pending
  }
}

export const renderMermaid = createMermaidRenderer()
