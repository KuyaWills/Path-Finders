"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Home, BookOpen, LogOut, Crown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { isPremium?: boolean };

export function AppNav({ isPremium }: Props) {
  const t = useTranslations("app");
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      window.localStorage.removeItem("pathfinders_last_purchase");
    } catch {
      // ignore
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const isActive = (path: string) =>
    path === "/app" ? pathname === "/app" : pathname.startsWith(path);
  const navClass = (path: string) =>
    isActive(path)
      ? "bg-zinc-100 text-zinc-900"
      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900";

  return (
    <nav className="border-b border-zinc-200 bg-white px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <Link href="/app" className="flex items-center gap-2 font-semibold text-zinc-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb] text-white text-sm">PF</span>
          PathFinders
          {isPremium && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
              <Crown className="h-3 w-3" />
              Premium
            </span>
          )}
        </Link>
        <div className="flex gap-1">
          <Link
            href="/app"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${navClass("/app")}`}
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">{t("home")}</span>
          </Link>
          <Link
            href="/app/library"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${navClass("/app/library")}`}
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{t("library")}</span>
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("pathfinders:openChat"))}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t("aiHelper")}</span>
          </button>
          <Button
            variant="outline"
            size="sm"
            className="ml-2 gap-2 rounded-lg border-zinc-300 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t("logout")}</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
