export type AgentStatus = "active" | "booked" | "rejected";

export interface AgentResponse {
  message: string;
  status: AgentStatus;
}

function extractStatus(text: string): AgentStatus {
  if (/"status"\s*:\s*"(booked)"/i.test(text)) return "booked";
  if (/"status"\s*:\s*"(rejected)"/i.test(text)) return "rejected";
  return "active";
}

function extractMessage(text: string): string {
  const match = text.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  return match ? match[1] : text;
}

const GROQ_API_BASE = "https://api.groq.com/openai/v1";

export async function callGroq(
  systemPrompt: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<AgentResponse> {
  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "system", content: systemPrompt }, ...history],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";

  const clean = raw.replace(/```json\n?|```/g, "").trim();

  for (const text of [clean, `{${clean}}`]) {
    try {
      const parsed = JSON.parse(text);
      return {
        message: parsed.message ?? clean,
        status: (["active", "booked", "rejected"].includes(parsed.status)
          ? parsed.status
          : "active") as AgentStatus,
      };
    } catch {
      continue;
    }
  }

  return { message: extractMessage(clean), status: extractStatus(clean) };
}
