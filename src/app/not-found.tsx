import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl">🫥</p>
      <h1 className="mt-4 text-lg font-bold">このイベントは見つかりません</h1>
      <p className="mt-1 text-sm text-muted">
        URLが間違っているか、削除された可能性があります。
      </p>
      <Link href="/" className="btn btn-ghost mt-6">
        新しい日程調整をつくる
      </Link>
    </main>
  );
}
