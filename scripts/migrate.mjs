// 本番DBにマイグレーションを適用する（Vercel のビルド時に実行）。
// drizzle-kit migrate は失敗理由を出さないことがあるため、エラーを必ず表示する自前スクリプトにしている。
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

// マイグレーションはプーラーを通さない直結URLを優先する（Neon / Supabase 連携の変数名にも対応）
const candidates = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING", "DATABASE_URL", "POSTGRES_URL"];
const name = candidates.find((k) => process.env[k]);

if (!name) {
  console.error(
    [
      "",
      "✖ データベースの接続URLが見つかりません。",
      "  Vercel の Storage タブで Neon（または Supabase）をこのプロジェクトに接続するか、",
      "  環境変数 DATABASE_URL を設定してから再デプロイしてください。",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

console.log(`Applying migrations using ${name} ...`);
const pool = new pg.Pool({ connectionString: process.env[name], max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  console.log("✓ Migrations applied");
} catch (err) {
  console.error("✖ Migration failed:");
  console.error(err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
