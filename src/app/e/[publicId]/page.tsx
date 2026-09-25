import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { describeSchedule } from "@/components/EventHeader";
import { EventPage } from "@/components/EventPage";
import { findEventByPublicId, loadResults, toPublic } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/e/[publicId]">,
): Promise<Metadata> {
  const { publicId } = await props.params;
  const event = await findEventByPublicId(publicId);
  if (!event) return { title: "イベントが見つかりません" };
  return {
    title: event.title,
    description: `${describeSchedule(toPublic(event))} の空いている時間を教えてください`,
    robots: { index: false },
  };
}

export default async function Page(props: PageProps<"/e/[publicId]">) {
  const { publicId } = await props.params;
  const event = await findEventByPublicId(publicId);
  if (!event) notFound();
  const results = await loadResults(event);
  return (
    <EventPage
      event={toPublic(event)}
      initialParticipants={results.participants}
    />
  );
}
