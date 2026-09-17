"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadAdminMemos, type AdminMemo } from "@/lib/storage";

/** このブラウザで作成したイベント（主催者がURLを失くしたときの保険） */
export function MyEvents() {
  const [memos, setMemos] = useState<AdminMemo[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMemos(loadAdminMemos());
  }, []);
  if (memos.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold text-muted">
        このブラウザで作ったイベント
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5">
        {memos.map((m) => (
          <li key={m.adminToken}>
            <Link
              href={`/manage/${m.adminToken}`}
              className="card flex items-center justify-between px-4 py-3 text-sm hover:bg-accent-soft"
            >
              <span className="truncate font-medium">{m.title}</span>
              <span className="ml-3 shrink-0 text-xs text-muted">
                管理ページ →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
