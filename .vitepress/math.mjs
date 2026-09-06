import { createMathjaxInstance, mathjax } from '@mdit/plugin-mathjax'
import { MathJaxTexFont } from '@mathjax/mathjax-tex-font/js/svg.js'

// Keep the source readable on GitHub while handing ordinary dollar-delimited
// TeX to the Markdown renderer. The chapter files themselves stay unchanged.
export function normalizeGithubMath(code) {
  let out = code.replace(/\$`([^`\n]+?)`\$/g, (_, expr) => `$${expr}$`)
  out = out.replace(/^([ \t]*)```math\s*\n([\s\S]*?)^[ \t]*```[ \t]*$/gm,
    (_, indent, body) => `${indent}$$\n${body}${indent}$$`)
  return out
}

// VitePress 1.x bundles markdown-it 14.1; the plugin's 0.26 line supports it.
// Revisit the Dependabot constraint when the bundled parser changes.
// MathJax 4 resolves patched xmldom through its own dependencies.
export const mathjaxInstance = await createMathjaxInstance({
  output: 'svg',
  a11y: true,
  tex: {
    // Keep the TeX extensions previously enabled by MathJax 3's AllPackages.
    packages: [
      'base', 'action', 'ams', 'amscd', 'bbox', 'boldsymbol', 'braket',
      'bussproofs', 'cancel', 'cases', 'centernot', 'color', 'colortbl',
      'empheq', 'enclose', 'extpfeil', 'gensymb', 'html', 'mathtools',
      'mhchem', 'newcommand', 'noerrors', 'noundefined', 'upgreek',
      'unicode', 'verb', 'configmacros', 'tagformat', 'textcomp', 'textmacros',
    ],
  },
  svg: {
    // Preserve the TeX font family and self-contained SVG output.
    fontData: MathJaxTexFont,
    fontCache: 'none',
    displayOverflow: 'overflow',
    linebreaks: { inline: false },
  },
})

// SVG needs only the common layout and assistive-MathML styles. Keep these
// in every page's head, including pages reached through client navigation.
export const mathjaxStyle = await mathjaxInstance.outputStyle()
export { mathjax }
