# あいてる？

URLを送るだけで終わる日程調整アプリ。参加者は名前を入れて、空いている時間をなぞるだけ。登録・ログイン・アプリ不要。

設計メモは [docs/DESIGN.md](docs/DESIGN.md)。

## 使い方（ローカル）

```bash
npm install
npm run dev
```

http://localhost:3000 を開く。`DATABASE_URL` が未設定のときは PGlite（ファイル内 PostgreSQL、`./.pglite`）が自動で使われるので、DBの準備は不要。

## 本番（Vercel + PostgreSQL）

1. Supabase / Neon / Vercel Postgres などで PostgreSQL を用意し、接続URLを `DATABASE_URL` に設定
2. マイグレーションを適用

   ```bash
   DATABASE_URL=postgres://... npm run db:migrate
   ```

3. Vercel にデプロイ（環境変数 `DATABASE_URL` を設定）

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` / `npm start` | 本番ビルド / 起動 |
| `npm run lint` | ESLint |
| `npm run db:generate` | スキーマ変更から SQL マイグレーションを生成（`drizzle/`） |
| `npm run db:migrate` | `DATABASE_URL` の DB にマイグレーションを適用（Vercel ではビルド時に自動実行） |

## URL

| URL | 役割 |
| --- | --- |
| `/` | イベント作成 |
| `/e/:publicId` | 参加者ページ（共有URL） |
| `/manage/:adminToken` | 主催者ページ（作成直後に表示。ブックマーク推奨） |

## 技術構成

Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v4 / Drizzle ORM / PostgreSQL（開発時は PGlite）
