import { db } from "@/db";
import { sessions, messages as messagesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

const GROQ_API_BASE = "https://api.groq.com/openai/v1";

async function callGroq(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
): Promise<string> {
  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.7,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";
  return raw.replace(/```json\n?|```/g, "").trim();
}

function extractJSON(text: string): Record<string, unknown> {
  for (const candidate of [text, `{${text}}`]) {
    try {
      return JSON.parse(candidate) as Record<string, unknown>;
    } catch {
      continue;
    }
  }
  const msgMatch = text.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const statusMatch = text.match(/"status"\s*:\s*"(active|completed)"/);
  if (msgMatch) {
    return {
      message: msgMatch[1],
      status: statusMatch?.[1] ?? "active",
    };
  }
  return { message: text.replace(/```[\s\S]*?```/g, "").trim(), status: "active" };
}

export async function generateProspectBrief(
  prospectName: string,
  personaDescription: string,
  difficulty: string,
): Promise<{
  company: string;
  role: string;
  painPoints: string[];
  triggerEvent: string;
  personality: string;
}> {
  const prompt = `You are a sales intelligence researcher. Generate a realistic prospect brief.

Prospect name: ${prospectName}
Persona: ${personaDescription}
Difficulty level: ${difficulty}

${
  difficulty === "easy"
    ? "The prospect is enthusiastic, has obvious pain, and gives clear buying signals."
    : difficulty === "hard"
      ? "The prospect is skeptical, challenges claims, and needs significant convincing."
      : "The prospect is neutral, asks thoughtful questions, and needs moderate qualification."
}

Return ONLY valid JSON:
{
  "company": "realistic company name",
  "role": "job title",
  "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
  "triggerEvent": "a recent event that prompted their interest",
  "personality": "brief personality description"
}`;

  const raw = await callGroq([
    { role: "system", content: prompt },
    { role: "user", content: "Generate the brief." },
  ]);

  const result = extractJSON(raw);
  return {
    company: String(result.company || ""),
    role: String(result.role || ""),
    painPoints: Array.isArray(result.painPoints)
      ? result.painPoints.map(String)
      : [],
    triggerEvent: String(result.triggerEvent || ""),
    personality: String(result.personality || ""),
  };
}

export async function runProspectTurn(
  sessionId: string,
): Promise<{ message: string; status: "active" | "completed" }> {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: { scenario: true, messages: true },
  });

  if (!session) throw new Error("Session not found");
  if (session.status !== "active") {
    throw new Error(`Session is already ${session.status}`);
  }

  const history = [...session.messages].sort(
    (a, b) =>
      new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
  );

  const brief = session.prospectBrief as Record<string, unknown> | null;
  const difficulty = session.scenario.difficulty;

  const systemPrompt = `You are ${session.prospectName}, a prospect in a sales conversation.

Your role: ${String(brief?.role || "prospect")}
Your company: ${String(brief?.company || "unknown")}
Your pain points: ${String((brief?.painPoints as string[])?.join(", ") || "various challenges")}
Recent trigger: ${String(brief?.triggerEvent || "none")}
Your personality: ${String(brief?.personality || "professional and direct")}
Difficulty: ${difficulty}

Rules:
- Stay in character as the prospect at all times.
- Respond naturally based on your personality and pain points.
- Do NOT volunteer information unless the SDR asks good questions.
- Never break character or mention being an AI.
- Keep responses to 1-3 sentences. Sound like a real person.
- Never ask the SDR questions about their personal life.

${
  difficulty === "easy"
    ? "Be cooperative and open. Give clear buying signals when the SDR asks good questions."
    : difficulty === "hard"
      ? "Be skeptical. Challenge claims about their product. Raise objections about pricing, competitors, and timing."
      : "Be neutral but engaged. Ask thoughtful follow-up questions. Respond positively to good qualification."
}

If the SDR successfully qualifies you and you would realistically book a meeting → status "completed".
If the SDR is pushy or you would realistically walk away → status "completed".
Otherwise → status "active".

You MUST respond with ONLY a raw JSON object. No markdown. No backticks. No explanation. No extra text before or after.

Example:
{"message": "your response here", "status": "active"}`;

  const msgs: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  for (const m of history) {
    msgs.push({ role: m.role as "user" | "assistant", content: m.content });
  }

  const raw = await callGroq(msgs);
  const result = extractJSON(raw);

  let status: "active" | "completed" =
    result.status === "completed" ? "completed" : "active";

  // Server-side completion override
  // Small models rarely set status to "completed" on their own
  const userMessages = history.filter((m) => m.role === "user");
  const closingSignals = [
    "schedule", "meeting", "call", "demo", "chat", "thursday", "friday",
    "next week", "calendar", "book", "set up a time",
  ];
  const sdrClosing = userMessages.some((m) =>
    closingSignals.some((s) => m.content.toLowerCase().includes(s)),
  );

  if (status === "active" && userMessages.length >= 2 && sdrClosing) {
    status = "completed";
  }

  return {
    message: String(result.message || ""),
    status,
  };
}

export async function generateFeedback(
  history: { role: string; content: string }[],
): Promise<{
  opener: { score: number; feedback: string };
  qualification: { score: number; feedback: string };
  objectionHandling: { score: number; feedback: string };
  closing: { score: number; feedback: string };
  overall: number;
  notes: string;
}> {
  const transcript = history
    .map((m) => `${m.role === "user" ? "SDR" : "Prospect"}: ${m.content}`)
    .join("\n");

  const prompt = `You are a sales coach evaluating an SDR in a roleplay.

Rate each 1-10:
1. OPENER — personalized, concise, sparked interest?
2. QUALIFICATION — uncovered pain, budget, authority, timeline?
3. OBJECTION HANDLING — handled objections smoothly?
4. CLOSING — asked for meeting at the right time?

Conversation:
${transcript}

Return ONLY valid JSON:
{
  "opener": {"score": 7, "feedback": "one line"},
  "qualification": {"score": 7, "feedback": "one line"},
  "objectionHandling": {"score": 7, "feedback": "one line"},
  "closing": {"score": 7, "feedback": "one line"},
  "overall": 7,
  "notes": "summary of strengths and gaps"
}`;

  const raw = await callGroq([
    { role: "system", content: prompt },
    { role: "user", content: "Evaluate this conversation." },
  ]);

  const result = extractJSON(raw);

  const parseScore = (obj: unknown): { score: number; feedback: string } => {
    const o = obj as Record<string, unknown> | undefined;
    return {
      score: Number(o?.score ?? 5),
      feedback: String(o?.feedback ?? ""),
    };
  };

  return {
    opener: parseScore(result.opener),
    qualification: parseScore(result.qualification),
    objectionHandling: parseScore(result.objectionHandling),
    closing: parseScore(result.closing),
    overall: Number(result.overall ?? 5),
    notes: String(result.notes ?? ""),
  };
}
