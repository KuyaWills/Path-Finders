"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getQuizState } from "../QuizStore";
import { Sparkles, Lock } from "lucide-react";

type ProfileId = "focused_builder" | "broad_explorer" | "career_climber" | "steady_grower";

function deriveProfileFallback(answers: Record<number, import("../QuizStore").QuizStepAnswer>): ProfileId {
  const role = answers[0];
  const time = answers[2];
  const interests = answers[4];
  const roleStr = typeof role === "string" ? role : "";
  const timeStr = typeof time === "string" ? time : "";
  const interestArr = Array.isArray(interests) ? interests : [];

  if (roleStr.includes("senior") || roleStr.includes("mid")) return "career_climber";
  if (interestArr.length >= 3) return "broad_explorer";
  if (timeStr.includes("10") || timeStr.includes("15")) return "focused_builder";
  return "steady_grower";
}

const LOADING_DURATION_MS = 2200;
const PROGRESS_END = 98;

export function QuizResultView() {
  const t = useTranslations("quiz");
  const tResult = useTranslations("quiz.result");
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const [goal, setGoal] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const state = getQuizState();
    if (!state.completedAt) {
      router.replace("/quiz");
      return;
    }
    const goalStr = typeof state.answers[5] === "string" ? state.answers[5] : "";

    let cancelled = false;

    // Animate progress bar 0 -> PROGRESS_END over LOADING_DURATION_MS
    const start = Date.now();
    progressIntervalRef.current = setInterval(() => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const p = Math.min(PROGRESS_END, Math.round((elapsed / LOADING_DURATION_MS) * PROGRESS_END));
      setProgress(p);
    }, 50);

    async function run() {
      try {
        const res = await fetch("/api/quiz/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: state.answers }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.profile) {
          setProfile(data.profile as ProfileId);
          setCustomDescription(data.description ?? null);
        } else {
          setProfile(deriveProfileFallback(state.answers));
          setCustomDescription(null);
        }
        setGoal(goalStr);
      } catch {
        if (cancelled) return;
        setProfile(deriveProfileFallback(state.answers));
        setCustomDescription(null);
        setGoal(goalStr);
      } finally {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (!cancelled) setProgress(100);
      }
    }
    run();
    return () => {
      cancelled = true;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [router]);

  if (profile === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <p className="text-sm font-medium text-zinc-600">{t("calculatingProfile")}</p>
        <div className="w-full max-w-xs">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-[#2563eb] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-zinc-500">{progress}%</p>
        </div>
      </div>
    );
  }

  const profileLabels: Record<ProfileId, string> = {
    focused_builder: "Focused Builder",
    broad_explorer: "Broad Explorer",
    career_climber: "Career Climber",
    steady_grower: "Steady Grower",
  };
  const profileDescs: Record<ProfileId, string> = {
    focused_builder: "You invest serious time and want clear direction. We'll give you a structured path and daily drills that match your goals.",
    broad_explorer: "You're curious across many areas. We'll help you connect the dots and prioritize without overwhelm.",
    career_climber: "You're ready to level up. We'll focus on system design, ownership, and the habits that get you to the next role.",
    steady_grower: "You're building consistency. We'll keep you on track with small, sustainable steps and regular check-ins.",
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-white bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-[#2563eb]">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">{tResult("subtitle")}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">{tResult("title")}</h1>

          {/* Minimal result: profile name + short teaser only */}
          <div className="mt-6 rounded-xl bg-zinc-50 p-4">
            <p className="font-semibold text-zinc-900">{profileLabels[profile]}</p>
            <p className="mt-1 text-sm text-zinc-600">{tResult("minimalTeaser")}</p>
          </div>

          {/* Locked full analysis teaser */}
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <Lock className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-zinc-600">{tResult("fullResultLocked")}</p>
          </div>

          <Link href="/offer" className="mt-8 block">
            <Button variant="primary" size="lg" className="w-full rounded-lg">
              {t("unlockFullPlan")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
