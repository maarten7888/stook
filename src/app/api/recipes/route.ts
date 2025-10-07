import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recipes } from "@/../drizzle/schema";
import { ilike, or, eq, and } from "drizzle-orm";
import { getSession } from "@/lib/supabase/server";

export const runtime = "nodejs";

const QuerySchema = z.object({
  query: z.string().trim().min(1).max(200).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parse = QuerySchema.safeParse({ query: url.searchParams.get("query") ?? undefined });
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const q = parse.data.query;
  const session = await getSession();
  const userId = session?.user.id ?? null;

  try {
    const wherePublic = eq(recipes.visibility, "public");
    const whereOwn = userId ? eq(recipes.userId, userId) : undefined;
    const visibilityFilter = whereOwn ? or(wherePublic, whereOwn) : wherePublic;

    const textFilter = q ? ilike(recipes.title, `%${q}%`) : undefined;
    const combined = textFilter ? and(visibilityFilter, textFilter) : visibilityFilter;

    const rows = await db
      .select({
        id: recipes.id,
        title: recipes.title,
        description: recipes.description,
        visibility: recipes.visibility,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
        userId: recipes.userId,
      })
      .from(recipes)
      .where(combined)
      .orderBy(recipes.createdAt);

    return NextResponse.json({ items: rows });
  } catch (err) {
    console.error("GET /api/recipes failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  serves: z.number().int().min(1).max(50).optional(),
  prepMinutes: z.number().int().min(0).max(24 * 60).optional(),
  cookMinutes: z.number().int().min(0).max(48 * 60).optional(),
  targetInternalTemp: z.number().int().min(0).max(200).optional(),
  visibility: z.enum(["private", "public"]).optional().default("private"),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const values = {
      userId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      serves: parsed.data.serves ?? null,
      prepMinutes: parsed.data.prepMinutes ?? null,
      cookMinutes: parsed.data.cookMinutes ?? null,
      targetInternalTemp: parsed.data.targetInternalTemp ?? null,
      visibility: parsed.data.visibility,
    } as const;

    const [row] = await db.insert(recipes).values(values).returning({ id: recipes.id });
    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/recipes failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


