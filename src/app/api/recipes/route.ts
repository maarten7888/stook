import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { recipes, profiles } from "@/../drizzle/schema";
import { ilike, or, eq, and } from "drizzle-orm";
import { getSession } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Type for Supabase response with profiles join
type SupabaseRecipeWithProfile = {
  id: string;
  title: string;
  description: string | null;
  serves: number | null;
  prep_minutes: number | null;
  cook_minutes: number | null;
  target_internal_temp: number | null;
  visibility: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  profiles: {
    display_name: string | null;
  }[] | {
    display_name: string | null;
  } | null;
};

export const runtime = "nodejs";

const QuerySchema = z.object({
  query: z.string().trim().min(1).max(200).optional(),
  visibility: z.enum(["public", "private", "all"]).optional().default("all"),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parse = QuerySchema.safeParse({ 
    query: url.searchParams.get("query") ?? undefined,
    visibility: url.searchParams.get("visibility") ?? undefined,
  });
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { query: q, visibility } = parse.data;
  const session = await getSession();
  const userId = session?.user.id ?? null;

  try {
    // For public recipes, use Supabase directly for better compatibility
    if (visibility === "public") {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let query = supabase
        .from('recipes')
        .select(`
          id,
          title,
          description,
          serves,
          prep_minutes,
          cook_minutes,
          target_internal_temp,
          visibility,
          created_at,
          updated_at,
          user_id,
          profiles(display_name)
        `)
        .eq('visibility', 'public');

      if (q) {
        query = query.ilike('title', `%${q}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase query error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      const items = data?.map((row: SupabaseRecipeWithProfile) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        serves: row.serves,
        prepMinutes: row.prep_minutes,
        cookMinutes: row.cook_minutes,
        targetInternalTemp: row.target_internal_temp,
        visibility: row.visibility,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userId: row.user_id,
        user: {
          displayName: (() => {
            if (!row.profiles) return null;
            if (Array.isArray(row.profiles)) {
              return row.profiles[0]?.display_name || null;
            }
            return row.profiles.display_name || null;
          })(),
        },
      })) || [];

      return NextResponse.json({ items });
    }

    // For private/all recipes, use Drizzle with proper authentication
    let visibilityFilter;
    
    if (visibility === "private") {
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      visibilityFilter = eq(recipes.userId, userId);
    } else { // "all"
      const wherePublic = eq(recipes.visibility, "public");
      const whereOwn = userId ? eq(recipes.userId, userId) : undefined;
      visibilityFilter = whereOwn ? or(wherePublic, whereOwn) : wherePublic;
    }

    const textFilter = q ? ilike(recipes.title, `%${q}%`) : undefined;
    const combined = textFilter ? and(visibilityFilter, textFilter) : visibilityFilter;

    console.log("Querying recipes with Drizzle:", { visibility, q, userId });

    const rows = await db
      .select({
        id: recipes.id,
        title: recipes.title,
        description: recipes.description,
        serves: recipes.serves,
        prepMinutes: recipes.prepMinutes,
        cookMinutes: recipes.cookMinutes,
        targetInternalTemp: recipes.targetInternalTemp,
        visibility: recipes.visibility,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
        userId: recipes.userId,
        user: {
          displayName: profiles.displayName,
        },
      })
      .from(recipes)
      .leftJoin(profiles, eq(recipes.userId, profiles.id))
      .where(combined)
      .orderBy(recipes.createdAt);

    console.log("Found recipes:", rows.length);
    return NextResponse.json({ items: rows });
  } catch (err) {
    console.error("GET /api/recipes failed", err);
    return NextResponse.json({ 
      error: "Server error", 
      details: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    }, { status: 500 });
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


