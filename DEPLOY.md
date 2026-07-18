# 公開・運用手順メモ

このファイルはサイト運用者向けのメモです(サイト本体には公開されません)。

## 構成

- 章の Markdown(`01-*.md`〜`16-*.md`, `README.md`)は GitHub 上でもそのまま読める形を維持
- サイト化は [VitePress](https://vitepress.dev/) で行う。GitHub 固有の数式記法($`...`$ と ```math)は、ビルド時に `.vitepress/config.mts` 内のプラグインが標準記法へ変換する(md ファイル自体は書き換えない)
- 数式は MathJax、図は Mermaid で描画

## ローカルでの確認

```sh
npm install
npm run dev      # http://localhost:5173 でプレビュー
npm run build    # 本番ビルド(.vitepress/dist に出力)
```

Node をローカルに入れたくない場合は Docker でも動かせる(Node のバージョン差異にも影響されない):

```sh
docker compose up             # 開発サーバ(http://localhost:5173)
docker compose run --rm build # 本番ビルド(.vitepress/dist に出力)
```

## 1. GitHub Pages(プレビュー公開)

1. リポジトリの Settings → Pages → Build and deployment → Source を **GitHub Actions** にする
2. main に push すると `.github/workflows/deploy.yml` が動き、`https://shin4488.github.io/learning-transformer/` に公開される

## 2. 独自ドメイン + Cloudflare Pages(本公開)

1. [Cloudflare](https://dash.cloudflare.com/) にアカウント作成 → 「ドメイン登録」からドメインを取得(原価販売。.com で年約$11)
2. Cloudflare ダッシュボード → Workers & Pages → Create → Pages → **Connect to Git** で `shin4488/learning-transformer` を接続
3. ビルド設定:
   - Build command: `npm run build`
   - Build output directory: `.vitepress/dist`
   - 環境変数: 不要(独自ドメイン直下で公開するため `DOCS_BASE` は設定しない)
4. Custom domains で取得したドメインを割り当てる(同じ Cloudflare アカウント内なので DNS は自動設定)
5. 以後、main へ push するたびに自動デプロイされる

GitHub Pages 側を止めたい場合は Settings → Pages で無効化する(併存していても害はない)。

## 3. Google Analytics(GA4)

1. [Google Analytics](https://analytics.google.com/) でアカウントとプロパティを作成(プラットフォーム: ウェブ、サイトURLを入力)
2. 発行された **測定ID(G-XXXXXXXXXX)** を `.vitepress/config.mts` の `GA_ID` に設定して push
3. サイトを開き、GA のリアルタイムレポートに自分のアクセスが出れば設定完了

## 4. Google Search Console(SEO)

1. [Search Console](https://search.google.com/search-console) でプロパティを追加(独自ドメインなら「ドメイン」、GitHub Pages のうちは「URLプレフィックス」で登録)
2. 所有権確認は、GA4 設定済みなら「Google Analytics」経由で自動確認できる
3. 「サイトマップ」に `sitemap.xml` を送信する(例: `https://shin4488.github.io/learning-transformer/sitemap.xml`)

## 5. Google AdSense

1. サイトを独自ドメインで公開し、ある程度アクセスできる状態にする
2. [AdSense](https://adsense.google.com/) でアカウントを開設し、サイト(独自ドメイン)を追加して審査を申請
   - 審査には数日〜数週間かかる。プライバシーポリシー(`privacy-policy.md`)は設置済み
3. 発行された **クライアントID(ca-pub-XXXXXXXXXXXXXXXX)** を `.vitepress/config.mts` の `ADSENSE_CLIENT` に設定して push
   - これで全ページの `<head>` に AdSense のタグが入る(自動広告)
   - 広告の量・位置は AdSense 管理画面の「自動広告」設定で調整する
4. AdSense 管理画面の指示に従い `ads.txt` を設置する:
   - `public/ads.txt` というファイルを作り、指示された1行(例: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`)を書いて push すると、サイト直下 `/ads.txt` で配信される

## 注意

- AdSense は `*.github.io` のような共有サブドメインでは審査に通らないため、広告は独自ドメイン公開後に有効化する
- サイトのタイトル・説明文(検索結果に出る文言)は `.vitepress/config.mts` の `title` / `description` で変更できる
