# 公開・運用手順メモ

このファイルはサイト運用者向けのメモです(サイト本体には公開されません)。

## 構成

- 章の Markdown(`01-*.md`〜`16-*.md`, `README.md`)は GitHub 上でもそのまま読める形を維持
- サイト化は [VitePress](https://vitepress.dev/) で行う。GitHub 固有の数式記法(`` $`...`$ `` と ```` ```math ```` フェンス)は、ビルド時に `.vitepress/math.mjs` の処理で標準記法へ変換する(md ファイル自体は書き換えない)
- 数式は MathJax、図は Mermaid で描画

## ローカルでの確認

Node.jsは `.nvmrc` に指定したLTS版を使う。nvmを使う場合は、初回に `nvm install`、作業開始時に `nvm use` を実行する。対応外のNode.jsでは `.npmrc` の設定により依存インストールを停止する。

```sh
npm ci
npm test         # 数式・図の描画、アクセシビリティ、注入防止の回帰テスト
npm run dev      # http://localhost:5173 でプレビュー
npm run build    # 本番ビルド(.vitepress/dist に出力)
```

PRのCIも `.nvmrc` を読み、インストール・テスト・ビルドを確認する。CIはデプロイを行わない。Node.jsのメジャー版を変えるときは、`package.json` の対応範囲・型定義と `compose.yaml` のイメージもそろえる。

Node をローカルに入れたくない場合は Docker でも動かせる(Node のバージョン差異にも影響されない):

```sh
docker compose up             # 開発サーバ(http://localhost:5173)
docker compose run --rm build # 本番ビルド(.vitepress/dist に出力)
```

### 数式描画の依存関係

数式は `@mdit/plugin-mathjax` とMathJax 4でビルド時にSVGへ変換する。従来のTeXフォントと読み上げ用MathMLを維持し、ブラウザーでMathJaxやフォントCDNを読み込む必要はない。設定は `.vitepress/math.mjs` にある。

VitePress 1.xにはmarkdown-it 14.1が組み込まれており、プラグインはこの組み込みのmarkdown-itに登録される。プラグイン1.2系はmarkdown-it 15系を対応先として宣言しているが、省略可能な依存の宣言なのでインストール時には検査されない。組み合わせて使えるかは、下記の更新時の確認で判断する。

MathJax 4の公式依存経路から、修正版のxmldomを取り込む。解決済みバージョンは `package-lock.json`、XML注入を防ぐ回帰テストは `tests/math.test.mjs` で確認する。xmldomに `overrides` は不要。

旧 `markdown-it-mathjax3` / `mathjax-full` は使用しない。旧経路のspeech-rule-engine 4.1.4は脆弱なxmldom 0.9.10を固定しているため、戻すと問題が再発する。数式プラグインやVitePressを更新するときは `npm ci` と `npm test` を実行し、更新前後の全ページのビルド結果で、数式の出力(`mjx-container` 要素。SVGと読み上げ用MathMLを含む)が一致することを確かめる。

### Mermaidの描画

Mermaid 12は `.vitepress/mermaid.mjs` と `.vitepress/theme/MermaidDiagram.vue` から公式の `render` APIで描画する。古い `vitepress-plugin-mermaid` はMermaid 12と互換性がないため使用しない。本文のMermaidフェンスはGitHubで読める形を維持する。

従来の配置・見た目を維持するため、Dagre配置とclassic表示を明示する。描画はブラウザーで行い、ダークモード変更時に再描画する。Mermaidの設定は描画ごとに直列に適用し、HTMLやリンクの安全性はstrict設定で保つ。依存更新時は `npm test` とビルドに加え、フロー図・xychartの表示、画面遷移、テーマ切り替えをブラウザーで確認する。

### Viteのバージョン

VitePress 1.xが指定するVite 5系の開発サーバーとesbuildの脆弱性を避けるため、`package.json` の `overrides` でVite 6系を使う。Vite 6系はVitePress 1.xが指定する依存範囲の外にあるため、VitePressを更新するときはこの `overrides` が必要かを見直す。

## 1. 独自ドメイン + Cloudflare

1. [Cloudflare](https://dash.cloudflare.com/) にアカウント作成 → 「ドメイン登録」からドメインを取得(原価販売。.com で年約$11)
2. Cloudflare ダッシュボード → Workers & Pages → 作成 → Git に接続 で `shin4488/learning-transformer` を接続
3. ビルド設定:
   - ビルドコマンド: `npm run build`
   - デプロイコマンド: `npx wrangler deploy`(リポジトリの `wrangler.jsonc` が配信対象 `.vitepress/dist` を指定している)
   - Node.js: リポジトリの `.nvmrc` を使う。既存のビルド環境変数 `NODE_VERSION` がある場合は削除し、ファイルの指定にそろえる
4. Custom domains で取得したドメインを割り当てる(同じ Cloudflare アカウント内なので DNS は自動設定)
5. 以後、main へ push するたびに自動デプロイされる

各ページの最終更新日(本文・sitemap・JSON-LD)は、ファイルごとの git の最終コミット日時から作る。Cloudflare のビルドは浅いクローンで行われるため、`npm run build` は Workers Builds 上(環境変数 `WORKERS_CI` が設定される)でだけ全履歴を取得してからビルドする(`scripts/fetch-git-history.mjs`)。取得に失敗してもビルドは続くが、全ページの日付がビルド対象コミットの日時になる。

## 2. Google Analytics(GA4)

1. [Google Analytics](https://analytics.google.com/) でアカウントとプロパティを作成(プラットフォーム: ウェブ、サイトURLを入力)
2. 発行された **測定ID(G-XXXXXXXXXX)** を `.vitepress/config.mts` の `GA_ID` に設定して push
3. サイトを開き、GA のリアルタイムレポートに自分のアクセスが出れば設定完了

## 3. Google Search Console(SEO)

1. [Search Console](https://search.google.com/search-console) でプロパティを「ドメイン」で追加
2. 所有権は DNS の TXT レコードで確認する。Search Console に表示されるレコードを Cloudflare の DNS に追加する(Google Analytics 経由の確認は URL プレフィックスのプロパティでしか使えない)
3. 「サイトマップ」に `sitemap.xml` を送信する(`https://learning-transformer.com/sitemap.xml`)

## 4. Google AdSense

1. サイトを独自ドメインで公開し、ある程度アクセスできる状態にする
2. [AdSense](https://adsense.google.com/) でアカウントを開設し、サイト(独自ドメイン)を追加して審査を申請
   - 審査には数日〜数週間かかる。プライバシーポリシー(`privacy-policy.md`)は設置済み
3. 発行された **クライアントID(ca-pub-XXXXXXXXXXXXXXXX)** を `.vitepress/config.mts` の `ADSENSE_CLIENT` に設定して push
   - これで全ページの `<head>` に AdSense のタグが入る(自動広告)
   - 広告の量・位置は AdSense 管理画面の「自動広告」設定で調整する
4. AdSense 管理画面の指示に従い `ads.txt` を設置する:
   - `public/ads.txt` というファイルを作り、指示された1行(例: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`)を書いて push すると、サイト直下 `/ads.txt` で配信される

## 注意

- サイトのタイトル・説明文(検索結果に出る文言)は `.vitepress/config.mts` の `SITE_TITLE` / `SITE_DESCRIPTION` で変更できる。ページごとの説明文は `pageDescriptions` で指定する
