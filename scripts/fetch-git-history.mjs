// 各ページの最終更新日(本文の「最終更新」・sitemap の lastmod・JSON-LD の dateModified)は、
// VitePress が git log で調べたファイルごとの最終コミット日時から作られる。
// Cloudflare Workers Builds はリポジトリを浅くクローンするため、そのままでは全ページが
// ビルド対象コミットの日時になる。Cloudflare のビルド(WORKERS_CI が設定される)で
// 浅いクローンのときだけ全履歴を取得する。ローカルと GitHub Actions の CI では何もしない。
// 取得できなくてもビルドは止めず、警告を出して続ける。
import { execFileSync } from 'node:child_process'

if (process.env.WORKERS_CI) {
  try {
    const shallow = execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    }).trim()
    if (shallow === 'true') {
      execFileSync('git', ['fetch', '--unshallow', '--quiet'], { stdio: 'inherit', timeout: 120_000 })
      console.log('git の全履歴を取得しました(最終更新日をファイルごとのコミット日時にするため)')
    }
  } catch (error) {
    console.warn(`警告: git の全履歴を取得できませんでした。最終更新日はビルド対象コミットの日時になります(${error.message})`)
  }
}
