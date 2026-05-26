import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { scenarios, sessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateProspectBrief } from "@/lib/prospect";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scenarioId, prospectName } = await req.json();
  if (!scenarioId || !prospectName) {
    return NextResponse.json(
      { error: "scenarioId and prospectName required" },
      { status: 400 },
    );
  }

  const scenario = await db.query.scenarios.findFirst({
    where: and(eq(scenarios.id, scenarioId), eq(scenarios.userId, session.user.id)),
  });
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  const brief = await generateProspectBrief(
    prospectName,
    scenario.personaDescription,
    scenario.difficulty,
  );

  const [newSession] = await db
    .insert(sessions)
    .values({
      userId: session.user.id,
      scenarioId,
      prospectName,
      prospectBrief: brief,
    })
    .returning();

  return NextResponse.json(newSession);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const scenarioId = searchParams.get("scenarioId");
  if (!scenarioId) {
    return NextResponse.json({ error: "scenarioId required" }, { status: 400 });
  }

  // Verify scenario belongs to user
  const scenario = await db.query.scenarios.findFirst({
    where: and(eq(scenarios.id, scenarioId), eq(scenarios.userId, session.user.id)),
  });
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
  }

  const all = await db
    .select()
    .from(sessions)
    .where(eq(sessions.scenarioId, scenarioId))
    .orderBy(sessions.createdAt);
  return NextResponse.json(all);
}
