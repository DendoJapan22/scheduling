"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { EventPublic } from "@/lib/event-types";
import { dateRange, slotKey, slotStarts } from "@/lib/time";
import { GridFrame } from "./GridFrame";

type Cell = { c: number; r: number };
type Drag = { anchor: Cell; current: Cell; mode: "add" | "remove" };

const HOLD_MS = 130; // タッチ: これ以上押してから動かすと選択、すぐ動かすとスクロール
const MOVE_PX = 10;

type Props = {
  event: EventPublic;
  value: Set<string>;
  onChange: (next: Set<string>) => void;
};

/**
 * 空き時間の入力グリッド。
 * - クリック/タップでトグル、ドラッグで矩形選択（開始セルの状態で「選択」か「解除」かが決まる）
 * - タッチでは「少し押してからなぞる」と選択、すぐ動かすとスクロール（ジェスチャーの衝突回避）
 */
export function AvailabilityGrid({ event, value, onChange }: Props) {
  const dates = useMemo(
    () => dateRange(event.startDate, event.endDate),
    [event.startDate, event.endDate],
  );
  const starts = useMemo(
    () => slotStarts(event.dailyStart, event.dailyEnd, event.slotMinutes),
    [event.dailyStart, event.dailyEnd, event.slotMinutes],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const pending = useRef<{
    cell: Cell;
    x: number;
    y: number;
    lastX: number;
    lastY: number;
    scrolling: boolean;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  const setDragBoth = (d: Drag | null) => {
    dragRef.current = d;
    setDrag(d);
  };

  const keyOf = useCallback(
    (cell: Cell) => slotKey(dates[cell.c], starts[cell.r]),
    [dates, starts],
  );

  const toggle = useCallback(
    (cell: Cell) => {
      const k = keyOf(cell);
      const next = new Set(value);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      onChange(next);
    },
    [keyOf, value, onChange],
  );

  const commit = useCallback(
    (d: Drag) => {
      const next = new Set(value);
      const c0 = Math.min(d.anchor.c, d.current.c);
      const c1 = Math.max(d.anchor.c, d.current.c);
      const r0 = Math.min(d.anchor.r, d.current.r);
      const r1 = Math.max(d.anchor.r, d.current.r);
      for (let c = c0; c <= c1; c++) {
        for (let r = r0; r <= r1; r++) {
          const k = slotKey(dates[c], starts[r]);
          if (d.mode === "add") next.add(k);
          else next.delete(k);
        }
      }
      onChange(next);
    },
    [dates, starts, value, onChange],
  );

  const startDrag = useCallback(
    (cell: Cell) => {
      const mode = value.has(keyOf(cell)) ? "remove" : "add";
      setDragBoth({ anchor: cell, current: cell, mode });
      if (typeof navigator !== "undefined" && "vibrate" in navigator)
        navigator.vibrate?.(8);
    },
    [value, keyOf],
  );

  const clearPending = () => {
    if (pending.current) clearTimeout(pending.current.timer);
    pending.current = null;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (e.pointerType === "mouse") {
      if (e.button !== 0) return;
      e.preventDefault();
      startDrag(cell);
      return;
    }
    clearPending();
    pending.current = {
      cell,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      scrolling: false,
      timer: setTimeout(() => {
        const p = pending.current;
        if (p && !p.scrolling) {
          pending.current = null;
          startDrag(p.cell);
        }
      }, HOLD_MS),
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (d) {
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (cell && (cell.c !== d.current.c || cell.r !== d.current.r)) {
        setDragBoth({ ...d, current: cell });
      }
      return;
    }
    const p = pending.current;
    if (!p) return;
    if (!p.scrolling) {
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < MOVE_PX) return;
      p.scrolling = true;
      clearTimeout(p.timer);
    }
    // スクロールモード: 指の動きに合わせてグリッド（足りなければページ）をスクロール
    const dx = p.lastX - e.clientX;
    const dy = p.lastY - e.clientY;
    p.lastX = e.clientX;
    p.lastY = e.clientY;
    const el = scrollRef.current;
    if (el) {
      const beforeTop = el.scrollTop;
      el.scrollLeft += dx;
      el.scrollTop += dy;
      const leftover = dy - (el.scrollTop - beforeTop);
      if (Math.abs(leftover) > 0.5) window.scrollBy(0, leftover);
    } else {
      window.scrollBy(0, dy);
    }
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    if (d) {
      commit(d);
      setDragBoth(null);
      return;
    }
    const p = pending.current;
    if (p && !p.scrolling) toggle(p.cell);
    clearPending();
  };

  const onPointerCancel = () => {
    setDragBoth(null);
    clearPending();
  };

  useEffect(() => () => clearPending(), []);

  const inRect = (c: number, r: number, d: Drag) =>
    c >= Math.min(d.anchor.c, d.current.c) &&
    c <= Math.max(d.anchor.c, d.current.c) &&
    r >= Math.min(d.anchor.r, d.current.r) &&
    r <= Math.max(d.anchor.r, d.current.r);

  return (
    <GridFrame
      dates={dates}
      starts={starts}
      slotMinutes={event.slotMinutes}
      scrollRef={scrollRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      renderCell={(date, s, ci, ri) => {
        const on = value.has(slotKey(date, s));
        let preview: "add" | "remove" | undefined;
        if (drag && inRect(ci, ri, drag)) {
          if (drag.mode === "add" && !on) preview = "add";
          if (drag.mode === "remove" && on) preview = "remove";
        }
        return (
          <div
            key={`${date}${s}`}
            className="cell cell-avail grid-cells cursor-pointer"
            data-c={ci}
            data-r={ri}
            data-on={on}
            data-preview={preview}
            data-half={event.slotMinutes < 60 && s % 60 !== 0}
            role="checkbox"
            aria-checked={on}
            aria-label={`${date} ${s}`}
          />
        );
      }}
    />
  );
}

function cellFromPoint(x: number, y: number): Cell | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-c]");
  if (!el) return null;
  return { c: Number(el.dataset.c), r: Number(el.dataset.r) };
}
