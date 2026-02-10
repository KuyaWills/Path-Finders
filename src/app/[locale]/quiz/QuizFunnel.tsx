"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getQuizState,
  saveQuizState,
  clearQuizState,
  TOTAL_STEPS,
  type QuizState,
  type QuizStepAnswer,
} from "./QuizStore";
import { QUIZ_STEPS } from "./quizSteps";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function QuizFunnel() {
  const t = useTranslations("quiz");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<QuizState>({ step: 0, answers: {}, completedAt: null });
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login?redirect=/quiz");
        return;
      }
      setAuthChecked(true);
    });
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    // After login/signup we redirect with new_session=1 so user starts quiz from step 1 with no answers
    if (searchParams.get("new_session") === "1") {
      clearQuizState();
      router.replace("/quiz", { scroll: false });
    }
    setState(getQuizState());
    setMounted(true);
  }, [authChecked, searchParams, router]);

  const persist = useCallback((newState: QuizState) => {
    setState(newState);
    saveQuizState(newState);
  }, []);

  const currentStepConfig = QUIZ_STEPS[state.step];
  const currentAnswer = state.answers[state.step];
  const isLastStep = state.step === TOTAL_STEPS - 1;

  const setAnswer = useCallback(
    (value: QuizStepAnswer) => {
      persist({
        ...state,
        answers: { ...state.answers, [state.step]: value },
      });
    },
    [state, persist]
  );

  const goNext = useCallback(() => {
    if (isLastStep) {
      setIsSubmitting(true);
      persist({
        ...state,
        completedAt: Date.now(),
      });
      router.push("/quiz/result");
      return;
    }
    persist({ ...state, step: state.step + 1 });
  }, [state, isLastStep, persist, router]);

  const goBack = useCallback(() => {
    if (state.step > 0) {
      persist({ ...state, step: state.step - 1 });
    } else {
      router.push("/");
    }
  }, [state, persist, router]);

  const canProceed = (): boolean => {
    if (currentStepConfig?.type === "freetext") {
      return typeof currentAnswer === "string" && currentAnswer.trim().length > 0;
    }
    if (currentStepConfig?.type === "single") {
      return typeof currentAnswer === "string" && currentAnswer.length > 0;
    }
    if (currentStepConfig?.type === "multi") {
      return Array.isArray(currentAnswer) && currentAnswer.length > 0;
    }
    return false;
  };

  if (!authChecked || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563eb] border-t-transparent" />
      </div>
    );
  }

  // Result view is on a separate /quiz/result page
  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-[#2563eb] transition-all duration-300"
              style={{ width: `${((state.step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-center text-sm text-zinc-500">
            {t("progress", { current: state.step + 1, total: TOTAL_STEPS })}
          </p>
        </div>

        <div className="rounded-2xl border border-white bg-white p-6 shadow-sm">
          {currentStepConfig && (
            <>
              <h2 className="text-xl font-semibold text-zinc-900">
                {t(`${currentStepConfig.translationKey}.title`)}
              </h2>

              {currentStepConfig.type === "single" && currentStepConfig.options && (
                <div className="mt-4 space-y-2">
                  {currentStepConfig.options.map((optKey) => (
                    <button
                      key={optKey}
                      type="button"
                      onClick={() => setAnswer(optKey)}
                      className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                        currentAnswer === optKey
                          ? "border-[#2563eb] bg-blue-50 text-[#2563eb]"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      {t(`${currentStepConfig.translationKey}.${optKey}`)}
                    </button>
                  ))}
                </div>
              )}

              {currentStepConfig.type === "multi" && currentStepConfig.options && (
                <div className="mt-4 space-y-2">
                  {currentStepConfig.options.map((optKey) => {
                    const selected = Array.isArray(currentAnswer) && currentAnswer.includes(optKey);
                    return (
                      <label
                        key={optKey}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                          selected
                            ? "border-[#2563eb] bg-blue-50 text-[#2563eb]"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            const prev = (Array.isArray(currentAnswer) ? currentAnswer : []) as string[];
                            const next = selected
                              ? prev.filter((x) => x !== optKey)
                              : [...prev, optKey];
                            setAnswer(next);
                          }}
                          className="h-4 w-4 shrink-0 rounded border-zinc-300 text-[#2563eb] focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-0"
                          aria-label={t(`${currentStepConfig.translationKey}.${optKey}`)}
                        />
                        <span className="flex-1">{t(`${currentStepConfig.translationKey}.${optKey}`)}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {currentStepConfig.type === "freetext" && (
                <div className="mt-4">
                  <Input
                    type="text"
                    placeholder={t(`${currentStepConfig.translationKey}.placeholder`)}
                    value={(typeof currentAnswer === "string" ? currentAnswer : "") || ""}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="min-h-[100px] resize-y"
                  />
                </div>
              )}
            </>
          )}

          <div className="mt-8 flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              className="gap-1 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("back")}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={goNext}
              disabled={!canProceed() || isSubmitting}
              className="gap-1 rounded-lg"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("calculating")}
                </>
              ) : (
                <>
                  {isLastStep ? t("submit") : t("next")}
                  {!isLastStep && <ChevronRight className="h-4 w-4" />}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
