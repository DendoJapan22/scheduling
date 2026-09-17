import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { availabilitySlots, events, participants } from "@/db/schema";
import { error, json, readJson } from "@/lib/api";
import { validSlotKeys } from "@/lib/queries";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { parseSlotKey } from "@/lib/time";
import { nameSchema, slotsSchema } from "@/lib/validation";

async function authorize(id: string, editToken: unknown) {
  if (typeof editToken !== "string" || !/^[A-Za-z0-9]{20,64}$/.test(editToken))
    return null;
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const db = await getDb();
  const rows = await db
    .select({ participant: participants, event: events })
    .from(participants)
    .innerJoin(events, eq(events.id, participants.eventId))
    .where(and(eq(participants.id, id), eq(participants.editToken, editToken)))
    .limit(1);
  return rows[0] ?? null;
}

/** 空き時間を丸ごと置き換える（自動保存） */
export async function PUT(
  req: Request,
  ctx: RouteContext<"/api/participants/[id]">,
) {
  if (!rateLimit(`save:${clientIp(req.headers)}`, 120, 60 * 1000)) {
    return error(429, "保存が多すぎます。少し待ってください");
  }
  const { id } = await ctx.params;
  const body = (await readJson(req)) as {
    editToken?: unknown;
    slotKeys?: unknown;
  } | null;
  const auth = await authorize(id, body?.editToken);
  if (!auth) return error(403, "この回答を編集する権限がありません");

  const parsed = slotsSchema.safeParse(body?.slotKeys);
  if (!parsed.success) return error(400, "データが不正です");

  const valid = validSlotKeys(auth.event);
  const rows: { date: string; startMin: number }[] = [];
  const seen = new Set<string>();
  for (const k of parsed.data) {
    if (!valid.has(k) || seen.has(k)) continue;
    seen.add(k);
    const s = parseSlotKey(k)!;
    rows.push(s);
  }

  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx
      .delete(availabilitySlots)
      .where(eq(availabilitySlots.participantId, id));
    if (rows.length > 0) {
      await tx.insert(availabilitySlots).values(
        rows.map((r) => ({
          participantId: id,
          eventId: auth.event.id,
          date: r.date,
          startMin: r.startMin,
          endMin: r.startMin + auth.event.slotMinutes,
        })),
      );
    }
    await tx
      .update(participants)
      .set({ updatedAt: new Date() })
      .where(eq(participants.id, id));
  });

  return json({ ok: true, saved: rows.length });
}

/** 名前の変更 */
export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/participants/[id]">,
) {
  const { id } = await ctx.params;
  const body = (await readJson(req)) as {
    editToken?: unknown;
    name?: unknown;
  } | null;
  const auth = await authorize(id, body?.editToken);
  if (!auth) return error(403, "この回答を編集する権限がありません");
  const parsed = nameSchema.safeParse(
    typeof body?.name === "string" ? body.name : "",
  );
  if (!parsed.success)
    return error(400, parsed.error.issues[0]?.message ?? "名前が不正です");
  const db = await getDb();
  await db
    .update(participants)
    .set({ name: parsed.data, updatedAt: new Date() })
    .where(eq(participants.id, id));
  return json({ ok: true, name: parsed.data });
}
