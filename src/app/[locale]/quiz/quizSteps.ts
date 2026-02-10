export type StepType = "single" | "multi" | "freetext";

export interface QuizStepConfig {
  type: StepType;
  translationKey: string; // e.g. "quiz.step1"
  options?: string[]; // for single/multi: option keys step1_option1, step1_option2...
}

export const QUIZ_STEPS: QuizStepConfig[] = [
  {
    type: "single",
    translationKey: "step1",
    options: ["option1_role_junior", "option1_role_mid", "option1_role_senior", "option1_role_student", "option1_role_other"],
  },
  {
    type: "multi",
    translationKey: "step2",
    options: ["option2_improve_code", "option2_improve_system", "option2_improve_debug", "option2_improve_career", "option2_improve_confidence"],
  },
  {
    type: "single",
    translationKey: "step3",
    options: ["option3_time_1", "option3_time_3", "option3_time_5", "option3_time_10", "option3_time_15"],
  },
  {
    type: "single",
    translationKey: "step4",
    options: ["option4_blocker_time", "option4_blocker_focus", "option4_blocker_guidance", "option4_blocker_opportunity", "option4_blocker_other"],
  },
  {
    type: "multi",
    translationKey: "step5",
    options: ["option5_interest_backend", "option5_interest_frontend", "option5_interest_fullstack", "option5_interest_devops", "option5_interest_data"],
  },
  {
    type: "freetext",
    translationKey: "step6",
  },
];
