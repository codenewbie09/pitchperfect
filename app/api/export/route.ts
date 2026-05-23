import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scenarioId = searchParams.get("scenarioId");
  if (!scenarioId) {
    return NextResponse.json({ error: "scenarioId required" }, { status: 400 });
  }

  const all = await db
    .select()
    .from(sessions)
    .where(eq(sessions.scenarioId, scenarioId))
    .orderBy(sessions.createdAt);

  const header = "Prospect Name,Status,Turns,Booked Date,Summary\n";
  const rows = all
    .map((s) => {
      const feedback = s.feedback as Record<string, unknown> | null;
      const summary = feedback?.notes
        ? `"${String(feedback.notes).replace(/"/g, '""')}"`
        : "";
      return `${s.prospectName},${s.status},,${s.createdAt?.toISOString?.() || ""},${summary}`;
    })
    .join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=sessions.csv",
    },
  });
}
