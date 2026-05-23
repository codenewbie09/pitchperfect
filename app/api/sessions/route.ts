import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scenarios, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateProspectBrief, runProspectTurn } from "@/lib/prospect";

export async function POST(req: NextRequest) {
  const { scenarioId, prospectName } = await req.json();
  if (!scenarioId || !prospectName) {
    return NextResponse.json(
      { error: "scenarioId and prospectName required" },
      { status: 400 },
    );
  }

  const scenario = await db.query.scenarios.findFirst({
    where: eq(scenarios.id, scenarioId),
  });
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  const brief = await generateProspectBrief(
    prospectName,
    scenario.personaDescription,
    scenario.difficulty,
  );

  const [session] = await db
    .insert(sessions)
    .values({
      scenarioId,
      prospectName,
      prospectBrief: brief,
    })
    .returning();

  return NextResponse.json(session);
}

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
  return NextResponse.json(all);
}
