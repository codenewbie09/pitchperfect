import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, messages as messagesTable, scenarios } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// Public endpoint — no auth required. Only returns data for completed sessions.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, id),
    with: { scenario: true },
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.sessionId, id))
    .orderBy(messagesTable.createdAt);

  return NextResponse.json({
    session: {
      id: session.id,
      prospectName: session.prospectName,
      prospectBrief: session.prospectBrief,
      status: session.status,
      feedback: session.feedback,
      createdAt: session.createdAt,
    },
    scenario: {
      personaDescription: session.scenario.personaDescription,
      difficulty: session.scenario.difficulty,
    },
    messages: msgs,
  });
}
