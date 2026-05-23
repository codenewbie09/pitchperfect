import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { callOpenRouter } from "./openrouter";

function buildSystemPrompt(
  personaDescription: string,
  prospectName: string,
): string {
  return `You are an AI SDR (Sales Development Representative) running LinkedIn outreach for Leadwire.

Target persona: ${personaDescription}
Prospect name: ${prospectName}

Your goals in order:
1. Send a short, personalized opener. No pitch yet.
2. Ask one relevant question to understand their situation.
3. Qualify within 3 messages: learn their role, team size, and pain points.
4. If they are a fit, propose a 15-minute discovery call.
5. If not a fit, politely disengage.

Rules:
- Write like a real LinkedIn DM. 1-3 sentences max. No buzzwords.
- Never say "I hope this finds you well" or anything robotic.
- Ask only ONE question per message.
- Do not pitch until you have qualified them.
- Qualify within 3 messages max — do not keep asking new questions once pain is clear.
- If the prospect confirms ANY specific time, day, or says yes to a meeting
  (e.g. "yeah", "sure", "tomorrow 9am", "ok", "sounds good", "let's do it") →
  set status to "booked" IMMEDIATELY. Do not wait for further confirmation.
- Once a time or day is mentioned by the prospect, your FINAL message must be
  a brief confirmation and your status MUST be "booked". Send no more messages after booking.
- If they say not interested, "no", "not now", or are clearly unqualified →
  set status to "rejected".
- When in doubt between "active" and "booked" → choose "booked".

You MUST respond with ONLY valid JSON. No markdown. No extra text. No explanation outside the JSON.

{
  "message": "your DM here",
  "status": "active" | "booked" | "rejected",
  "reasoning": "one-line internal note"
}`;
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

  const result = await callOpenRouter(systemPrompt, formattedHistory);

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
