import type { EventPublic, ParticipantPublic } from "./event-types";
import { daySlotStarts, eventDays } from "./days";
import { slotKey } from "./time";

export type BestTime = {
  date: string;
  startMin: number;
  endMin: number;
  availableIds: string[];
  missingNames: string[];
  count: number;
  total: number;
};

/**
 * 「予定の長さ」分連続して空いている人が最も多い時間帯を探す。
 * 同じメンバー構成で連続するウィンドウは 1 つの時間帯にまとめる（19:00〜21:30 など）。
 */
export function findBestTimes(
  event: EventPublic,
  participants: ParticipantPublic[],
  limit = 3,
): BestTime[] {
  const total = participants.length;
  if (total === 0) return [];

  const wanted = Math.max(
    1,
    Math.round(event.desiredMinutes / event.slotMinutes),
  );
  const sets = participants.map((p) => new Set(p.slotKeys));

  const candidates: BestTime[] = [];
  for (const day of eventDays(event)) {
    const date = day.date;
    const starts = daySlotStarts(day, event.slotMinutes);
    // 予定の長さより短い枠しかない日は、その日の枠全体で評価する
    const windowLen = Math.min(starts.length, wanted);
    if (windowLen === 0) continue;
    let prev: BestTime | null = null;
    for (let i = 0; i + windowLen <= starts.length; i++) {
      const ids: string[] = [];
      for (let p = 0; p < participants.length; p++) {
        let ok = true;
        for (let j = i; j < i + windowLen; j++) {
          if (!sets[p].has(slotKey(date, starts[j]))) {
            ok = false;
            break;
          }
        }
        if (ok) ids.push(participants[p].id);
      }
      if (ids.length === 0) {
        prev = null;
        continue;
      }
      const endMin = starts[i + windowLen - 1] + event.slotMinutes;
      if (prev && sameIds(prev.availableIds, ids)) {
        prev.endMin = endMin;
        continue;
      }
      const idSet = new Set(ids);
      prev = {
        date,
        startMin: starts[i],
        endMin,
        availableIds: ids,
        missingNames: participants
          .filter((p) => !idSet.has(p.id))
          .map((p) => p.name),
        count: ids.length,
        total,
      };
      candidates.push(prev);
    }
  }

  candidates.sort(
    (a, b) =>
      b.count - a.count ||
      b.endMin - b.startMin - (a.endMin - a.startMin) ||
      a.date.localeCompare(b.date) ||
      a.startMin - b.startMin,
  );

  // 上位と時間が重なる候補（同じ日の、より少人数のバリエーション）は省いて、別の選択肢を出す
  const chosen: BestTime[] = [];
  for (const c of candidates) {
    if (chosen.length >= limit) break;
    const overlaps = chosen.some(
      (x) =>
        x.date === c.date && x.startMin < c.endMin && c.startMin < x.endMin,
    );
    if (!overlaps) chosen.push(c);
  }
  return chosen;
}

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/** 各スロットに空いている参加者IDの一覧 */
export function countBySlot(
  participants: ParticipantPublic[],
): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const p of participants) {
    for (const k of p.slotKeys) {
      const arr = m.get(k);
      if (arr) arr.push(p.id);
      else m.set(k, [p.id]);
    }
  }
  return m;
}
