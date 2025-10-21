import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { ProfilePageClient } from "./profile-page-client";

async function fetchUserProfile() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  
  const res = await fetch(`${baseUrl}/api/profile`, {
    cache: "no-store",
  });
  
  if (!res.ok) return null;
  return res.json();
}

async function fetchUserStats() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
  
  const res = await fetch(`${baseUrl}/api/profile/stats`, {
    cache: "no-store",
  });
  
  if (!res.ok) return { recipes: 0, sessions: 0, reviews: 0 };
  return res.json();
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Pre-fetch data server-side voor snellere initial load
  const [profile, stats] = await Promise.all([
    fetchUserProfile(),
    fetchUserStats()
  ]);

  return <ProfilePageClient initialProfile={profile} initialStats={stats} />;
}