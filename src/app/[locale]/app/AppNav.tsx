"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Home } from "lucide-react";

export function AppNav() {
  const t = useTranslations("app");
  const pathname = usePathname();
  const base = "/app";

  return (
    <nav className="border-b border-zinc-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <Link href="/app" className="flex items-center gap-2 font-semibold text-zinc-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb] text-white text-sm">PF</span>
          PathFinders
        </Link>
        <div className="flex gap-1">
          <Link
            href="/app"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === base ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">{t("home")}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
