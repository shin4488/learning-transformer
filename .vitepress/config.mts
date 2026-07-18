import { defineConfig, type HeadConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import mathjax3 from 'markdown-it-mathjax3'

const SITE_TITLE = 'ゼロから理解するTransformer'
const SITE_DESCRIPTION =
  '予備知識なしで読める、ChatGPTなどのLLMの中核技術Transformerの解説書。数学の準備からAttention、RLHF、効率化技術まで。'

// 公開URL(末尾スラッシュなし)
const SITE_URL = 'https://learning-transformer.com'

// Google AdSense のクライアントID(例: 'ca-pub-1234567890123456')。
// AdSense アカウント開設後にここへ設定すると、全ページに広告・審査用のタグが入る。
const ADSENSE_CLIENT = ''

// Google Analytics(GA4)の測定ID
const GA_ID = 'G-9VXNS22KZ1'

// GitHub Pages(プロジェクトサイト)では DOCS_BASE=/learning-transformer/ を、
// 独自ドメイン・Cloudflare Pages ではベースパスなし(既定)を使う。
const base = process.env.DOCS_BASE || '/'

// 各ページの meta description(検索結果・SNSカードに表示される要約)
const pageDescriptions: Record<string, string> = {
  'index.md': SITE_DESCRIPTION,
  'README.md': SITE_DESCRIPTION,
  '01-functions-and-symbols.md':
    '関数・指数・対数・Σ記法など、Transformer理解に必要な数学記号の読み方を、文系高校数学レベルから丁寧に解説します。',
  '02-vectors-and-matrices.md':
    'ベクトルと行列をゼロから解説。Attentionを理解する鍵になる「内積 = 類似度」という考え方を、手計算と図で身につけます。',
  '03-derivatives-gradients-probability.md':
    '微分・勾配・連鎖律・確率分布を直感的に解説。機械学習の「学習」を支える数学をここで準備します。',
  '04-machine-learning-basics.md':
    '損失関数と勾配降下法を実際に手計算しながら、「データから学ぶ」機械学習の仕組みを一次関数の例で理解します。',
  '05-neural-networks.md':
    '人工ニューロン・活性化関数・softmax・交差エントロピー・逆伝播まで、ニューラルネットワークの仕組みをゼロから解説します。',
  '06-words-to-numbers.md':
    'トークン化(BPE)と埋め込みベクトルの仕組みを解説。言葉をニューラルネットワークが扱える「数の並び」に変える方法が分かります。',
  '07-before-transformer.md':
    '言語モデルとは何か。n-gram・RNN・LSTM・seq2seqの発展と限界をたどり、Attentionが生まれるまでの流れを解説します。',
  '08-attention.md':
    'Transformerの中核であるAttentionを完全解説。Q/K/V・スケーリング・Multi-Head・因果マスクまで、すべて手計算で追えます。',
  '09-transformer-architecture.md':
    '位置エンコーディング・残差接続・LayerNorm・FFN。部品を組み上げて、Transformer全体のアーキテクチャを理解します。',
  '10-training.md':
    '自己教師あり学習と次単語予測。Transformerが大量のテキストからどのように言葉を学ぶのか、訓練の仕組みを解説します。',
  '11-bert-gpt-t5.md':
    'BERT・GPT・T5という3つの系譜の違いと使い分け、そして現代のLLMがデコーダのみ構成になった理由を解説します。',
  '12-from-llm-to-chat-ai.md':
    '事前学習済みLLMが対話AIになるまで。指示チューニング(SFT)とRLHF(人間のフィードバックによる強化学習)の仕組みを解説します。',
  '13-scaling-laws.md':
    'スケーリング則とChinchilla、創発的能力。「AIはなぜ急に賢くなったのか」を、規模と性能の法則から読み解きます。',
  '14-text-generation.md':
    '温度・top-k・top-pなどのサンプリング手法と自己回帰生成ループ。LLMが1トークンずつ文章を作る仕組みを解説します。',
  '15-efficiency.md':
    'KVキャッシュ・FlashAttention・量子化・LoRA・MoEなど、巨大なLLMを実用的な速度とコストで動かす効率化技術を解説します。',
  '16-conclusion-and-next-steps.md':
    '全16章の総まとめ。1枚で振り返るTransformer、よくある質問、用語集、この先の学習ロードマップを収録しています。',
  'privacy-policy.md':
    '当サイトのプライバシーポリシーと免責事項。広告配信・アクセス解析における Cookie の取り扱いについて説明します。',
}

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
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  base,
  cleanUrls: true,
  sitemap: { hostname: `${SITE_URL}/` },
  srcExclude: ['DEPLOY.md', 'CLAUDE.md'],
  rewrites: {
    'README.md': 'index.md',
  },
  head: [
    ['meta', { name: 'theme-color', content: '#f0b429' }],
    ...(GA_ID
      ? ([
          ['script', { async: '', src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}` }],
          ['script', {}, `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`],
        ] as HeadConfig[])
      : []),
    ...(ADSENSE_CLIENT
      ? ([
          ['script', {
            async: '',
            src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`,
            crossorigin: 'anonymous',
          }],
        ] as HeadConfig[])
      : []),
  ],
  transformPageData(pageData) {
    const rel = pageData.relativePath
    const description = pageDescriptions[rel] ?? SITE_DESCRIPTION
    pageData.description = description

    const cleanPath = rel.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')
    const url = cleanPath ? `${SITE_URL}/${cleanPath}` : `${SITE_URL}/`
    const title = pageData.title ? `${pageData.title} | ${SITE_TITLE}` : SITE_TITLE

    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:site_name', content: SITE_TITLE }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:type', content: cleanPath ? 'article' : 'website' }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:locale', content: 'ja_JP' }],
      ['meta', { name: 'twitter:card', content: 'summary' }],
    )
  },
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
