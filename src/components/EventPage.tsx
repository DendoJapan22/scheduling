"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { EventPublic, ParticipantPublic } from "@/lib/event-types";
import {
  clearIdentity,
  readIdentityRaw,
  saveIdentity,
  subscribeStorage,
  type Identity,
} from "@/lib/storage";
import { LIMITS } from "@/lib/validation";
import { EventHeader } from "./EventHeader";
import { MyAvailability } from "./MyAvailability";
import { ResultsPanel } from "./ResultsPanel";

type Tab = "me" | "all";

type Props = {
  event: EventPublic;
  initialParticipants: ParticipantPublic[];
};

export function EventPage({ event, initialParticipants }: Props) {
  const [tab, setTab] = useState<Tab>("me");
  const [participants, setParticipants] = useState(initialParticipants);

  // このブラウザで入力した回答（localStorage）。サーバー描画時は undefined
  const raw = useSyncExternalStore(
    subscribeStorage,
    () => readIdentityRaw(event.publicId),
    () => undefined,
  );
  const stored = useMemo<Identity | null | undefined>(() => {
    if (raw === undefined) return undefined;
    if (!raw) return null;
    try {
      const v = JSON.parse(raw) as Identity;
      return typeof v.participantId === "string" &&
        typeof v.editToken === "string"
        ? v
        : null;
    } catch {
      return null;
    }
  }, [raw]);
  const me = stored
    ? participants.find((p) => p.id === stored.participantId)
    : undefined;
  const identity: Identity | null | undefined =
    stored === undefined
      ? undefined
      : stored && me
        ? { ...stored, name: me.name }
        : null;

  // 参加者が削除されていた場合は記録を消す
  useEffect(() => {
    if (stored && !me) clearIdentity(event.publicId);
  }, [stored, me, event.publicId]);

  // --- 集計の再取得 ---
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/e/${event.publicId}/results`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { participants: ParticipantPublic[] };
      setParticipants(data.participants);
    } catch {
      /* オフライン等は無視 */
    }
  }, [event.publicId]);

  useEffect(() => {
    if (tab !== "all") return;
    const first = setTimeout(refresh, 0);
    const t = setInterval(refresh, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [tab, refresh]);

  // --- 参加 / 名前変更 / 別の人 ---
  const join = async (name: string) => {
    const res = await fetch(`/api/e/${event.publicId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = (await res.json()) as {
      participantId?: string;
      editToken?: string;
      name?: string;
      error?: string;
    };
    if (!res.ok || !data.participantId || !data.editToken)
      throw new Error(data.error ?? "参加できませんでした");
    const id: Identity = {
      participantId: data.participantId,
      editToken: data.editToken,
      name: data.name ?? name,
    };
    setParticipants((ps) => [
      ...ps,
      { id: id.participantId, name: id.name, slotKeys: [] },
    ]);
    saveIdentity(event.publicId, id);
  };

  const rename = async (name: string) => {
    if (!identity) return;
    const res = await fetch(`/api/participants/${identity.participantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editToken: identity.editToken, name }),
    });
    const data = (await res.json()) as { name?: string; error?: string };
    if (!res.ok || !data.name)
      throw new Error(data.error ?? "変更できませんでした");
    const newName = data.name;
    setParticipants((ps) =>
      ps.map((p) =>
        p.id === identity.participantId ? { ...p, name: newName } : p,
      ),
    );
    saveIdentity(event.publicId, { ...identity, name: newName });
  };

  const onSaved = (participantId: string, slotKeys: string[]) => {
    setParticipants((ps) =>
      ps.map((p) => (p.id === participantId ? { ...p, slotKeys } : p)),
    );
  };

  return (
    <main className="pt-2">
      <EventHeader event={event} />

      <div className="seg mt-5 w-full" role="tablist">
        <button
          type="button"
          role="tab"
          data-active={tab === "me"}
          aria-selected={tab === "me"}
          onClick={() => setTab("me")}
        >
          自分の予定
        </button>
        <button
          type="button"
          role="tab"
          data-active={tab === "all"}
          aria-selected={tab === "all"}
          onClick={() => setTab("all")}
        >
          みんなの予定
          {participants.length > 0 && (
            <span className="ml-1 text-xs font-normal">
              ({participants.length})
            </span>
          )}
        </button>
      </div>

      <div className="mt-5">
        {tab === "me" ? (
          identity === undefined ? (
            <div className="h-40" />
          ) : identity === null ? (
            <NameEntry onJoin={join} />
          ) : (
            <MyAvailability
              key={identity.participantId}
              event={event}
              identity={identity}
              initialSlotKeys={me?.slotKeys ?? []}
              onSaved={onSaved}
              onRename={rename}
              onSwitch={() => clearIdentity(event.publicId)}
              onShowAll={() => setTab("all")}
            />
          )
        ) : (
          <div className="fade-in">
            <ResultsPanel
              event={event}
              participants={participants}
              meId={identity?.participantId}
            />
          </div>
        )}
      </div>
    </main>
  );
}

function NameEntry({ onJoin }: { onJoin: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onJoin(n);
    } catch (err) {
      setError(err instanceof Error ? err.message : "参加できませんでした");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card fade-in p-5">
      <label htmlFor="name" className="block text-sm font-semibold">
        あなたの名前
      </label>
      <p className="mt-0.5 text-xs text-muted">
        みんなに分かる名前で
      </p>
      <div className="mt-3 flex gap-2">
        <input
          id="name"
          className="field min-w-0 flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 田中"
          maxLength={LIMITS.nameMax}
          autoComplete="off"
          autoFocus
          enterKeyHint="go"
          aria-invalid={!!error}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={busy || !name.trim()}
        >
          {busy ? "…" : "予定を入力する"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </form>
  );
}
