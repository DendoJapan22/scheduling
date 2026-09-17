"use client";

import { useMemo, useState } from "react";
import type { EventPublic, ParticipantPublic } from "@/lib/event-types";
import { countBySlot } from "@/lib/scoring";
import {
  dateRange,
  formatDateJa,
  formatMin,
  parseSlotKey,
  slotKey,
  slotStarts,
} from "@/lib/time";
import { GridFrame } from "./GridFrame";

type Props = {
  event: EventPublic;
  participants: ParticipantPublic[];
  /** 特定の参加者だけを表示するとき */
  focusParticipantId?: string | null;
};

export function HeatmapGrid({
  event,
  participants,
  focusParticipantId,
}: Props) {
  const dates = useMemo(
    () => dateRange(event.startDate, event.endDate),
    [event.startDate, event.endDate],
  );
  const starts = useMemo(
    () => slotStarts(event.dailyStart, event.dailyEnd, event.slotMinutes),
    [event.dailyStart, event.dailyEnd, event.slotMinutes],
  );
  const bySlot = useMemo(() => countBySlot(participants), [participants]);
  const nameOf = useMemo(
    () => new Map(participants.map((p) => [p.id, p.name])),
    [participants],
  );
  const focus = focusParticipantId
    ? participants.find((p) => p.id === focusParticipantId)
    : null;
  const focusSet = useMemo(() => new Set(focus?.slotKeys ?? []), [focus]);
  const total = participants.length;

  const [picked, setPicked] = useState<string | null>(null);
  const pickedInfo = picked ? parseSlotKey(picked) : null;
  const pickedIds = picked ? (bySlot.get(picked) ?? []) : [];

  return (
    <div>
      <GridFrame
        dates={dates}
        starts={starts}
        slotMinutes={event.slotMinutes}
        renderCell={(date, s) => {
          const k = slotKey(date, s);
          const n = focus
            ? focusSet.has(k)
              ? 1
              : 0
            : (bySlot.get(k)?.length ?? 0);
          const denom = focus ? 1 : total;
          const ratio = denom === 0 ? 0 : n / denom;
          const isPicked = picked === k;
          return (
            <button
              type="button"
              key={`${date}${s}`}
              className={`cell flex items-center justify-center text-[11px] font-semibold tabular-nums leading-none ${
                isPicked
                  ? "outline outline-2 -outline-offset-2 outline-ink z-[1]"
                  : ""
              }`}
              data-half={event.slotMinutes < 60 && s % 60 !== 0}
              style={{
                background:
                  ratio === 0
                    ? "#fff"
                    : `color-mix(in oklab, var(--accent) ${Math.round(18 + ratio * 82)}%, white)`,
                color:
                  ratio >= 0.6
                    ? "#fff"
                    : ratio > 0
                      ? "var(--accent-ink)"
                      : "transparent",
              }}
              onClick={() => setPicked(isPicked ? null : k)}
              aria-label={`${date} ${formatMin(s)} ${n}/${denom}人`}
            >
              {!focus && n > 0 ? n : ""}
            </button>
          );
        }}
      />
      <div className="mt-2 min-h-[44px] text-sm">
        {pickedInfo ? (
          <div className="fade-in card px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">
                {formatDateJa(pickedInfo.date)} {formatMin(pickedInfo.startMin)}
                〜{formatMin(pickedInfo.startMin + event.slotMinutes)}
              </span>
              <span className="text-muted tabular-nums">
                {pickedIds.length} / {total}人
              </span>
            </div>
            <div className="mt-1 text-muted">
              {pickedIds.length > 0
                ? pickedIds.map((id) => nameOf.get(id)).join("、")
                : "空いている人はいません"}
            </div>
          </div>
        ) : (
          <p className="px-1 text-xs text-muted">
            {focus
              ? `${focus.name}さんの空き時間`
              : "セルをタップすると、その時間に空いている人がわかります"}
          </p>
        )}
      </div>
    </div>
  );
}
