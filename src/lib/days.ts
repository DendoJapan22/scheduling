// イベントの「日ごとの受付時間帯」を一つの形で扱う。
// - 期間モード: startDate〜endDate の毎日、dailyStart〜dailyEnd
// - 日にち指定モード: days に列挙された日と、その日ごとの時間帯
import { dateRange, slotKey, slotStarts } from "./time";

export type DayWindow = { date: string; start: number; end: number };

type Schedule = {
  startDate: string;
  endDate: string;
  dailyStart: number;
  dailyEnd: number;
  slotMinutes: number;
  days?: DayWindow[] | null;
};

export function eventDays(e: Schedule): DayWindow[] {
  if (e.days && e.days.length > 0) return e.days;
  return dateRange(e.startDate, e.endDate).map((date) => ({
    date,
    start: e.dailyStart,
    end: e.dailyEnd,
  }));
}

/** グリッドの行（全日の時間帯を合わせた範囲） */
export function gridRows(days: DayWindow[], slotMinutes: number): number[] {
  if (days.length === 0) return [];
  const min = Math.min(...days.map((d) => d.start));
  const max = Math.max(...days.map((d) => d.end));
  return slotStarts(min, max, slotMinutes);
}

export function daySlotStarts(day: DayWindow, slotMinutes: number): number[] {
  return slotStarts(day.start, day.end, slotMinutes);
}

/** 回答として有効なスロット（その日の受付時間帯に収まるもの） */
export function validSlotKeys(e: Schedule): Set<string> {
  const set = new Set<string>();
  for (const d of eventDays(e))
    for (const s of daySlotStarts(d, e.slotMinutes))
      set.add(slotKey(d.date, s));
  return set;
}
