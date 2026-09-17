import { z } from "zod";
import { daysBetween, isValidDateStr } from "./time";

export const LIMITS = {
  titleMax: 60,
  nameMax: 20,
  maxDays: 31,
  slotOptions: [30, 60] as const,
  desiredOptions: [30, 60, 90, 120, 180, 240] as const,
};

const dateStr = z
  .string()
  .refine(isValidDateStr, { message: "日付の形式が正しくありません" });

const trimmed = (max: number, label: string) =>
  z
    .string()
    .transform((s) => s.replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(1, `${label}を入力してください`)
        .max(max, `${label}は${max}文字以内にしてください`),
    );

export const eventInputSchema = z
  .object({
    title: trimmed(LIMITS.titleMax, "イベント名"),
    startDate: dateStr,
    endDate: dateStr,
    dailyStart: z.coerce.number().int().min(0).max(1410).multipleOf(30),
    dailyEnd: z.coerce.number().int().min(30).max(1440).multipleOf(30),
    slotMinutes: z.coerce
      .number()
      .pipe(z.union([z.literal(30), z.literal(60)])),
    desiredMinutes: z.coerce.number().int().min(30).max(240).multipleOf(30),
  })
  .superRefine((v, ctx) => {
    const days = daysBetween(v.startDate, v.endDate);
    if (days < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "終了日は開始日以降にしてください",
      });
    } else if (days + 1 > LIMITS.maxDays) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: `期間は${LIMITS.maxDays}日以内にしてください`,
      });
    }
    if (v.dailyEnd - v.dailyStart < v.slotMinutes) {
      ctx.addIssue({
        code: "custom",
        path: ["dailyEnd"],
        message: "終了時刻は開始時刻より後にしてください",
      });
    }
    if (v.desiredMinutes % v.slotMinutes !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["desiredMinutes"],
        message: "予定の長さは時間単位の倍数にしてください",
      });
    }
  });

export type EventInput = z.infer<typeof eventInputSchema>;

export const nameSchema = trimmed(LIMITS.nameMax, "名前");

export const slotsSchema = z.array(z.string().max(30)).max(LIMITS.maxDays * 48);

/** FormData -> plain object（zod に渡す前段） */
export function formToObject(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

export function firstErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
