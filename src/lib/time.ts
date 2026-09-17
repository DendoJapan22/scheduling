// 日付は "YYYY-MM-DD" 文字列、時刻は 0:00 からの分数で扱う（タイムゾーン変換をしない）。

export type DateStr = string; // "2026-10-10"

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function parseDate(d: DateStr): { y: number; m: number; day: number } {
  const [y, m, day] = d.split("-").map(Number);
  return { y, m, day };
}

export function isValidDateStr(d: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const { y, m, day } = parseDate(d);
  const dt = new Date(Date.UTC(y, m - 1, day));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === day
  );
}

export function toDateStr(dt: Date): DateStr {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(d: DateStr, n: number): DateStr {
  const { y, m, day } = parseDate(d);
  const dt = new Date(Date.UTC(y, m - 1, day + n));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(
    dt.getUTCDate(),
  ).padStart(2, "0")}`;
}

export function daysBetween(start: DateStr, end: DateStr): number {
  const a = parseDate(start);
  const b = parseDate(end);
  return Math.round(
    (Date.UTC(b.y, b.m - 1, b.day) - Date.UTC(a.y, a.m - 1, a.day)) / 86400000,
  );
}

export function dateRange(start: DateStr, end: DateStr): DateStr[] {
  const n = daysBetween(start, end);
  if (n < 0) return [];
  return Array.from({ length: n + 1 }, (_, i) => addDays(start, i));
}

export function weekday(d: DateStr): string {
  const { y, m, day } = parseDate(d);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, day)).getUTCDay()];
}

export function isWeekend(d: DateStr): "sat" | "sun" | null {
  const { y, m, day } = parseDate(d);
  const w = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
  return w === 0 ? "sun" : w === 6 ? "sat" : null;
}

/** "10/12" */
export function formatMD(d: DateStr): string {
  const { m, day } = parseDate(d);
  return `${m}/${day}`;
}

/** "10月12日(土)" */
export function formatDateJa(d: DateStr, withYear = false): string {
  const { y, m, day } = parseDate(d);
  return `${withYear ? `${y}年` : ""}${m}月${day}日(${weekday(d)})`;
}

/** 1020 -> "17:00" */
export function formatMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function slotStarts(
  dailyStart: number,
  dailyEnd: number,
  slotMinutes: number,
): number[] {
  const out: number[] = [];
  for (let t = dailyStart; t + slotMinutes <= dailyEnd; t += slotMinutes)
    out.push(t);
  return out;
}

export function slotKey(date: DateStr, startMin: number): string {
  return `${date}T${startMin}`;
}

export function parseSlotKey(
  key: string,
): { date: DateStr; startMin: number } | null {
  const i = key.indexOf("T");
  if (i < 0) return null;
  const date = key.slice(0, i);
  const startMin = Number(key.slice(i + 1));
  if (!isValidDateStr(date) || !Number.isInteger(startMin)) return null;
  return { date, startMin };
}
