import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
  
  try {
    // Get user session like in profile API
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const userId = user?.id ?? null;

    // For public recipes, use Supabase directly for better compatibility
    if (visibility === "public") {
      const publicSupabase = await createClient();

      let query = publicSupabase
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

    // For private/all recipes, use Supabase Admin Client
    const adminSupabase = createAdminClient();
    
    let query = adminSupabase
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
      `);

    if (visibility === "private") {
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      query = query.eq('user_id', userId);
    } else { // "all"
      if (userId) {
        query = query.or(`visibility.eq.public,user_id.eq.${userId}`);
      } else {
        query = query.eq('visibility', 'public');
      }
    }

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
  try {
    // Get user session like in profile API
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = CreateSchema.safeParse(json ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('recipes')
      .insert({
        user_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        serves: parsed.data.serves ?? null,
        prep_minutes: parsed.data.prepMinutes ?? null,
        cook_minutes: parsed.data.cookMinutes ?? null,
        target_internal_temp: parsed.data.targetInternalTemp ?? null,
        visibility: parsed.data.visibility,
      })
      .select('id')
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Revalidate the recipes pages to show the new recipe
    revalidatePath("/recipes");
    revalidatePath("/");

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/recipes failed", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}