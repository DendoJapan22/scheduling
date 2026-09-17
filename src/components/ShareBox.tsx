"use client";

import { useEffect, useState } from "react";

export function ShareBox({ path, title }: { path: string; title: string }) {
  const [url, setUrl] = useState(path);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // 絶対URLはクライアントの origin から組み立てる
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(`${window.location.origin}${path}`);
    setCanShare(typeof navigator.share === "function");
  }, [path]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("URLをコピーしてください", url);
    }
  };

  const share = async () => {
    try {
      await navigator.share({
        title: `${title} の日程調整`,
        text: `「${title}」の空いている時間を入力してください`,
        url,
      });
    } catch {
      /* キャンセル */
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2.5">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 bg-transparent text-sm tabular-nums outline-none"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          className={`btn flex-1 ${copied ? "btn-ghost" : "btn-primary"}`}
        >
          {copied ? "コピーしました" : "URLをコピー"}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={share}
            className="btn btn-ghost flex-1"
          >
            共有する
          </button>
        )}
      </div>
    </div>
  );
}
