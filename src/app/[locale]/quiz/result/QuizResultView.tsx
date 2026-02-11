"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getQuizState } from "../QuizStore";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_ANALYSIS =
  "Your answers show a mix of habits many developers have. There's always room to level up: using the debugger more, reading docs before searching, and treating code review as a learning conversation are habits that help.";

const DEFAULT_PLAN = [
  "1. Use the debugger on your next bug.",
  "2. When stuck, read docs for 15 minutes before searching.",
  "3. Trace one user flow when learning a new codebase.",
  "4. Ask \"why\" when you get code review feedback.",
].join("\n\n");

const FALLBACK_ANALYSIS =
  "We couldn't run the full analysis right now. Here's a solid default plan: use the debugger more, read docs when stuck, trace one flow in new codebases, and ask \"why\" in code reviews.";

const FALLBACK_PLAN = [
  "1. Use the debugger on your next bug.",
  "2. Read official docs for 15 minutes before searching.",
  "3. Trace one user flow in the new repo.",
  "4. Ask reviewers why they suggested changes.",
].join("\n\n");

export function QuizResultView() {
  const t = useTranslations("quiz");
  const tResult = useTranslations("quiz.result");
  const router = useRouter();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      const state = getQuizState(user?.id ?? null);
      if (!state.completedAt) {
        router.replace("/quiz");
        return;
      }

      const LOADING_MS = 2200;
      const PROGRESS_END = 98;
      const start = Date.now();
      progressIntervalRef.current = setInterval(() => {
        if (cancelled) return;
        const elapsed = Date.now() - start;
        const p = Math.min(PROGRESS_END, Math.round((elapsed / LOADING_MS) * PROGRESS_END));
        setProgress(p);
      }, 50);

      try {
        const res = await fetch("/api/quiz/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: state.answers }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.analysis) {
          setAnalysis(data.analysis);
          setPlan(typeof data.plan === "string" ? data.plan : DEFAULT_PLAN);
        } else {
          setAnalysis(DEFAULT_ANALYSIS);
          setPlan(DEFAULT_PLAN);
        }
      } catch {
        if (cancelled) return;
        setAnalysis(FALLBACK_ANALYSIS);
        setPlan(FALLBACK_PLAN);
      } finally {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (!cancelled) setProgress(100);
      }
    }

    init();
    return () => {
      cancelled = true;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [router]);

  if (analysis === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <p className="text-sm font-medium text-zinc-600">
          {t("calculatingAnalysis")}
        </p>
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

  const planSteps = plan
    ? plan
        .split(/\n\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-white bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-[#2563eb]">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">{tResult("subtitle")}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">
            {tResult("title")}
          </h1>

          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {tResult("analysisHeading")}
            </h2>
            <div className="mt-2 rounded-xl bg-zinc-50 p-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">
                {analysis}
              </p>
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {tResult("planHeading")}
            </h2>
            <div className="mt-2 rounded-xl border border-[#2563eb]/20 bg-blue-50/50 p-4">
              {planSteps.length > 0 ? (
                <ol className="list-decimal space-y-3 pl-4">
                  {planSteps.map((step, i) => (
                    <li
                      key={i}
                      className="text-sm leading-relaxed text-zinc-800"
                    >
                      {step.replace(/^\d+\.\s*/, "")}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">
                  {plan}
                </p>
              )}
            </div>
          </section>

          <p className="mt-6 text-center text-xs text-zinc-500">
            {tResult("unlockMore")}
          </p>
          <Link href="/offer" className="mt-4 block">
            <Button variant="primary" size="lg" className="w-full rounded-lg">
              {t("unlockFullPlan")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
