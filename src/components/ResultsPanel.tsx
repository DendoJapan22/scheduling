"use client";

import { useMemo, useState } from "react";
import type { EventPublic, ParticipantPublic } from "@/lib/event-types";
import { findBestTimes } from "@/lib/scoring";
import { BestTimes } from "./BestTimes";
import { HeatmapGrid } from "./HeatmapGrid";

type Props = {
  event: EventPublic;
  participants: ParticipantPublic[];
  meId?: string | null;
};

export function ResultsPanel({ event, participants, meId }: Props) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const best = useMemo(
    () => findBestTimes(event, participants, 3),
    [event, participants],
  );
  const focus = focusId ? participants.find((p) => p.id === focusId) : null;

  return (
    <div className="flex flex-col gap-7">
      <BestTimes
        items={best}
        total={participants.length}
        desiredMinutes={event.desiredMinutes}
      />

      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="text-base font-bold">
            {focus ? `${focus.name}さんの空き時間` : "空いている人数"}
          </h2>
          {focus ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setFocusId(null)}
            >
              全員に戻す
            </button>
          ) : (
            <span className="text-xs text-muted">数字は空いている人数</span>
          )}
        </div>
        <HeatmapGrid
          event={event}
          participants={participants}
          focusParticipantId={focusId}
        />
      </section>

      <section>
        <h2 className="text-base font-bold">
          参加者 <span className="tabular-nums">{participants.length}</span>人
        </h2>
        {participants.length === 0 ? (
          <p className="mt-2 text-sm text-muted">まだ誰も回答していません</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {participants.map((p) => {
              const active = focusId === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setFocusId(active ? null : p.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      active
                        ? "border-accent bg-accent text-white"
                        : "border-line-strong bg-surface hover:bg-accent-soft"
                    }`}
                  >
                    {p.name}
                    {p.id === meId && (
                      <span
                        className={`ml-1 text-xs ${active ? "text-white/80" : "text-muted"}`}
                      >
                        (自分)
                      </span>
                    )}
                    {p.slotKeys.length === 0 && (
                      <span
                        className={`ml-1 text-xs ${active ? "text-white/80" : "text-muted"}`}
                      >
                        未入力
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
