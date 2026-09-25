# あいてる？ — 設計メモ

「URLを開いた参加者が、迷わず数秒で予定入力を始められる」ことを最優先にした日程調整アプリ。

## 1. 要件整理（MVP）

| 役割 | できること |
| --- | --- |
| 主催者 | イベント作成（名前・期間・時間帯・時間単位・予定の長さ）／共有URL取得／内容変更／削除／集計確認 |
| 参加者 | 名前入力 → グリッドで空き時間を選ぶ → 自動保存。同じブラウザなら後から編集可 |
| 全員 | ヒートマップ集計と「集まりやすい時間」ランキングを見る |

要求しないもの: ログイン・登録・メール・アプリ・○△×。保持する個人情報は「名前」のみ。

## 2. ページ構成

| URL | 役割 | 備考 |
| --- | --- | --- |
| `/` | トップ = イベント作成フォーム | 1画面で完結。作成後は管理ページへ |
| `/e/:publicId` | 参加者ページ | 「自分の予定」「みんなの予定」の2タブ。ページ遷移なし |
| `/manage/:adminToken` | 主催者ページ | 共有URL・編集フォーム・集計・削除 |
| `/api/...` | 参加者登録・自動保存・集計取得 | JSON。管理系はServer Action |

## 3. ユーザーフロー

主催者: `/` でフォーム入力 → 作成 → `/manage/:adminToken` に遷移し、参加者用URLが最上部に表示（コピー／共有ボタン）。

参加者: URLを開く → 名前を入力して「予定を入力する」 → 同じ画面がグリッドに切り替わる → タップ／なぞって選択 → 600ms後に自動保存（「保存済み」表示）。
`localStorage` に `{participantId, editToken, name}` を保存し、再訪時は名前入力をスキップして自分の予定を復元する。

## 4. DB設計（PostgreSQL / Drizzle）

```
events
  id            uuid PK
  public_id     text UNIQUE   (10文字, 参加者URL)
  admin_token   text UNIQUE   (32文字, 管理URL)
  title         text
  start_date    date
  end_date      date
  daily_start   int  (0:00からの分。例 17:00 = 1020)
  daily_end     int
  slot_minutes  int  (30 | 60)
  desired_minutes int (予定の長さ。ランキング用)
  days          jsonb NULL  (日にち指定モードのみ。[{date, start, end}])
  created_at / updated_at

participants
  id          uuid PK
  event_id    uuid FK -> events (cascade)
  name        text
  edit_token  text UNIQUE (32文字。このブラウザの回答を編集する鍵)
  created_at / updated_at

availability_slots
  id             uuid PK
  participant_id uuid FK -> participants (cascade)
  event_id       uuid FK -> events (cascade)
  date           date
  start_min      int
  end_min        int
  UNIQUE(participant_id, date, start_min)
```

- 日程の決め方は2通り。「期間で指定」は start_date〜end_date の毎日同じ時間帯。
  「日にち指定」は days に日ごとの時間帯を持ち、start_date 等には最小〜最大を入れる。
  アプリ内では `src/lib/days.ts` の eventDays() で両方を「日ごとの時間帯の配列」に揃えて扱う。
  グリッドの行は全日の時間帯を合わせた範囲で、その日の時間外のセルは斜線で無効表示。
- 時刻はタイムゾーン変換を避けるため「日付文字列 + 0:00からの分」で保持する。
- 保存は「参加者の全スロットを置き換える」1トランザクション。行数は最大でも 31日×48枠。
- 主催者が期間・時間帯を変更した場合、グリッド外の回答は表示から除外される（削除はしない）。

## 5. コンポーネント設計

```
app/page.tsx                 CreateEventForm (Server Action)
app/e/[publicId]/page.tsx    EventPage (client)
  ├ EventHeader              タイトル・期間・時間帯
  ├ Tabs                     自分の予定 / みんなの予定
  ├ NameEntry                名前入力 → 参加者作成
  ├ AvailabilityGrid         ★入力グリッド（矩形選択・自動保存）
  │   └ SaveStatus           保存中 / 保存済み
  └ ResultsPanel
      ├ BestTimes            集まりやすい時間 TOP3
      ├ HeatmapGrid          人数ヒートマップ（タップで内訳）
      └ ParticipantList      参加者一覧（タップでハイライト）
app/manage/[adminToken]/page.tsx
  ├ ShareBox                 URLコピー・共有
  ├ EventEditForm            Server Action で更新
  ├ ResultsPanel             (共通)
  └ DeleteEventButton
components/GridFrame         両グリッド共通の sticky ヘッダー／時間列レイアウト
```

## 6. 技術構成

- Next.js 16 (App Router) / React 19 / TypeScript / Tailwind CSS v4
- Drizzle ORM + PostgreSQL
  - 本番: `DATABASE_URL`（Supabase / Neon / Vercel Postgres）
  - 開発: `DATABASE_URL` 未設定なら PGlite（ファイル内Postgres）を自動起動。セットアップ不要
  - Prisma ではなく Drizzle にした理由: ローカルにPostgresが無くても同じスキーマで動く PGlite ドライバが公式にあるため
- ID: `nanoid` customAlphabet（紛らわしい文字を除外）。publicId 10文字、adminToken / editToken 32文字
- バリデーション: zod。レート制限: インメモリ（IP単位、MVP十分）

## 7. 実装順序

1. DBスキーマ・マイグレーション・接続（PGlite/pg切替）
2. 時刻ユーティリティ・ベスト時間算出ロジック
3. イベント作成（トップ）→ 管理ページ（共有URL表示）
4. 参加者ページ: 名前入力 → 入力グリッド → 自動保存
5. 集計: ヒートマップ・ベスト時間・参加者一覧
6. 管理: 編集・削除
7. 仕上げ: モバイル検証、レート制限、メタ情報
