import { LIMITS } from "@/lib/validation";
import { formatMin } from "@/lib/time";
import { formatDuration } from "./BestTimes";

type Props = {
  values: Record<string, string>;
  errors?: Record<string, string>;
};

const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => i * 30);

/** イベント作成・編集で共通のフォーム項目 */
export function EventFields({ values, errors = {} }: Props) {
  const slot = values.slotMinutes ?? "30";
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

      <Field label="期間" error={errors.startDate ?? errors.endDate}>
        <div className="flex items-center gap-2">
          <input
            type="date"
            name="startDate"
            className="field min-w-0 flex-1"
            defaultValue={values.startDate}
            required
            aria-invalid={!!errors.startDate}
          />
          <span className="text-muted">〜</span>
          <input
            type="date"
            name="endDate"
            className="field min-w-0 flex-1"
            defaultValue={values.endDate}
            required
            aria-invalid={!!errors.endDate}
          />
        </div>
      </Field>

      <Field label="時間帯" error={errors.dailyStart ?? errors.dailyEnd}>
        <div className="flex items-center gap-2">
          <select
            name="dailyStart"
            className="field min-w-0 flex-1"
            defaultValue={values.dailyStart ?? "1020"}
          >
            {TIME_OPTIONS.slice(0, -1).map((m) => (
              <option key={m} value={m}>
                {formatMin(m)}
              </option>
            ))}
          </select>
          <span className="text-muted">〜</span>
          <select
            name="dailyEnd"
            className="field min-w-0 flex-1"
            defaultValue={values.dailyEnd ?? "1380"}
          >
            {TIME_OPTIONS.slice(1).map((m) => (
              <option key={m} value={m}>
                {m === 1440 ? "24:00" : formatMin(m)}
              </option>
            ))}
          </select>
        </div>
      </Field>

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
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}
