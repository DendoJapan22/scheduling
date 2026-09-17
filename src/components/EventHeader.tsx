import type { EventPublic } from "@/lib/event-types";
import { formatDateJa, formatMin } from "@/lib/time";

export function EventHeader({ event }: { event: EventPublic }) {
  const sameYear = event.startDate.slice(0, 4) === event.endDate.slice(0, 4);
  return (
    <header>
      <h1 className="text-2xl font-bold leading-tight break-words">
        {event.title}
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        {formatDateJa(event.startDate, true)}〜
        {formatDateJa(event.endDate, !sameYear)}
        <span className="mx-1.5 text-line-strong">|</span>
        <span className="tabular-nums">
          {formatMin(event.dailyStart)}〜{formatMin(event.dailyEnd)}
        </span>
      </p>
    </header>
  );
}
