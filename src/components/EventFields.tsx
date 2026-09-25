"use client";

import { useState } from "react";
import type { DayWindow } from "@/lib/days";
import { addDays, formatMin, toDateStr } from "@/lib/time";
import { LIMITS } from "@/lib/validation";
import { formatDuration } from "./BestTimes";

type Props = {
  values: Record<string, string>;
  errors?: Record<string, string>;
};

type Mode = "range" | "dates";

const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => i * 30);
const START_OPTIONS = TIME_OPTIONS.slice(0, -1);
const END_OPTIONS = TIME_OPTIONS.slice(1);
const timeLabel = (m: number) => (m === 1440 ? "24:00" : formatMin(m));

function initialDays(values: Record<string, string>): DayWindow[] {
  try {
    const d = JSON.parse(values.days ?? "") as DayWindow[];
    if (Array.isArray(d) && d.length > 0) return d;
  } catch {
    /* 初期値へ */
  }
  const date = values.startDate ?? toDateStr(new Date());
  return [
    {
      date,
      start: Number(values.dailyStart ?? 1020),
      end: Number(values.dailyEnd ?? 1320),
    },
  ];
}

/** イベント作成・編集で共通のフォーム項目 */
export function EventFields({ values, errors = {} }: Props) {
  const slot = values.slotMinutes ?? "30";
  const [mode, setMode] = useState<Mode>(
    values.mode === "dates" ? "dates" : "range",
  );
  const [days, setDays] = useState<DayWindow[]>(() => initialDays(values));

  const updateDay = (i: number, patch: Partial<DayWindow>) =>
    setDays((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  const addDay = () =>
    setDays((ds) => {
      const last = ds[ds.length - 1];
      const base = last ?? {
        date: toDateStr(new Date()),
        start: 1020,
        end: 1320,
      };
      return [
        ...ds,
        { ...base, date: last ? addDays(last.date, 1) : base.date },
      ];
    });

  return (
    <div className="flex flex-col gap-5">
      <Field label="イベント名" error={errors.title}>
        <input
          name="title"
          className="field"
          defaultValue={values.title}
          placeholder="例: 10月の飲み会"
          maxLength={LIMITS.titleMax}
          required
          aria-invalid={!!errors.title}
          autoComplete="off"
        />
      </Field>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">いつ？</span>
          <div
            className="seg text-sm"
            role="radiogroup"
            aria-label="日程の決め方"
          >
            <button
              type="button"
              role="radio"
              aria-checked={mode === "range"}
              data-active={mode === "range"}
              onClick={() => setMode("range")}
            >
              期間で指定
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mode === "dates"}
              data-active={mode === "dates"}
              onClick={() => setMode("dates")}
            >
              日にち指定
            </button>
          </div>
        </div>
        <input type="hidden" name="mode" value={mode} />

        {mode === "range" ? (
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  name="startDate"
                  className="field min-w-0 flex-1"
                  defaultValue={values.startDate}
                  required
                  aria-label="開始日"
                  aria-invalid={!!errors.startDate}
                />
                <span className="text-muted">〜</span>
                <input
                  type="date"
                  name="endDate"
                  className="field min-w-0 flex-1"
                  defaultValue={values.endDate}
                  required
                  aria-label="終了日"
                  aria-invalid={!!errors.endDate}
                />
              </div>
              <FieldError error={errors.startDate ?? errors.endDate} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <select
                  name="dailyStart"
                  className="field min-w-0 flex-1"
                  defaultValue={values.dailyStart ?? "1020"}
                  aria-label="毎日の開始時刻"
                >
                  {START_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {timeLabel(m)}
                    </option>
                  ))}
                </select>
                <span className="text-muted">〜</span>
                <select
                  name="dailyEnd"
                  className="field min-w-0 flex-1"
                  defaultValue={values.dailyEnd ?? "1380"}
                  aria-label="毎日の終了時刻"
                >
                  {END_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {timeLabel(m)}
                    </option>
                  ))}
                </select>
              </div>
              <FieldError error={errors.dailyStart ?? errors.dailyEnd} />
            </div>
          </div>
        ) : (
          <div>
            <input type="hidden" name="days" value={JSON.stringify(days)} />
            <ul className="flex flex-col gap-2">
              {days.map((d, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-xl bg-bg p-2"
                >
                  <input
                    type="date"
                    className="field min-w-[150px] flex-[1_1_150px]"
                    value={d.date}
                    onChange={(e) => updateDay(i, { date: e.target.value })}
                    required
                    aria-label={`${i + 1}つ目の日にち`}
                  />
                  <div className="flex min-w-[210px] flex-[1_1_210px] items-center gap-1.5">
                    <select
                      className="field min-w-0 flex-1 px-3"
                      value={d.start}
                      onChange={(e) => {
                        const start = Number(e.target.value);
                        updateDay(i, {
                          start,
                          end:
                            d.end <= start ? Math.min(1440, start + 60) : d.end,
                        });
                      }}
                      aria-label={`${i + 1}つ目の開始時刻`}
                    >
                      {START_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {timeLabel(m)}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted">〜</span>
                    <select
                      className="field min-w-0 flex-1 px-3"
                      value={d.end}
                      onChange={(e) =>
                        updateDay(i, { end: Number(e.target.value) })
                      }
                      aria-label={`${i + 1}つ目の終了時刻`}
                    >
                      {END_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {timeLabel(m)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-white hover:text-danger disabled:opacity-30"
                      onClick={() =>
                        setDays((ds) => ds.filter((_, j) => j !== i))
                      }
                      disabled={days.length === 1}
                      aria-label={`${i + 1}つ目を削除`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      >
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            {days.length < LIMITS.maxDays && (
              <button
                type="button"
                className="btn btn-ghost btn-sm mt-2 w-full border-dashed"
                onClick={addDay}
              >
                ＋ 日にちを追加
              </button>
            )}
            <FieldError error={errors.days} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="時間単位" error={errors.slotMinutes}>
          <div className="seg w-full" role="radiogroup">
            {LIMITS.slotOptions.map((m) => (
              <label key={m} className="relative cursor-pointer text-center">
                <input
                  type="radio"
                  name="slotMinutes"
                  value={m}
                  defaultChecked={slot === String(m)}
                  className="peer sr-only"
                />
                <span className="flex h-full items-center justify-center rounded-[9px] peer-checked:bg-white peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                  {m}分
                </span>
              </label>
            ))}
          </div>
        </Field>
        <Field
          label="予定の長さ"
          error={errors.desiredMinutes}
          hint="集まりやすい時間の目安"
        >
          <select
            name="desiredMinutes"
            className="field"
            defaultValue={values.desiredMinutes ?? "120"}
          >
            {LIMITS.desiredOptions.map((m) => (
              <option key={m} value={m}>
                {formatDuration(m)}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? (
    <span className="mt-1 block text-xs text-danger">{error}</span>
  ) : null;
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold">
        {label}
        {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
      </span>
      {children}
      <FieldError error={error} />
    </label>
  );
}
