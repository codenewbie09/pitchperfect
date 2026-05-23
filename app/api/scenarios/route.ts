import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { scenarios } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { title, personaDescription, industry, difficulty } = await req.json();
  if (!title || !personaDescription || !industry) {
    return NextResponse.json(
      { error: "title, personaDescription, and industry required" },
      { status: 400 },
    );
  }
  const [scenario] = await db
    .insert(scenarios)
    .values({ title, personaDescription, industry, difficulty: difficulty || "medium" })
    .returning();
  return NextResponse.json(scenario);
}

export async function GET() {
  const all = await db.select().from(scenarios).orderBy(scenarios.createdAt);
  return NextResponse.json(all);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await db.delete(scenarios).where(eq(scenarios.id, id));
  return NextResponse.json({ success: true });
}
