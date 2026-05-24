import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scenarios, sessions, messages as messagesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const scenario = await db.query.scenarios.findFirst({
    where: eq(scenarios.id, id),
  });
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  const all = await db
    .select()
    .from(sessions)
    .where(eq(sessions.scenarioId, id));

  const completed = all.filter(
    (s) => s.status === "completed" && s.feedback,
  );

  const rows = await Promise.all(
    completed.map(async (s) => {
      const msgs = await db
        .select()
        .from(messagesTable)
        .where(eq(messagesTable.sessionId, s.id));
      const turns = msgs.filter((m) => m.role === "user").length;
      const f = s.feedback as Record<string, unknown> | null;
      const overallScore = f?.overall ?? "";
      const opener = (f?.opener as Record<string, unknown>)?.score ?? "";
      const qualification =
        (f?.qualification as Record<string, unknown>)?.score ?? "";
      const objectionHandling =
        (f?.objectionHandling as Record<string, unknown>)?.score ?? "";
      const closing = (f?.closing as Record<string, unknown>)?.score ?? "";
      const completedAt = s.createdAt?.toISOString?.() ?? "";
      const name = `"${s.prospectName.replace(/"/g, '""')}"`;
      return `${name},${scenario.difficulty},${overallScore},${opener},${qualification},${objectionHandling},${closing},${turns},${completedAt}`;
    }),
  );

  const header = "prospect_name,difficulty,overall_score,opener,qualification,objection_handling,closing,turns,completed_at\n";
  return new NextResponse(header + rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition":
        'attachment; filename="pitchperfect-export.csv"',
    },
  });
}
