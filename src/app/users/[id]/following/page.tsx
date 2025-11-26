import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserList } from "@/components/user-list";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

async function fetchUserProfile(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

async function fetchInitialFollowing(userId: string) {
  try {
    const adminSupabase = createAdminClient();

    const { data: follows, error: followsError } = await adminSupabase
      .from('user_follows')
      .select(`
        id,
        following_id,
        created_at,
        profiles!user_follows_following_id_fkey(
          id,
          display_name,
          bio,
          avatar_url,
          location,
          bbq_style,
          experience_level
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (followsError || !follows) {
      return [];
    }

    return follows.map((follow) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = follow.profiles as any;
      return {
        id: follow.following_id,
        displayName: profile?.display_name || null,
        bio: profile?.bio || null,
        avatarUrl: profile?.avatar_url || null,
        location: profile?.location || null,
        bbqStyle: profile?.bbq_style || null,
        experienceLevel: profile?.experience_level || null,
        followedAt: follow.created_at,
      };
    });
  } catch (error) {
    console.error("Error fetching following:", error);
    return [];
  }
}

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [profile, initialFollowing] = await Promise.all([
    fetchUserProfile(id),
    fetchInitialFollowing(id),
  ]);

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/users/${id}`}
          className="text-smoke hover:text-ember transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-heading font-bold text-ash">
          {profile.display_name || "Gebruiker"} volgt
        </h1>
      </div>

      <Card className="bg-coals border-ash">
        <CardHeader>
          <CardTitle className="text-ash">Volgend</CardTitle>
        </CardHeader>
        <CardContent>
          <UserList userId={id} type="following" initialUsers={initialFollowing} />
        </CardContent>
      </Card>
    </div>
  );
}

