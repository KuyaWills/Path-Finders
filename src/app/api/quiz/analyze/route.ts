import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Human-readable labels for building the prompt (English)
const LABELS: Record<string, string> = {
  debug_console: "Add console.log and narrow it down",
  debug_debugger: "Use the debugger (breakpoints)",
  debug_stack_trace: "Read the stack trace and follow the code path",
  debug_rubber_duck: "Explain to someone or a rubber duck first",
  debug_search_error: "Search the error message and try fixes from the web",
  stuck_google_first: "Google or search for a solution right away",
  stuck_try_then_ask: "Try 30+ minutes on my own, then ask for help",
  stuck_docs_first: "Read official docs or source code first",
  stuck_ask_teammate: "Ask a teammate or mentor for direction",
  stuck_take_break: "Take a break and come back later",
  codebase_dive_in: "Dive in and make small changes to see what happens",
  codebase_readme_first: "Read README and main entry points first",
  codebase_trace_flow: "Trace one user flow or feature end-to-end",
  codebase_ask_walkthrough: "Ask the team for a walkthrough or pairing",
  codebase_own_only: "Rarely; I usually maintain my own code",
  habit_tests: "Write tests for my code",
  habit_code_review: "Do code reviews for others",
  habit_refactor: "Refactor or improve existing code without being asked",
  habit_read_watch: "Read technical blogs or watch talks",
  habit_system_design: "Practice system design or algorithms",
  feedback_fix_move_on: "Fix the comments and move on quickly",
  feedback_note_pattern: "Note the pattern so I don't repeat it",
  feedback_ask_why: "Ask why and discuss tradeoffs with the reviewer",
  feedback_discouraged: "Feel discouraged and put the PR off",
};

const STEP_LABELS = [
  "How they debug",
  "What they do when stuck",
  "How they learn a new codebase",
  "Habits they do regularly",
  "How they handle code review feedback",
  "Career or skill goal (free text)",
];

function buildAnswersSummary(answers: Record<number, string | string[]>): string {
  const lines: string[] = [];
  for (let i = 0; i <= 5; i++) {
    const v = answers[i];
    if (v == null) continue;
    const label = STEP_LABELS[i] ?? `Step ${i + 1}`;
    if (Array.isArray(v)) {
      const text = v.map((k) => LABELS[k] ?? k).join(", ");
      lines.push(`${label}: ${text}`);
    } else {
      const text = typeof v === "string" ? (LABELS[v] ?? v) : String(v);
      lines.push(`${label}: ${text}`);
    }
  }
  return lines.join("\n");
}

/** Fallback when OpenAI is not configured: generic analysis and plan */
function buildFallbackResponse(answers: Record<number, string | string[]>): {
  analysis: string;
  plan: string;
} {
  const goal = typeof answers[5] === "string" ? answers[5] : "";
  return {
    analysis:
      "Your answers show a mix of habits that many developers have. There's always room to level up: using the debugger more, reading docs before searching, tracing one flow when learning a codebase, and treating code review as a learning conversation are habits that separate strong developers.",
    plan: [
      "Practice using the debugger (breakpoints) on your next bug instead of only console.log.",
      "When stuck, try reading the official docs or source for 15 minutes before searching the web.",
      "Next time you join a codebase, trace one user flow or feature end-to-end before making changes.",
      "Do at least one of: write tests, do a code review, or refactor a small area without being asked—each week.",
      "When you get code review feedback, ask the reviewer why they suggested it; turn it into a short discussion.",
      goal ? `Keep your goal in mind: \"${goal.slice(0, 80)}${goal.length > 80 ? "…" : ""}\"—break it into monthly and weekly steps.` : "Set one clear career or skill goal and break it into monthly steps.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

export async function POST(req: Request) {
  let body: { answers?: Record<number, string | string[]> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const answers = body.answers ?? {};
  if (typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "answers must be an object" }, { status: 400 });
  }

  const summary = buildAnswersSummary(answers);
  const apiKey = process.env.NEXT_OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      ...buildFallbackResponse(answers),
      fallback: true,
    });
  }

  const systemPrompt = `You are a developer career coach for junior and experienced developers. You will receive quiz answers about debugging, getting unstuck, learning codebases, habits, and code review.

Your task:
1. **Analysis** (2–4 short paragraphs): Interpret their answers. For each question, note what they chose and—where it makes sense—what a stronger or more effective choice would be and why. Be encouraging, not judgmental. Mention their stated career/skill goal if they gave one. Write in clear, concise English.

2. **Plan** (4–6 actionable steps): Give a concrete improvement plan to become a better programmer/developer. Each step should be specific and doable (e.g. "Use the debugger on your next bug" or "Trace one user flow in the new repo before changing code"). Order by impact. Reference their goal if they shared one.

Respond with valid JSON only, no markdown. Use this exact format:
{"analysis":"<full analysis text>","plan":"<step 1>\\n\\n<step 2>\\n\\n<step 3>\\n\\n..."}
Use \\n\\n to separate plan steps.`;

  const userPrompt = `Quiz answers:\n${summary}\n\nReturn JSON with "analysis" and "plan" as described.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json(
      { error: "Analysis failed: " + err },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { choices?: { 0?: { message?: { content?: string } } } };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
  }

  let parsed: { analysis?: string; plan?: string };
  try {
    parsed = JSON.parse(raw) as { analysis?: string; plan?: string };
  } catch {
    return NextResponse.json({ error: "Invalid AI response" }, { status: 502 });
  }

  const analysis =
    typeof parsed.analysis === "string" ? parsed.analysis.trim() : "";
  const plan = typeof parsed.plan === "string" ? parsed.plan.trim() : "";

  if (!analysis) {
    return NextResponse.json(
      { error: "AI did not return analysis" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    analysis,
    plan: plan || "Focus on one habit at a time: debugging with the debugger, reading docs when stuck, and asking \"why\" in code reviews.",
  });
}
