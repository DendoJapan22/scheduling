import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  availabilitySlots,
  events,
  participants,
  type EventRow,
} from "@/db/schema";
import type { EventPublic, Results } from "./event-types";
import { dateRange, slotKey, slotStarts } from "./time";

export function toPublic(e: EventRow): EventPublic {
  return {
    publicId: e.publicId,
    title: e.title,
    startDate: e.startDate,
    endDate: e.endDate,
    dailyStart: e.dailyStart,
    dailyEnd: e.dailyEnd,
    slotMinutes: e.slotMinutes,
    desiredMinutes: e.desiredMinutes,
  };
}

export async function findEventByPublicId(
  publicId: string,
): Promise<EventRow | null> {
  if (!/^[A-Za-z0-9]{6,20}$/.test(publicId)) return null;
  const db = await getDb();
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.publicId, publicId))
    .limit(1);
  return rows[0] ?? null;
}

export async function findEventByAdminToken(
  adminToken: string,
): Promise<EventRow | null> {
  if (!/^[A-Za-z0-9]{20,64}$/.test(adminToken)) return null;
  const db = await getDb();
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.adminToken, adminToken))
    .limit(1);
  return rows[0] ?? null;
}

/** イベント全体の回答（現在のグリッドに収まるスロットのみ返す） */
export async function loadResults(event: EventRow): Promise<Results> {
  const db = await getDb();
  const [ps, slots] = await Promise.all([
    db
      .select({
        id: participants.id,
        name: participants.name,
        createdAt: participants.createdAt,
      })
      .from(participants)
      .where(eq(participants.eventId, event.id))
      .orderBy(participants.createdAt),
    db
      .select({
        participantId: availabilitySlots.participantId,
        date: availabilitySlots.date,
        startMin: availabilitySlots.startMin,
      })
      .from(availabilitySlots)
      .where(eq(availabilitySlots.eventId, event.id)),
  ]);

  const valid = validSlotKeys(event);
  const byParticipant = new Map<string, string[]>();
  for (const s of slots) {
    const k = slotKey(s.date, s.startMin);
    if (!valid.has(k)) continue;
    const arr = byParticipant.get(s.participantId);
    if (arr) arr.push(k);
    else byParticipant.set(s.participantId, [k]);
  }

  return {
    participants: ps.map((p) => ({
      id: p.id,
      name: p.name,
      slotKeys: byParticipant.get(p.id) ?? [],
    })),
  };
}

export function validSlotKeys(
  event: Pick<
    EventRow,
    "startDate" | "endDate" | "dailyStart" | "dailyEnd" | "slotMinutes"
  >,
): Set<string> {
  const set = new Set<string>();
  const starts = slotStarts(
    event.dailyStart,
    event.dailyEnd,
    event.slotMinutes,
  );
  for (const d of dateRange(event.startDate, event.endDate))
    for (const s of starts) set.add(slotKey(d, s));
  return set;
}
