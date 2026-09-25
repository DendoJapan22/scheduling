import type { EventPublic } from "@/lib/event-types";
import { formatDateJa, formatMD, formatMin, weekday } from "@/lib/time";

const SHOW_DAYS = 4;

export function EventHeader({ event }: { event: EventPublic }) {
  return (
    <header>
      <h1 className="text-2xl font-bold leading-tight break-words">
        {event.title}
      </h1>
      {event.days ? <DayList event={event} /> : <RangeLine event={event} />}
    </header>
  );
}

function RangeLine({ event }: { event: EventPublic }) {
  const sameYear = event.startDate.slice(0, 4) === event.endDate.slice(0, 4);
  return (
    <p className="mt-1.5 text-sm text-muted">
      {formatDateJa(event.startDate, true)}〜
      {formatDateJa(event.endDate, !sameYear)}
      <span className="mx-1.5 text-line-strong">|</span>
      <span className="tabular-nums">
        {formatMin(event.dailyStart)}〜{formatMin(event.dailyEnd)}
      </span>
    </p>
  );
}

function DayList({ event }: { event: EventPublic }) {
  const days = event.days ?? [];
  const shown = days.slice(0, SHOW_DAYS);
  const rest = days.length - shown.length;
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5 text-sm text-muted">
      {shown.map((d) => (
        <li
          key={d.date}
          className="rounded-full border border-line bg-surface px-2.5 py-0.5 tabular-nums"
        >
          {formatMD(d.date)}({weekday(d.date)}) {formatMin(d.start)}〜
          {formatMin(d.end)}
        </li>
      ))}
      {rest > 0 && <li className="px-1 py-0.5">ほか{rest}日</li>}
    </ul>
  );
}

/** metadata などで使う一行の説明 */
export function describeSchedule(event: EventPublic): string {
  if (!event.days) {
    return `${formatDateJa(event.startDate)}〜${formatDateJa(event.endDate)} ${formatMin(event.dailyStart)}〜${formatMin(event.dailyEnd)}`;
  }
  const parts = event.days
    .slice(0, 3)
    .map(
      (d) =>
        `${formatDateJa(d.date)} ${formatMin(d.start)}〜${formatMin(d.end)}`,
    );
  return (
    parts.join("、") +
    (event.days.length > 3 ? ` ほか${event.days.length - 3}日` : "")
  );
}
