import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { ProfilePageClient } from "./profile-page-client";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <ProfilePageClient />;
}