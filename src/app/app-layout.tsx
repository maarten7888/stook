import { Navbar } from "@/components/navbar";

interface AppLayoutProps {
  children: React.ReactNode;
  session: {
    user: {
      id: string;
      email?: string;
      user_metadata?: {
        avatar_url?: string;
        display_name?: string;
      };
    };
  };
}

export default function AppLayout({ children, session }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-charcoal">
      <Navbar 
        user={{
          id: session.user.id,
          displayName: session.user.user_metadata?.display_name || session.user.email,
          avatarUrl: session.user.user_metadata?.avatar_url,
        }}
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
