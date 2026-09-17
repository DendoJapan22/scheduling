"use client";

import type {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from "react";
import { formatMD, formatMin, isWeekend, weekday } from "@/lib/time";

export const ROW_H = 36;
export const HEADER_H = 46;
export const TIME_W = 52;
export const COL_MIN_W = 46;

type Props = {
  dates: string[];
  starts: number[];
  slotMinutes: number;
  renderCell: (
    date: string,
    startMin: number,
    ci: number,
    ri: number,
  ) => ReactNode;
  scrollRef?: RefObject<HTMLDivElement | null>;
  maxHeight?: string;
  onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (e: ReactPointerEvent<HTMLDivElement>) => void;
};

/** 入力グリッドとヒートマップで共通の、日付ヘッダー(sticky top)と時間列(sticky left)を持つ枠 */
export function GridFrame({
  dates,
  starts,
  slotMinutes,
  renderCell,
  scrollRef,
  maxHeight,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: Props) {
  const half = slotMinutes < 60;
  return (
    <div
      ref={scrollRef}
      className="grid-scroll"
      style={{ maxHeight: maxHeight ?? "calc(100dvh - 190px)" }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `${TIME_W}px repeat(${dates.length}, minmax(${COL_MIN_W}px, 1fr))`,
          gridTemplateRows: `${HEADER_H}px repeat(${starts.length}, ${ROW_H}px)`,
          minWidth: TIME_W + dates.length * COL_MIN_W,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className="sticky-corner border-b border-line"
          style={{ height: HEADER_H }}
        />
        {dates.map((d) => {
          const w = isWeekend(d);
          return (
            <div
              key={d}
              className="sticky-top border-b border-l border-line flex flex-col items-center justify-center leading-none"
              style={{ height: HEADER_H }}
            >
              <span className="text-[13px] font-semibold tabular-nums">
                {formatMD(d)}
              </span>
              <span
                className={`mt-1 text-[11px] ${w === "sat" ? "text-sat" : w === "sun" ? "text-sun" : "text-muted"}`}
              >
                {weekday(d)}
              </span>
            </div>
          );
        })}
        {starts.map((s, ri) => {
          const isHalf = half && s % 60 !== 0;
          return [
            <div
              key={`t${s}`}
              className={`sticky-left cell flex items-center justify-end pr-2 tabular-nums leading-none border-l-0 ${
                isHalf ? "text-[10px] text-muted/70" : "text-[11px] text-muted"
              }`}
              data-half={isHalf}
            >
              {isHalf ? ":30" : formatMin(s)}
            </div>,
            ...dates.map((d, ci) => renderCell(d, s, ci, ri)),
          ];
        })}
      </div>
    </div>
  );
}
