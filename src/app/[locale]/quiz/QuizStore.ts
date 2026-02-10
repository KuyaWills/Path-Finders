const QUIZ_STORAGE_KEY = "pathfinders_quiz";

export type QuizStepAnswer = string | string[];

export interface QuizState {
  step: number;
  answers: Record<number, QuizStepAnswer>;
  completedAt: number | null;
}

const TOTAL_STEPS = 6;

export function getQuizState(): QuizState {
  if (typeof window === "undefined") {
    return { step: 0, answers: {}, completedAt: null };
  }
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return { step: 0, answers: {}, completedAt: null };
    const parsed = JSON.parse(raw) as QuizState;
    return {
      step: Math.min(parsed.step ?? 0, TOTAL_STEPS),
      answers: parsed.answers ?? {},
      completedAt: parsed.completedAt ?? null,
    };
  } catch {
    return { step: 0, answers: {}, completedAt: null };
  }
}

export function saveQuizState(state: QuizState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearQuizState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(QUIZ_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export { TOTAL_STEPS };
