import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { scenarios } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, personaDescription, industry, difficulty } = await req.json();
  if (!title || !personaDescription || !industry) {
    return NextResponse.json(
      { error: "title, personaDescription, and industry required" },
      { status: 400 },
    );
  }
  const [scenario] = await db
    .insert(scenarios)
    .values({
      userId: session.user.id,
      title,
      personaDescription,
      industry,
      difficulty: difficulty || "medium",
    })
    .returning();
  return NextResponse.json(scenario);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = await db
    .select()
    .from(scenarios)
    .where(eq(scenarios.userId, session.user.id))
    .orderBy(sql`${scenarios.createdAt} DESC`);
  return NextResponse.json(all);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // Ensure the scenario belongs to this user
  await db
    .delete(scenarios)
    .where(and(eq(scenarios.id, id), eq(scenarios.userId, session.user.id)));
  return NextResponse.json({ success: true });
}
