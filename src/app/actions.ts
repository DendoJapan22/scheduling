"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { newPublicId, newToken } from "@/lib/ids";
import { findEventByAdminToken } from "@/lib/queries";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { formToObject, parseEventInput } from "@/lib/validation";

export type FormState = {
  errors?: Record<string, string>;
  values?: Record<string, string>;
  ok?: boolean;
  /** 送信ごとに変わる値。フォームを作り直して、選択肢を送信時の値に戻すために使う */
  attempt?: number;
};

export async function createEvent(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const values = formToObject(fd);
  const parsed = parseEventInput(values);
  if (!parsed.success)
    return { errors: parsed.errors, values, attempt: Date.now() };

  const ip = clientIp(await headers());
  if (!rateLimit(`create:${ip}`, 20, 60 * 60 * 1000)) {
    return {
      errors: { _: "作成回数が多すぎます。しばらくしてからお試しください" },
      values,
      attempt: Date.now(),
    };
  }

  const db = await getDb();
  const adminToken = newToken();
  await db.insert(events).values({
    publicId: newPublicId(),
    adminToken,
    ...parsed.data,
  });
  redirect(`/manage/${adminToken}?created=1`);
}

export async function updateEvent(
  adminToken: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const event = await findEventByAdminToken(adminToken);
  if (!event) return { errors: { _: "イベントが見つかりません" } };
  const values = formToObject(fd);
  const parsed = parseEventInput(values);
  if (!parsed.success)
    return { errors: parsed.errors, values, attempt: Date.now() };

  const db = await getDb();
  await db
    .update(events)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(events.id, event.id));
  revalidatePath(`/e/${event.publicId}`);
  return { ok: true };
}

export async function deleteEvent(adminToken: string): Promise<void> {
  const event = await findEventByAdminToken(adminToken);
  if (!event) return;
  const db = await getDb();
  await db.delete(events).where(eq(events.id, event.id));
  redirect("/?deleted=1");
}
