import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, messages as messagesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { runProspectTurn, generateFeedback } from "@/lib/prospect";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { content } = await req.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, id),
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.status !== "active") {
    return NextResponse.json(
      { error: `Session is already ${session.status}` },
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
