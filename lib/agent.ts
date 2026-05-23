import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { callGroq } from "./openrouter";

// Keywords that mean the prospect has agreed to a meeting
const BOOKING_SIGNALS = [
  "yes", "yeah", "yep", "yup", "sure", "ok", "okay", "sounds good",
  "let's do it", "lets do it", "confirm", "confirmed", "i'm in", "im in",
  "works for me", "that works", "perfect", "great", "awesome", "done",
  "tomorrow", "monday", "tuesday", "wednesday", "thursday", "friday",
  "next week", "morning", "afternoon", "evening", "am", "pm",
];

function hasBookingSignal(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return BOOKING_SIGNALS.some((signal) => lower.includes(signal));
}

function buildSystemPrompt(
  personaDescription: string,
  prospectName: string,
): string {
  return `You are an AI SDR running LinkedIn outreach for Leadwire.

Target persona: ${personaDescription}
Prospect name: ${prospectName}

GOALS:
1. Send a short personalized opener. No pitch yet.
2. Ask ONE question to understand their situation.
3. Qualify in max 3 messages: role, team size, pain points.
4. Propose a 15-minute call once pain is clear.
5. Disengage politely if not a fit.

STRICT RULES:
- Max 2 sentences per message. No buzzwords. Write like a human.
- Ask only ONE question per message.
- BOOKING: If the prospect says yes, ok, sure, gives a time or day, or any positive response to a meeting → you MUST set status to "booked". This is non-negotiable.
- REJECTION: If they say no, not interested, or are clearly not a fit → set status to "rejected".
- Once booked, send one short confirmation message and stop. Do not ask more questions.

OUTPUT FORMAT — respond with ONLY this JSON, nothing else:
{"message":"your message here","status":"active","reasoning":"why"}

Replace "active" with "booked" or "rejected" when appropriate.
Do NOT wrap in markdown. Do NOT add any text before or after the JSON.`;
}

export async function runAgentTurn(conversationId: string) {
  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
    with: { campaign: true },
  });

  if (!conversation) throw new Error("Conversation not found");
  if (conversation.status !== "active") {
    throw new Error(`Conversation is already ${conversation.status}`);
  }

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  const systemPrompt = buildSystemPrompt(
    conversation.campaign.personaDescription,
    conversation.prospectName,
  );

  const formattedHistory = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const result = await callGroq(systemPrompt, formattedHistory);

  // First message is always the opener — never book/reject on first turn
  if (history.length === 0) {
    result.status = "active";
  }

  // --- Server-side booking override ---
  // Small free models often ignore the status rule.
  // If the agent has already proposed a meeting (check last assistant message)
  // and the prospect's last message contains a booking signal → force "booked".
  const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
  const agentHasProposed = history.some(
    (m) =>
      m.role === "assistant" &&
      (m.content.toLowerCase().includes("15-minute") ||
        m.content.toLowerCase().includes("15 minute") ||
        m.content.toLowerCase().includes("discovery call") ||
        m.content.toLowerCase().includes("quick call") ||
        m.content.toLowerCase().includes("schedule") ||
        m.content.toLowerCase().includes("availability") ||
        m.content.toLowerCase().includes("calendar")),
  );

  if (
    result.status === "active" &&
    agentHasProposed &&
    lastUserMessage &&
    hasBookingSignal(lastUserMessage.content)
  ) {
    result.status = "booked";
    result.message = `Perfect, ${conversation.prospectName}! You're all booked. I'll send a calendar invite shortly. Looking forward to it.`;
  }
  // ------------------------------------

  await db.insert(messages).values({
    conversationId,
    role: "assistant",
    content: result.message,
  });

  if (result.status !== "active") {
    await db
      .update(conversations)
      .set({ status: result.status })
      .where(eq(conversations.id, conversationId));
  }

  return result;
}
