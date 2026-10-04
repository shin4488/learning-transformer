# 公開・運用手順メモ

このファイルはサイト運用者向けのメモです(サイト本体には公開されません)。

## 構成

- 章の Markdown(`01-*.md`〜`16-*.md`, `README.md`)は GitHub 上でもそのまま読める形を維持
- サイト化は [VitePress](https://vitepress.dev/) で行う。GitHub 固有の数式記法($`...`$ と ```math)は、ビルド時に `.vitepress/config.mts` 内のプラグインが標準記法へ変換する(md ファイル自体は書き換えない)
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

VitePress 1.xにはmarkdown-it 14.1が組み込まれているため、対応するプラグイン0.26系を使う。プラグイン1.0〜1.1系はmarkdown-it 14.2以上、1.2系は15系を要求するため、Node.jsだけを更新しても組み合わせの条件を満たせない。VitePress側が対応するまでは `.github/dependabot.yml` で1.x以降の更新を保留する。VitePress更新時には、この制限も見直す。

MathJax 4の公式依存経路から、修正版のxmldomを取り込む。解決済みバージョンは `package-lock.json`、XML注入を防ぐ回帰テストは `tests/math.test.mjs` で確認する。`overrides` は不要。

旧 `markdown-it-mathjax3` / `mathjax-full` は使用しない。旧経路のspeech-rule-engine 4.1.4は脆弱なxmldom 0.9.10を固定しているため、戻すと問題が再発する。数式プラグインを更新するときは `npm ci` と `npm test`、全ページのビルドを確認し、SVGの表示と読み上げ用MathMLも比較する。

### Mermaidの描画

Mermaid 12は `.vitepress/mermaid.mjs` と `.vitepress/theme/MermaidDiagram.vue` から公式の `render` APIで描画する。古い `vitepress-plugin-mermaid` はMermaid 12と互換性がないため使用しない。本文のMermaidフェンスはGitHubで読める形を維持する。

従来の配置・見た目を維持するため、Dagre配置とclassic表示を明示する。描画はブラウザーで行い、ダークモード変更時に再描画する。Mermaidの設定は描画ごとに直列に適用し、HTMLやリンクの安全性はstrict設定で保つ。依存更新時は `npm test` とビルドに加え、フロー図・xychartの表示、画面遷移、テーマ切り替えをブラウザーで確認する。

## 1. 独自ドメイン + Cloudflare Pages(本公開)

1. [Cloudflare](https://dash.cloudflare.com/) にアカウント作成 → 「ドメイン登録」からドメインを取得(原価販売。.com で年約$11)
2. Cloudflare ダッシュボード → Workers & Pages → 作成 → Git に接続 で `shin4488/learning-transformer` を接続
3. ビルド設定(新UI・デプロイコマンド欄がある場合):
   - ビルドコマンド: `npm run build`
   - デプロイコマンド: `npx wrangler deploy`(リポジトリの `wrangler.jsonc` が配信対象 `.vitepress/dist` を指定している)
   - Node.js: リポジトリの `.nvmrc` を使う。既存のビルド環境変数 `NODE_VERSION` がある場合は削除し、ファイルの指定にそろえる

   旧UI(Pages タブでデプロイコマンド欄がない場合):
   - Build command: `npm run build` / Build output directory: `.vitepress/dist` / 環境変数不要
4. Custom domains で取得したドメインを割り当てる(同じ Cloudflare アカウント内なので DNS は自動設定)
5. 以後、main へ push するたびに自動デプロイされる

各ページの最終更新日(本文・sitemap・JSON-LD)は、ファイルごとの git の最終コミット日時から作る。Cloudflare のビルドは浅いクローンで行われるため、`npm run build` は Workers Builds 上(環境変数 `WORKERS_CI` が設定される)でだけ全履歴を取得してからビルドする(`scripts/fetch-git-history.mjs`)。取得に失敗してもビルドは続くが、全ページの日付がビルド対象コミットの日時になる。

## 2. Google Analytics(GA4)

1. [Google Analytics](https://analytics.google.com/) でアカウントとプロパティを作成(プラットフォーム: ウェブ、サイトURLを入力)
2. 発行された **測定ID(G-XXXXXXXXXX)** を `.vitepress/config.mts` の `GA_ID` に設定して push
3. サイトを開き、GA のリアルタイムレポートに自分のアクセスが出れば設定完了

## 3. Google Search Console(SEO)

1. [Search Console](https://search.google.com/search-console) でプロパティを「ドメイン」で追加
2. 所有権確認は、GA4 設定済みなら「Google Analytics」経由で自動確認できる
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

- AdSense は `*.github.io` のような共有サブドメインでは審査に通らないため、広告は独自ドメイン公開後に有効化する
- サイトのタイトル・説明文(検索結果に出る文言)は `.vitepress/config.mts` の `title` / `description` で変更できる
