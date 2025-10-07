import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

export default async function RootPage() {
  const session = await getSession();
  
  if (session) {
    redirect("/app");
  } else {
    // Show marketing page directly instead of redirecting
    const MarketingPage = (await import("./marketing/page")).default;
    return <MarketingPage />;
  }
}
