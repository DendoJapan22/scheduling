export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function SaveStatus({
  state,
  onRetry,
}: {
  state: SaveState;
  onRetry?: () => void;
}) {
  if (state === "idle")
    return <span className="text-xs text-muted">&nbsp;</span>;
  if (state === "error")
    return (
      <button
        type="button"
        onClick={onRetry}
        className="text-xs font-semibold text-danger underline underline-offset-2"
      >
        保存できませんでした · 再試行
      </button>
    );
  const saving = state === "saving" || state === "dirty";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs ${saving ? "text-muted" : "text-accent-ink"}`}
    >
      {saving ? (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      ) : (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {saving ? "保存中…" : "保存済み"}
    </span>
  );
}
