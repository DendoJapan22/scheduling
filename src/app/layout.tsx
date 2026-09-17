import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "あいてる？", template: "%s | あいてる？" },
  description:
    "URLを送るだけ。名前を入れて空いている時間をなぞるだけの日程調整。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f6f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <div className="flex-1 w-full max-w-3xl mx-auto px-4 pb-16 pt-[max(12px,env(safe-area-inset-top))]">
          {children}
        </div>
        <footer className="py-6 text-center text-xs text-muted">
          <Link href="/" className="hover:text-ink">
            あいてる？ — 新しい日程調整をつくる
          </Link>
        </footer>
      </body>
    </html>
  );
}
