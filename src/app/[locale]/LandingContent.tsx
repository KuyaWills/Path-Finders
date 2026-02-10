"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

/** Curly brace { - dev/code symbol */
function CodeBrace({
  className,
  id,
  variant = "open",
  rotation = 0,
}: {
  className?: string;
  id?: string;
  variant?: "open" | "close";
  rotation?: number;
}) {
  const gId = id ?? "brace";
  const rotate = (variant === "close" ? 180 : 0) + rotation;
  return (
    <svg viewBox="0 0 24 48" className={className} style={{ transform: `rotate(${rotate}deg)` }} aria-hidden>
      <defs>
        <linearGradient id={gId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e07a5f" />
          <stop offset="100%" stopColor="#c56b5a" />
        </linearGradient>
      </defs>
      <path
        d="M18 4 C8 4 4 12 4 24 C4 36 8 44 18 44"
        stroke={`url(#${gId})`}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M6 4 C16 4 20 12 20 24 C20 36 16 44 6 44"
        stroke={`url(#${gId})`}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Small floating curly brackets */
const floatingBraces = [
  { id: "fb1", left: "12%", top: "18%", delay: 0, rot: -12 },
  { id: "fb2", left: "88%", top: "22%", delay: 0.3, rot: 8 },
  { id: "fb3", left: "6%", top: "65%", delay: 0.6, rot: -18 },
  { id: "fb4", left: "92%", top: "58%", delay: 0.2, rot: 15 },
  { id: "fb5", left: "22%", top: "82%", delay: 0.4, rot: 10 },
  { id: "fb6", left: "85%", top: "12%", delay: 0.1, rot: -10 },
  { id: "fb7", left: "15%", top: "42%", delay: 0.7, rot: 5 },
  { id: "fb8", left: "55%", top: "88%", delay: 0.55, rot: -8 },
  { id: "fb9", left: "32%", top: "28%", delay: 0.15, rot: 12 },
];

export function LandingContent() {
  const t = useTranslations("landing");
  const tOffer = useTranslations("offer");
  const locale = useLocale();
  const router = useRouter();
  const nextLocale = locale === "en" ? "zh-TW" : "en";
  const label = locale === "en" ? "中文" : "EN";
  const [quizLoading, setQuizLoading] = useState(false);
  const [purchaseBanner, setPurchaseBanner] = useState<{ planId: string; at?: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("pathfinders_last_purchase");
      if (!raw) return;
      window.localStorage.removeItem("pathfinders_last_purchase");
      const parsed = JSON.parse(raw) as { planId?: string; at?: number };
      setPurchaseBanner({ planId: parsed.planId ?? "lifetime", at: parsed.at });
    } catch {
      // ignore
    }
  }, []);

  const planLabel = purchaseBanner
    ? purchaseBanner.planId === "starter"
      ? `${tOffer("planStarterName")} — ${tOffer("planStarterPrice")}`
      : `${tOffer("planLifetimeName")} — ${tOffer("planLifetimePrice")}`
    : "";
  const purchasedOn =
    purchaseBanner?.at != null
      ? new Date(purchaseBanner.at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  const handleStartQuiz = async () => {
    setQuizLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/quiz");
      } else {
        router.push("/login?redirect=/quiz");
      }
    } finally {
      setQuizLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Warm cream base with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#fff9f5] via-[#fef5eb] to-[#fceee3]" />

      {/* Very subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main curly brackets - bold dev aesthetic */}
      <CodeBrace id="brace-1" className="absolute left-[3%] top-[12%] h-20 w-10 opacity-55 sm:h-28 sm:w-14" />
      <CodeBrace id="brace-2" variant="close" className="absolute right-[4%] top-[16%] h-18 w-9 opacity-50 sm:h-24 sm:w-12" />
      <CodeBrace id="brace-3" className="absolute bottom-[20%] left-[6%] h-16 w-8 rotate-[-15deg] opacity-45" />
      <CodeBrace id="brace-4" variant="close" className="absolute bottom-[28%] right-[5%] h-14 w-7 rotate-[12deg] opacity-48" />
      <CodeBrace id="brace-5" className="absolute left-[8%] top-[45%] h-12 w-6 opacity-35" />
      <CodeBrace id="brace-6" variant="close" className="absolute right-[10%] bottom-[35%] h-14 w-7 opacity-40" />

      {/* Floating small curly brackets */}
      {floatingBraces.map((c, i) => (
        <div
          key={c.id}
          className="absolute animate-float"
          style={{
            left: c.left,
            top: c.top,
            width: 20,
            height: 32,
            animationDelay: `${c.delay}s`,
          }}
        >
          <CodeBrace
            id={c.id}
            variant={i % 2 === 0 ? "open" : "close"}
            rotation={c.rot}
            className="h-full w-full opacity-50"
          />
        </div>
      ))}

      {/* Soft organic blobs - warm, muted */}
      <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[#f4a261]/15 blur-3xl" />
      <div className="absolute -right-32 -bottom-32 h-80 w-80 rounded-full bg-[#81b29a]/12 blur-3xl" />
      <div className="absolute right-1/4 top-1/2 h-48 w-48 rounded-full bg-[#e9c46a]/10 blur-2xl" />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>

      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e07a5f] text-white font-semibold shadow-sm">
            PF
          </div>
          <span className="text-xl font-bold text-zinc-900">{t("brand")}</span>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            locale={nextLocale}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            {label}
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            {t("logIn")}
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm" className="rounded-md">
              {t("getStarted")}
            </Button>
          </Link>
        </nav>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 text-center sm:px-6">
        {purchaseBanner && (
          <div className="pointer-events-none fixed top-4 left-0 right-0 z-20 flex justify-center px-4 sm:px-0">
            <div className="pointer-events-auto max-w-md rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm text-emerald-800 shadow-lg">
              <p className="font-semibold">Thank you for your purchase!</p>
              <p className="mt-1 text-xs text-emerald-900">
                Order summary: {planLabel}
              </p>
              {purchasedOn && (
                <p className="mt-0.5 text-[11px] text-emerald-900/80">
                  Purchased on {purchasedOn}
                </p>
              )}
            </div>
          </div>
        )}
        <h1 className="max-w-2xl text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl md:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-xl text-base text-zinc-600 sm:mt-6 sm:text-lg">
          {t("subtitle")}
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row">
          <Button
            variant="primary"
            size="lg"
            className="w-full gap-2 rounded-lg px-8 py-3 text-base shadow-sm sm:w-auto"
            onClick={handleStartQuiz}
            disabled={quizLoading}
          >
            {quizLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                {t("ctaQuiz")}
                <ChevronRight className="h-5 w-5" />
              </>
            )}
          </Button>
          <Link href="/signup">
            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-lg border-zinc-300 bg-white px-8 py-3 text-base sm:w-auto"
            >
              {t("getStarted")}
            </Button>
          </Link>
        </div>
        <p className="mt-8 flex items-center justify-center gap-1.5 rounded-lg bg-white/60 px-4 py-2.5 text-xs text-zinc-600 shadow-sm backdrop-blur-sm sm:mt-10">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Built for junior devs — start the quiz or sign up for daily guidance
        </p>
      </main>
    </div>
  );
}
