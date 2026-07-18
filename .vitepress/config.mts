import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import mathjax3 from 'markdown-it-mathjax3'

// Google AdSense のクライアントID(例: 'ca-pub-1234567890123456')。
// AdSense アカウント開設後にここへ設定すると、全ページに自動広告のタグが入る。
const ADSENSE_CLIENT = ''

// GitHub Pages(プロジェクトサイト)では DOCS_BASE=/learning-transformer/ を、
// 独自ドメイン・Cloudflare Pages ではベースパスなし(既定)を使う。
const base = process.env.DOCS_BASE || '/'

// GitHub 固有の数式記法を、VitePress(markdown-it-mathjax3)が読める形に直す。
// 章の md ファイル自体は GitHub でもそのまま読めるよう変更しない。
//   - インライン数式  $`...`$  →  $...$
//   - ブロック数式    ```math ... ```  →  $$ ... $$
function githubMathToStandard() {
  return {
    name: 'github-math-to-standard',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.endsWith('.md')) return null
      let out = code.replace(/\$`([^`\n]+?)`\$/g, (_, expr) => `$${expr}$`)
      out = out.replace(/^([ \t]*)```math\s*\n([\s\S]*?)^[ \t]*```[ \t]*$/gm,
        (_, indent, body) => `${indent}$$\n${body}${indent}$$`)
      return out === code ? null : out
    },
  }
}

// MathJax が出力するタグを Vue コンポーネントと誤認しないための登録(VitePress 公式ドキュメントの設定)
const mathjaxCustomElements = [
  'mjx-container', 'mjx-assistive-mml',
  'math', 'maction', 'maligngroup', 'malignmark', 'menclose', 'merror',
  'mfenced', 'mfrac', 'mi', 'mlongdiv', 'mmultiscripts', 'mn', 'mo',
  'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mscarries',
  'mscarry', 'msgroup', 'mstack', 'mspace', 'msqrt', 'msrow', 'mstyle',
  'msub', 'msup', 'msubsup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder',
  'munderover', 'semantics', 'annotation', 'annotation-xml',
]

const chapters = {
  basics: [
    { text: '第1章 関数と記号に慣れる', link: '/01-functions-and-symbols' },
    { text: '第2章 ベクトルと行列', link: '/02-vectors-and-matrices' },
    { text: '第3章 微分・勾配・確率', link: '/03-derivatives-gradients-probability' },
    { text: '第4章 機械学習入門', link: '/04-machine-learning-basics' },
    { text: '第5章 ニューラルネットワーク', link: '/05-neural-networks' },
  ],
  intro: [
    { text: '第6章 言葉を数にする', link: '/06-words-to-numbers' },
    { text: '第7章 Transformer前夜', link: '/07-before-transformer' },
    { text: '第8章 Attention徹底解説', link: '/08-attention' },
    { text: '第9章 Transformerの全体像', link: '/09-transformer-architecture' },
  ],
  advanced: [
    { text: '第10章 Transformerを訓練する', link: '/10-training' },
    { text: '第11章 BERT・GPT・T5', link: '/11-bert-gpt-t5' },
    { text: '第12章 LLMから対話AIへ', link: '/12-from-llm-to-chat-ai' },
    { text: '第13章 スケーリング則と創発', link: '/13-scaling-laws' },
    { text: '第14章 文章を生成する仕組み', link: '/14-text-generation' },
    { text: '第15章 高速化・効率化の技術', link: '/15-efficiency' },
    { text: '第16章 まとめと次の一歩', link: '/16-conclusion-and-next-steps' },
  ],
}

export default withMermaid(defineConfig({
  lang: 'ja-JP',
  title: 'ゼロから理解するTransformer',
  description: '予備知識なしで読める、ChatGPTなどのLLMの中核技術Transformerの解説書。数学の準備からAttention、RLHF、効率化技術まで。',
  base,
  srcExclude: ['DEPLOY.md'],
  rewrites: {
    'README.md': 'index.md',
  },
  head: [
    ['meta', { name: 'theme-color', content: '#f0b429' }],
    ...(ADSENSE_CLIENT
      ? [[
          'script',
          {
            async: '',
            src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`,
            crossorigin: 'anonymous',
          },
        ] as ['script', Record<string, string>]]
      : []),
  ],
  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
      { text: '第1章から読む', link: '/01-functions-and-symbols' },
      { text: 'プライバシーポリシー', link: '/privacy-policy' },
    ],
    sidebar: [
      { text: 'はじめに', items: [{ text: '本書について', link: '/' }] },
      { text: '第I部 基礎編', items: chapters.basics },
      { text: '第II部 入門編', items: chapters.intro },
      { text: '第III部 応用編', items: chapters.advanced },
      { text: 'サイト情報', items: [{ text: 'プライバシーポリシー', link: '/privacy-policy' }] },
    ],
    outline: { level: [2, 3], label: 'このページの目次' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/shin4488/learning-transformer' },
    ],
    docFooter: { prev: '前の章', next: '次の章' },
    darkModeSwitchLabel: 'テーマ',
    sidebarMenuLabel: '目次',
    returnToTopLabel: 'ページ上部へ',
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '検索', buttonAriaLabel: '検索' },
          modal: {
            noResultsText: '見つかりませんでした',
            resetButtonTitle: 'クリア',
            footer: { selectText: '選択', navigateText: '移動', closeText: '閉じる' },
          },
        },
      },
    },
  },
  markdown: {
    config: (md) => {
      md.use(mathjax3)
    },
  },
  vite: {
    plugins: [githubMathToStandard()],
  },
  vue: {
    template: {
      compilerOptions: {
        isCustomElement: (tag) => mathjaxCustomElements.includes(tag),
      },
    },
  },
  mermaid: {},
}))
