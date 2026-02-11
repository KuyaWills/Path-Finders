const QUIZ_STORAGE_KEY = "pathfinders_quiz";

export type QuizStepAnswer = string | string[];

export interface QuizState {
  step: number;
  answers: Record<number, QuizStepAnswer>;
  completedAt: number | null;
}

/** Stored shape includes userId so we can clear when user changes */
interface StoredQuizState extends QuizState {
  userId?: string;
}

const TOTAL_STEPS = 6;

export const emptyState: QuizState = { step: 0, answers: {}, completedAt: null };

/**
 * Get quiz state for the current user. If stored state belongs to a different user,
 * clears it and returns empty state.
 */
export function getQuizState(userId: string | null): QuizState {
  if (typeof window === "undefined") return emptyState;
  if (!userId) return emptyState;
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as StoredQuizState;
    if (parsed.userId && parsed.userId !== userId) {
      localStorage.removeItem(QUIZ_STORAGE_KEY);
      return emptyState;
    }
    return {
      step: Math.min(parsed.step ?? 0, TOTAL_STEPS),
      answers: parsed.answers ?? {},
      completedAt: parsed.completedAt ?? null,
    };
  } catch {
    return emptyState;
  }
}

export function saveQuizState(state: QuizState, userId: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored: StoredQuizState = { ...state, userId };
    localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(stored));
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
