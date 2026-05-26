import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sessions, messages as messagesTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { runProspectTurn, generateFeedback } from "@/lib/prospect";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { content } = await req.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const practiceSession = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, id), eq(sessions.userId, sessionUser.user.id)),
  });
  if (!practiceSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (practiceSession.status !== "active") {
    return NextResponse.json(
      { error: `Session is already ${practiceSession.status}` },
      { status: 400 },
    );
  }

  await db.insert(messagesTable).values({
    sessionId: id,
    role: "user",
    content,
  });

  let result: { message: string; status: "active" | "completed" };
  try {
    result = await runProspectTurn(id);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  await db.insert(messagesTable).values({
    sessionId: id,
    role: "assistant",
    content: result.message,
  });

  if (result.status !== "active") {
    const history = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.sessionId, id))
      .orderBy(messagesTable.createdAt);

    const feedback = await generateFeedback(history);

    await db
      .update(sessions)
      .set({ status: "completed", feedback })
      .where(eq(sessions.id, id));
  }

  return NextResponse.json(result);
}
