import { redirect } from "next/navigation";
import { getSession, createAdminClient } from "@/lib/supabase/server";
import { ProfilePageClient } from "./profile-page-client";

async function fetchUserProfile(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return null;
    }

    return {
      id: profile.id,
      display_name: profile.display_name,
      favorite_meat: profile.favorite_meat,
      bbq_style: profile.bbq_style,
      experience_level: profile.experience_level,
      favorite_wood: profile.favorite_wood,
      bio: profile.bio,
      location: profile.location,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
    };
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    return null;
  }
}

async function fetchUserStats(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    // Get recipe count
    const { count: recipeCount } = await adminSupabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get session count
    const { count: sessionCount } = await adminSupabase
      .from('cook_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get review count
    const { count: reviewCount } = await adminSupabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      recipes: recipeCount || 0,
      sessions: sessionCount || 0,
      reviews: reviewCount || 0,
    };
  } catch (error) {
    console.error("Error in fetchUserStats:", error);
    return { recipes: 0, sessions: 0, reviews: 0 };
  }
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;

  // Pre-fetch data server-side voor snellere initial load
  const [profile, stats] = await Promise.all([
    fetchUserProfile(userId),
    fetchUserStats(userId)
  ]);

  return <ProfilePageClient initialProfile={profile} initialStats={stats} />;
}
