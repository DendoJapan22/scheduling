import { CreateEventForm } from "@/components/CreateEventForm";
import { MyEvents } from "@/components/MyEvents";

export default async function Home(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const deleted = sp.deleted === "1";
  return (
    <main className="pt-6 sm:pt-12">
      {deleted && (
        <p className="fade-in mb-4 rounded-xl bg-accent-soft px-4 py-2.5 text-sm text-accent-ink">
          イベントを削除しました
        </p>
      )}
      <div className="mb-6">
        <p className="text-sm font-semibold text-accent-ink">あいてる？</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight sm:text-4xl">
          URLを送るだけの
          <br />
          日程調整
        </h1>
        <p className="mt-2 text-sm text-muted">
          期間と時間帯を決めるだけ。参加者は名前を入れて、空いている時間をなぞるだけ。登録もアプリも不要です。
        </p>
      </div>
      <CreateEventForm />
      <MyEvents />
    </main>
  );
}
