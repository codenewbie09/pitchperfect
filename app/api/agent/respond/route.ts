import { NextRequest, NextResponse } from "next/server";
import { runAgentTurn } from "@/lib/agent";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conversationId } = body;

  if (!conversationId || typeof conversationId !== "string") {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 },
    );
  }

  try {
    const result = await runAgentTurn(conversationId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[agent/respond]", message);
    const status = message.startsWith("Conversation is already") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
