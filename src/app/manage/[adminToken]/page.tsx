import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventHeader } from "@/components/EventHeader";
import { ManagePanel } from "@/components/ManagePanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { ShareBox } from "@/components/ShareBox";
import { findEventByAdminToken, loadResults, toPublic } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "管理ページ",
  robots: { index: false },
};

export default async function Page(props: PageProps<"/manage/[adminToken]">) {
  const { adminToken } = await props.params;
  const sp = await props.searchParams;
  const event = await findEventByAdminToken(adminToken);
  if (!event) notFound();
  const results = await loadResults(event);
  const pub = toPublic(event);
  const created = sp.created === "1";

  return (
    <main className="pt-2">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">
          主催者ページ
        </span>
        <Link
          href={`/e/${event.publicId}`}
          className="text-sm text-muted hover:text-ink"
        >
          参加者ページを開く →
        </Link>
      </div>
      <EventHeader event={pub} />

      <section className="card mt-5 p-5">
        <h2 className="text-base font-bold">
          {created
            ? "できました！このURLをみんなに送ってください"
            : "参加者に送るURL"}
        </h2>
        <p className="mt-0.5 mb-3 text-xs text-muted">
          受け取った人は名前を入れるだけで回答できます
        </p>
        <ShareBox path={`/e/${event.publicId}`} title={event.title} />
      </section>

      <div className="mt-8">
        <ResultsPanel event={pub} participants={results.participants} />
      </div>

      <ManagePanel adminToken={adminToken} event={pub} />
    </main>
  );
}
