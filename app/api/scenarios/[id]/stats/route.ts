import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { scenarios, sessions, messages as messagesTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const scenario = await db.query.scenarios.findFirst({
    where: and(eq(scenarios.id, id), eq(scenarios.userId, session.user.id)),
  });
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  const all = await db
    .select()
    .from(sessions)
    .where(eq(sessions.scenarioId, id));

  const completed = all.filter((s) => s.status === "completed");
  const total = all.length;

  let avgOverallScore = 0;
  let scoreDistribution = {
    opener: 0,
    qualification: 0,
    objectionHandling: 0,
    closing: 0,
  };
  let avgTurns = 0;

  if (completed.length > 0) {
    const scores = completed.map((s) => {
      const f = s.feedback as Record<string, unknown> | null;
      return {
        overall: Number(f?.overall ?? 0),
        opener: Number((f?.opener as Record<string, unknown>)?.score ?? 0),
        qualification: Number(
          (f?.qualification as Record<string, unknown>)?.score ?? 0,
        ),
        objectionHandling: Number(
          (f?.objectionHandling as Record<string, unknown>)?.score ?? 0,
        ),
        closing: Number((f?.closing as Record<string, unknown>)?.score ?? 0),
      };
    });

    avgOverallScore = Math.round(
      scores.reduce((sum, s) => sum + s.overall, 0) / scores.length,
    );

    scoreDistribution = {
      opener: Math.round(
        scores.reduce((sum, s) => sum + s.opener, 0) / scores.length,
      ),
      qualification: Math.round(
        scores.reduce((sum, s) => sum + s.qualification, 0) / scores.length,
      ),
      objectionHandling: Math.round(
        scores.reduce((sum, s) => sum + s.objectionHandling, 0) /
          scores.length,
      ),
      closing: Math.round(
        scores.reduce((sum, s) => sum + s.closing, 0) / scores.length,
      ),
    };
  }

  if (total > 0) {
    const msgCounts = await Promise.all(
      all.map((s) =>
        db
          .select({ count: messagesTable.id })
          .from(messagesTable)
          .where(eq(messagesTable.sessionId, s.id)),
      ),
    );
    avgTurns = Math.round(
      msgCounts.reduce((sum, msgs) => sum + msgs.length, 0) / total,
    );
  }

  let topSession = undefined;
  if (completed.length > 0) {
    const scored = completed
      .map((s) => ({
        sessionId: s.id,
        prospectName: s.prospectName,
        score: Number((s.feedback as Record<string, unknown> | null)?.overall ?? 0),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      topSession = scored[0];
    }
  }

  return NextResponse.json({
    total,
    completed: completed.length,
    completionRate: total ? Math.round((completed.length / total) * 100) / 100 : 0,
    avgOverallScore,
    avgTurns,
    scoreDistribution,
    topSession,
  });
}
