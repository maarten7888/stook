import { getSession } from "@/lib/supabase/server";
import AppLayout from "./app-layout";
import "./globals.css";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="nl">
      <body className="font-sans antialiased">
        {session ? (
          <AppLayout session={session}>{children}</AppLayout>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
