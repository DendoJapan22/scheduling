"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { deleteEvent, updateEvent, type FormState } from "@/app/actions";
import type { EventPublic } from "@/lib/event-types";
import { forgetAdmin, rememberAdmin } from "@/lib/storage";
import { EventFields } from "./EventFields";

/** 主催者ページの下部: 設定の変更と削除 */
export function ManagePanel({
  adminToken,
  event,
}: {
  adminToken: string;
  event: EventPublic;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(
    updateEvent.bind(null, adminToken),
    {},
  );
  const [confirming, setConfirming] = useState(false);

  const [handled, setHandled] = useState<FormState | null>(null);
  const router = useRouter();

  // 保存後はサーバーの最新内容（見出し・集計）を取り直す
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  // 作成直後の ?created=1 はURLから外しておく（再読み込みで残らないように）
  useEffect(() => {
    if (window.location.search.includes("created=1")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    rememberAdmin({ adminToken, title: event.title, createdAt: Date.now() });
  }, [adminToken, event.title]);

  // 保存が成功したらフォームを閉じる（レンダー中の状態調整パターン）
  if (state.ok && state !== handled) {
    setHandled(state);
    setOpen(false);
  }

  const values = state.values ?? {
    title: event.title,
    startDate: event.startDate,
    endDate: event.endDate,
    dailyStart: String(event.dailyStart),
    dailyEnd: String(event.dailyEnd),
    slotMinutes: String(event.slotMinutes),
    desiredMinutes: String(event.desiredMinutes),
  };

  return (
    <div className="mt-10 border-t border-line pt-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "設定を閉じる" : "イベントの設定を変更"}
        </button>
        {state.ok && !open && (
          <span className="fade-in text-xs text-accent-ink">保存しました</span>
        )}
        <span className="flex-1" />
        {confirming ? (
          <span className="fade-in flex items-center gap-2 text-sm">
            <span className="text-muted">回答も全部消えます</span>
            <button
              type="button"
              className="btn btn-sm bg-danger text-white"
              onClick={() => {
                forgetAdmin(adminToken);
                deleteEvent(adminToken);
              }}
            >
              削除する
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirming(false)}
            >
              やめる
            </button>
          </span>
        ) : (
          <button
            type="button"
            className="btn btn-sm text-danger hover:bg-red-50"
            onClick={() => setConfirming(true)}
          >
            イベントを削除
          </button>
        )}
      </div>

      {open && (
        <form
          action={action}
          className="card fade-in mt-4 flex flex-col gap-6 p-5"
        >
          <EventFields values={values} errors={state.errors} />
          <p className="text-xs text-muted">
            期間や時間帯を狭めると、その範囲外の回答は集計に表示されなくなります。
          </p>
          {state.errors?._ && (
            <p className="text-sm text-danger">{state.errors._}</p>
          )}
          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "保存中…" : "変更を保存"}
          </button>
        </form>
      )}

      <p className="mt-6 text-xs text-muted">
        このページのURLは主催者専用です。参加者には上の「参加者に送るURL」を共有してください。
      </p>
    </div>
  );
}
