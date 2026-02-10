import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PROFILE_IDS = ["focused_builder", "broad_explorer", "career_climber", "steady_grower"] as const;
export type AnalyzeProfileId = (typeof PROFILE_IDS)[number];

// Human-readable labels for building the prompt (English)
const LABELS: Record<string, string> = {
  option1_role_junior: "Junior developer",
  option1_role_mid: "Mid-level developer",
  option1_role_senior: "Senior developer",
  option1_role_student: "Student / bootcamp",
  option1_role_other: "Other",
  option2_improve_code: "Code quality",
  option2_improve_system: "System design",
  option2_improve_debug: "Debugging",
  option2_improve_career: "Career growth",
  option2_improve_confidence: "Confidence",
  option3_time_1: "1–2 hours/week",
  option3_time_3: "3–5 hours/week",
  option3_time_5: "5–7 hours/week",
  option3_time_10: "10+ hours/week",
  option3_time_15: "15+ hours/week",
  option4_blocker_time: "Not enough time",
  option4_blocker_focus: "Don't know what to focus on",
  option4_blocker_guidance: "Lack of guidance",
  option4_blocker_opportunity: "No growth opportunities",
  option4_blocker_other: "Other",
  option5_interest_backend: "Backend",
  option5_interest_frontend: "Frontend",
  option5_interest_fullstack: "Full-stack",
  option5_interest_devops: "DevOps / infra",
  option5_interest_data: "Data / ML",
};

function buildAnswersSummary(answers: Record<number, string | string[]>): string {
  const lines: string[] = [];
  const stepLabels = [
    "Current role",
    "Want to improve",
    "Time per week",
    "Biggest blocker",
    "Areas of interest",
    "Career goal (free text)",
  ];
  for (let i = 0; i <= 5; i++) {
    const v = answers[i];
    if (v == null) continue;
    const label = stepLabels[i] ?? `Step ${i + 1}`;
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

function deriveProfileFallback(answers: Record<number, string | string[]>): AnalyzeProfileId {
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

  const apiKey = process.env.NEXT_OPENAI_API_KEY;
  if (!apiKey) {
    const profile = deriveProfileFallback(answers);
    return NextResponse.json({ profile, fallback: true });
  }

  const summary = buildAnswersSummary(answers);

  const systemPrompt = `You are a developer career coach. Based on quiz answers, you must choose exactly ONE developer profile and optionally write a short personalized description.

The four profile types are:
- focused_builder: Invests serious time, wants clear direction and structured path.
- broad_explorer: Curious across many areas, needs help connecting the dots and prioritizing.
- career_climber: Ready to level up; focus on system design, ownership, next role.
- steady_grower: Building consistency; small, sustainable steps and regular check-ins.

Respond with valid JSON only, no markdown. Format: {"profile":"<one of the four ids>","description":"<1-2 sentences personalized, or omit if not needed>"}`;

  const userPrompt = `Quiz answers:\n${summary}\n\nReturn JSON with "profile" (one of: focused_builder, broad_explorer, career_climber, steady_grower) and optional "description".`;

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

  let parsed: { profile?: string; description?: string };
  try {
    parsed = JSON.parse(raw) as { profile?: string; description?: string };
  } catch {
    return NextResponse.json({ error: "Invalid AI response" }, { status: 502 });
  }

  const profile = parsed.profile?.trim();
  if (!profile || !PROFILE_IDS.includes(profile as AnalyzeProfileId)) {
    return NextResponse.json({ error: "Invalid profile from AI" }, { status: 502 });
  }

  const description =
    typeof parsed.description === "string" ? parsed.description.trim() : undefined;

  return NextResponse.json({
    profile: profile as AnalyzeProfileId,
    ...(description && { description }),
  });
}
