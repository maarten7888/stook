import { getSession } from "@/lib/supabase/server";
import AppLayout from "./app-layout";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // If user is logged in, use the app layout
  if (session) {
    return <AppLayout>{children}</AppLayout>;
  }

  // If user is not logged in, use the marketing layout
  return (
    <html lang="nl">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
