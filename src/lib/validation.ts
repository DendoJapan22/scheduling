import { z } from "zod";
import type { DayWindow } from "./days";
import { daysBetween, formatMD, isValidDateStr } from "./time";

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

// --- 日にち指定モード ---
const daySchema = z.object({
  date: dateStr,
  start: z.number().int().min(0).max(1410).multipleOf(30),
  end: z.number().int().min(30).max(1440).multipleOf(30),
});

const baseSchema = z.object({
  title: trimmed(LIMITS.titleMax, "イベント名"),
  slotMinutes: z.coerce.number().pipe(z.union([z.literal(30), z.literal(60)])),
  desiredMinutes: z.coerce.number().int().min(30).max(240).multipleOf(30),
});

export type EventData = EventInput & { days: DayWindow[] | null };

type ParseResult =
  | { success: true; data: EventData }
  | { success: false; errors: Record<string, string> };

/**
 * 作成・編集フォームの検証。mode=dates なら days(JSON) を、そうでなければ期間を読む。
 * どちらの場合も startDate/endDate/dailyStart/dailyEnd を埋めて返す（日にち指定では最小〜最大）。
 */
export function parseEventInput(values: Record<string, string>): ParseResult {
  if (values.mode !== "dates") {
    const r = eventInputSchema.safeParse(values);
    return r.success
      ? { success: true, data: { ...r.data, days: null } }
      : { success: false, errors: firstErrors(r.error) };
  }

  const errors: Record<string, string> = {};
  const base = baseSchema.safeParse(values);
  if (!base.success) Object.assign(errors, firstErrors(base.error));
  const slot = base.success ? base.data.slotMinutes : 30;
  if (base.success && base.data.desiredMinutes % slot !== 0) {
    errors.desiredMinutes = "予定の長さは時間単位の倍数にしてください";
  }

  let raw: unknown = null;
  try {
    raw = JSON.parse(values.days ?? "[]");
  } catch {
    /* 下で弾く */
  }
  const parsed = z
    .array(daySchema)
    .min(1, "日にちを1つ以上追加してください")
    .max(LIMITS.maxDays, `日にちは${LIMITS.maxDays}個までです`)
    .safeParse(raw);

  let days: DayWindow[] = [];
  if (!parsed.success) {
    errors.days = parsed.error.issues[0]?.message ?? "日にちが正しくありません";
  } else {
    days = [...parsed.data].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      if (i > 0 && days[i - 1].date === d.date) {
        errors.days = `${formatMD(d.date)} が2回選ばれています`;
        break;
      }
      if (d.end - d.start < slot) {
        errors.days = `${formatMD(d.date)} の終了時刻は開始時刻より後にしてください`;
        break;
      }
      if (d.start % slot !== 0) {
        errors.days = `60分単位のときは開始時刻を「◯:00」にしてください（${formatMD(d.date)}）`;
        break;
      }
    }
  }

  if (!base.success || Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  return {
    success: true,
    data: {
      ...base.data,
      startDate: days[0].date,
      endDate: days[days.length - 1].date,
      dailyStart: Math.min(...days.map((d) => d.start)),
      dailyEnd: Math.max(...days.map((d) => d.end)),
      days,
    },
  };
}

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
