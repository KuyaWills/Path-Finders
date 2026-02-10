export type StepType = "single" | "multi" | "freetext";

export interface QuizStepConfig {
  type: StepType;
  translationKey: string; // e.g. "quiz.step1"
  options?: string[]; // for single/multi: option keys step1_option1, step1_option2...
}

/**
 * Quiz steps designed for junior and experienced developers.
 * Choices are analyzable so the AI can compare user answers to stronger practices
 * and produce an improvement plan.
 */
export const QUIZ_STEPS: QuizStepConfig[] = [
  {
    type: "single",
    translationKey: "step1",
    options: [
      "debug_console",
      "debug_debugger",
      "debug_stack_trace",
      "debug_rubber_duck",
      "debug_search_error",
    ],
  },
  {
    type: "single",
    translationKey: "step2",
    options: [
      "stuck_google_first",
      "stuck_try_then_ask",
      "stuck_docs_first",
      "stuck_ask_teammate",
      "stuck_take_break",
    ],
  },
  {
    type: "single",
    translationKey: "step3",
    options: [
      "codebase_dive_in",
      "codebase_readme_first",
      "codebase_trace_flow",
      "codebase_ask_walkthrough",
      "codebase_own_only",
    ],
  },
  {
    type: "multi",
    translationKey: "step4",
    options: [
      "habit_tests",
      "habit_code_review",
      "habit_refactor",
      "habit_read_watch",
      "habit_system_design",
    ],
  },
  {
    type: "single",
    translationKey: "step5",
    options: [
      "feedback_fix_move_on",
      "feedback_note_pattern",
      "feedback_ask_why",
      "feedback_discouraged",
    ],
  },
  {
    type: "freetext",
    translationKey: "step6",
  },
];
