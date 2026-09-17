// ブラウザ側の「このブラウザで入力した回答」「作成したイベント」の記録

export type Identity = {
  participantId: string;
  editToken: string;
  name: string;
};

const pKey = (publicId: string) => `aiteru:p:${publicId}`;
const ADMIN_KEY = "aiteru:admin";

function safeGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode 等は無視 */
  }
}

export function loadIdentity(publicId: string): Identity | null {
  const v = safeGet<Identity>(pKey(publicId));
  return v &&
    typeof v.participantId === "string" &&
    typeof v.editToken === "string"
    ? v
    : null;
}

export function saveIdentity(publicId: string, id: Identity) {
  safeSet(pKey(publicId), id);
  emit();
}

export function clearIdentity(publicId: string) {
  try {
    localStorage.removeItem(pKey(publicId));
  } catch {}
  emit();
}

export type AdminMemo = {
  adminToken: string;
  title: string;
  createdAt: number;
};

export function loadAdminMemos(): AdminMemo[] {
  return safeGet<AdminMemo[]>(ADMIN_KEY) ?? [];
}

export function rememberAdmin(memo: AdminMemo) {
  const list = loadAdminMemos().filter((m) => m.adminToken !== memo.adminToken);
  list.unshift(memo);
  safeSet(ADMIN_KEY, list.slice(0, 20));
}

export function forgetAdmin(adminToken: string) {
  safeSet(
    ADMIN_KEY,
    loadAdminMemos().filter((m) => m.adminToken !== adminToken),
  );
}

// --- 同一タブ内での変更通知（useSyncExternalStore 用） ---
const listeners = new Set<() => void>();
function emit() {
  for (const l of listeners) l();
}
export function subscribeStorage(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
export function readIdentityRaw(publicId: string): string | null {
  try {
    return localStorage.getItem(pKey(publicId));
  } catch {
    return null;
  }
}
