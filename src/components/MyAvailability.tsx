"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventPublic } from "@/lib/event-types";
import type { Identity } from "@/lib/storage";
import { LIMITS } from "@/lib/validation";
import { AvailabilityGrid } from "./AvailabilityGrid";
import { SaveStatus, type SaveState } from "./SaveStatus";

const AUTOSAVE_MS = 600;

type Props = {
  event: EventPublic;
  identity: Identity;
  initialSlotKeys: string[];
  onSaved: (participantId: string, slotKeys: string[]) => void;
  onRename: (name: string) => Promise<void>;
  onSwitch: () => void;
  onShowAll: () => void;
};

const snapshotOf = (s: Set<string>) => JSON.stringify([...s].sort());

/** 自分の予定入力（グリッド + 自動保存）。参加者が変わるときは key で作り直す */
export function MyAvailability({
  event,
  identity,
  initialSlotKeys,
  onSaved,
  onRename,
  onSwitch,
  onShowAll,
}: Props) {
  const [slots, setSlots] = useState<Set<string>>(
    () => new Set(initialSlotKeys),
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const latest = useRef(slots);
  const savedSnapshot = useRef(snapshotOf(slots));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(false);
  const saveRef = useRef<(keepalive?: boolean) => Promise<void>>(
    async () => {},
  );

  const save = useCallback(
    async (keepalive = false) => {
      const snapshot = snapshotOf(latest.current);
      if (snapshot === savedSnapshot.current) {
        setSaveState((s) => (s === "dirty" ? "saved" : s));
        return;
      }
      if (inflight.current) return; // 完了後に再チェックする
      inflight.current = true;
      setSaveState("saving");
      const slotKeys = [...latest.current];
      try {
        const res = await fetch(`/api/participants/${identity.participantId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ editToken: identity.editToken, slotKeys }),
          keepalive,
        });
        if (!res.ok) throw new Error(String(res.status));
        savedSnapshot.current = snapshot;
        setSaveState("saved");
        onSaved(identity.participantId, slotKeys);
      } catch {
        setSaveState("error");
      } finally {
        inflight.current = false;
        if (
          snapshotOf(latest.current) !== savedSnapshot.current &&
          savedSnapshot.current === snapshot
        ) {
          // 保存中にさらに変更があった → 続けて保存
          timer.current = setTimeout(() => saveRef.current(), AUTOSAVE_MS);
        }
      }
    },
    [identity.participantId, identity.editToken, onSaved],
  );

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const onChange = (next: Set<string>) => {
    setSlots(next);
    latest.current = next;
    setSaveState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saveRef.current(), AUTOSAVE_MS);
  };

  // ページを離れる／バックグラウンドに回るときは待たずに送る
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== "hidden") return;
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      saveRef.current(true);
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <section className="fade-in">
      <div className="mb-2 flex items-center justify-between gap-2">
        <NameBadge
          name={identity.name}
          onRename={onRename}
          onSwitch={onSwitch}
        />
        <SaveStatus state={saveState} onRetry={() => saveRef.current()} />
      </div>
      <AvailabilityGrid event={event} value={slots} onChange={onChange} />
      <p className="mt-2 px-1 text-xs text-muted">
        空いている時間をタップ。少し押してからなぞると連続で選べます
        <span className="hidden sm:inline">
          （ドラッグでまとめて選択・解除）
        </span>
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted">
          選択中{" "}
          <span className="font-semibold text-ink tabular-nums">
            {slots.size}
          </span>{" "}
          枠
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onShowAll}
        >
          みんなの予定を見る →
        </button>
      </div>
    </section>
  );
}

function NameBadge({
  name,
  onRename,
  onSwitch,
}: {
  name: string;
  onRename: (name: string) => Promise<void>;
  onSwitch: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [menu, setMenu] = useState(false);

  if (editing) {
    return (
      <form
        className="flex min-w-0 flex-1 gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const n = draft.trim();
          if (!n) return;
          try {
            if (n !== name) await onRename(n);
            setEditing(false);
          } catch {
            /* 表示は据え置き */
          }
        }}
      >
        <input
          className="field min-h-[36px] min-w-0 flex-1 px-3 text-sm"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={LIMITS.nameMax}
          autoFocus
        />
        <button type="submit" className="btn btn-primary btn-sm">
          決定
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setEditing(false);
            setDraft(name);
          }}
        >
          やめる
        </button>
      </form>
    );
  }

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={() => setMenu((m) => !m)}
        className="flex max-w-full items-center gap-1 rounded-lg px-1 py-0.5 text-left hover:bg-accent-soft"
        aria-haspopup="menu"
        aria-expanded={menu}
      >
        <span className="truncate text-base font-bold">{name}</span>
        <span className="shrink-0 text-sm text-muted">さんの予定</span>
        <svg
          className="shrink-0 text-muted"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {menu && (
        <div
          role="menu"
          className="card fade-in absolute left-0 top-full z-10 mt-1 w-48 overflow-hidden py-1 text-sm shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2 text-left hover:bg-accent-soft"
            onClick={() => {
              setMenu(false);
              setDraft(name);
              setEditing(true);
            }}
          >
            名前を変える
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2 text-left hover:bg-accent-soft"
            onClick={() => {
              setMenu(false);
              onSwitch();
            }}
          >
            別の人として入力する
          </button>
        </div>
      )}
    </div>
  );
}
