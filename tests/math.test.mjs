import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import { createMarkdownRenderer } from 'vitepress'
import {
  mathjax, mathjaxInstance, mathjaxStyle, normalizeGithubMath,
} from '../.vitepress/math.mjs'

const md = await createMarkdownRenderer(process.cwd(), {
  config: (renderer) => renderer.use(mathjax, mathjaxInstance),
})
const render = (source) => md.render(normalizeGithubMath(source))

for (const [name, source, expectedMathml, display] of [
  ['inline function', '関数 $f(x)$ を考える', ['<mi', '>f</mi>', '>x</mi>'], false],
  ['GitHub protected subscripts', '$`a_x + b_x`$', ['<msub', '>a</mi>', '>b</mi>'], false],
  ['fraction and square root', '$$\n\\frac{1}{\\sqrt{d_k}}\n$$', ['<mfrac', '<msqrt', '<msub'], true],
  ['matrix row separators', '```math\n\\begin{pmatrix}1 & 2 \\\\ 3 & 4\\end{pmatrix}\n```', ['<mtable', '>1</mn>', '>4</mn>'], true],
  ['gradient with display fractions', '$$\n\\nabla f = \\begin{pmatrix}\\dfrac{\\partial f}{\\partial x} \\\\ \\dfrac{\\partial f}{\\partial y}\\end{pmatrix}\n$$', ['<mtable', '<mfrac', '>∇</mi>'], true],
  ['summation limits', '$$\n\\sum_{i=1}^{n} x_i\n$$', ['<munderover', '>∑</mo>', '>n</mi>'], true],
  ['negative exponent', '$2^{-1}$', ['<msup', '>−</mo>', '>1</mn>'], false],
  ['attention equation', '$`\\mathrm{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)V`$', ['<mfrac', '<msqrt', '>softmax</mi>', '>⊤</mi>'], false],
]) {
  test(`renders ${name} as SVG with accessible MathML`, () => {
    const html = render(source)
    assert.equal((html.match(/<mjx-container\b/g) ?? []).length, 1)
    assert.match(html, /<svg\b/)
    assert.match(html, /<mjx-assistive-mml\b/)
    assert.match(html, /<math\b/)
    assert.doesNotMatch(html, /<merror\b|data-mjx-error=/)
    assert.equal(/<mjx-container\b[^>]*display="true"/.test(html), display)
    for (const fragment of expectedMathml) assert.ok(html.includes(fragment), fragment)
  })
}

for (const [name, source] of [
  ['escaped dollar', '\\$5'],
  ['currency followed by a number', '$5 and $10'],
  ['unclosed delimiter', 'price $5'],
  ['inline code', '`$x$`'],
  ['ordinary code fence', '```text\n$x$\n```'],
]) {
  test(`keeps ${name} as text`, () => {
    assert.doesNotMatch(render(source), /<mjx-container\b/)
  })
}

test('ships the assistive MathML and SVG layout styles without a font CDN', () => {
  assert.match(mathjaxStyle, /mjx-assistive-mml/)
  assert.match(mathjaxStyle, /mjx-container/)
  assert.doesNotMatch(mathjaxStyle, /https?:\/\//)
})

// Exercise the actual XML parser reached through MathJax's upstream dependency
// chain. A vulnerable EntityReference must fail before it can inject markup.
const fromMathjax = createRequire(import.meta.resolve('@mathjax/src/package.json'))
const fromSpeech = createRequire(fromMathjax.resolve('speech-rule-engine/package.json'))
const { DOMImplementation, XMLSerializer } = fromSpeech('@xmldom/xmldom')

test('rejects injected XML entity names while preserving valid entity references', () => {
  const document = new DOMImplementation().createDocument(null, 'root', null)
  const serializer = new XMLSerializer()
  assert.throws(() => document.createEntityReference('safe; <injected/> &x'))
  const valid = document.createEntityReference('valid')
  assert.equal(serializer.serializeToString(valid, { requireWellFormed: true }), '&valid;')
  valid.nodeName = 'safe; <injected/> &x'
  assert.throws(() => serializer.serializeToString(valid, { requireWellFormed: true }))
})
