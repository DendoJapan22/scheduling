import { getDb } from "@/db";
import { participants } from "@/db/schema";
import { error, json, readJson } from "@/lib/api";
import { newToken } from "@/lib/ids";
import { findEventByPublicId } from "@/lib/queries";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { nameSchema } from "@/lib/validation";
import { count, eq } from "drizzle-orm";

const MAX_PARTICIPANTS = 100;

export async function POST(
  req: Request,
  ctx: RouteContext<"/api/e/[publicId]/participants">,
) {
  if (!rateLimit(`join:${clientIp(req.headers)}`, 30, 60 * 60 * 1000)) {
    return error(429, "しばらく時間をおいてから再度お試しください");
  }
  const { publicId } = await ctx.params;
  const event = await findEventByPublicId(publicId);
  if (!event) return error(404, "イベントが見つかりません");

  const body = (await readJson(req)) as { name?: unknown } | null;
  const parsed = nameSchema.safeParse(
    typeof body?.name === "string" ? body.name : "",
  );
  if (!parsed.success)
    return error(400, parsed.error.issues[0]?.message ?? "名前が不正です");

  const db = await getDb();
  const [{ n }] = await db
    .select({ n: count() })
    .from(participants)
    .where(eq(participants.eventId, event.id));
  if (n >= MAX_PARTICIPANTS) return error(400, "参加者数の上限に達しました");

  const editToken = newToken();
  const [row] = await db
    .insert(participants)
    .values({ eventId: event.id, name: parsed.data, editToken })
    .returning({ id: participants.id, name: participants.name });

  return json(
    { participantId: row.id, name: row.name, editToken },
    { status: 201 },
  );
}
