import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { runAgentTurn } from "@/lib/agent";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId required" },
      { status: 400 },
    );
  }
  const all = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const { conversationId, content } = await req.json();
  if (!conversationId || !content) {
    return NextResponse.json(
      { error: "conversationId and content required" },
      { status: 400 },
    );
  }

  await db.insert(messages).values({
    conversationId,
    role: "user",
    content,
  });

  const agentResult = await runAgentTurn(conversationId);

  return NextResponse.json(agentResult);
}
