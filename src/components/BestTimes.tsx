import type { BestTime } from "@/lib/scoring";
import { formatDateJa, formatMin } from "@/lib/time";

export function BestTimes({
  items,
  total,
  desiredMinutes,
}: {
  items: BestTime[];
  total: number;
  desiredMinutes: number;
}) {
  return (
    <section>
      <h2 className="text-base font-bold">みんなが集まりやすい時間</h2>
      <p className="mt-0.5 text-xs text-muted">
        {formatDuration(desiredMinutes)}以上つづけて空いている時間帯
      </p>
      {total === 0 ? (
        <p className="card mt-3 px-4 py-6 text-center text-sm text-muted">
          まだ誰も回答していません
        </p>
      ) : items.length === 0 ? (
        <p className="card mt-3 px-4 py-6 text-center text-sm text-muted">
          {formatDuration(desiredMinutes)}つづけて空いている人がまだいません
        </p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2">
          {items.map((b, i) => {
            const full = b.count === b.total;
            return (
              <li
                key={`${b.date}${b.startMin}`}
                className="card flex items-center gap-3 px-4 py-3"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    i === 0
                      ? "bg-accent text-white"
                      : "bg-accent-soft text-accent-ink"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {formatDateJa(b.date)}{" "}
                    <span className="tabular-nums">
                      {formatMin(b.startMin)}〜{formatMin(b.endMin)}
                    </span>
                  </div>
                  {!full && b.missingNames.length <= 3 && (
                    <div className="truncate text-xs text-muted">
                      {b.missingNames.join("、")}さん以外
                    </div>
                  )}
                </div>
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums ${full ? "text-accent-ink" : "text-ink"}`}
                >
                  {b.count} / {b.total}人
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min}分`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}
