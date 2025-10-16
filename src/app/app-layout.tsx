import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { LogOut, User, BookOpen, Camera, Plus, Clock, Home, FileText, Download } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  session: {
    user: {
      email?: string;
      user_metadata?: {
        avatar_url?: string;
      };
    };
  };
}

export default function AppLayout({ children, session }: AppLayoutProps) {

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Navigation */}
      <nav className="bg-coals border-b border-ash">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <img 
                src="/images/logo.png" 
                alt="Stook Logo" 
                className="h-8 w-8"
              />
              <span className="text-xl font-heading font-bold text-ash">Stook</span>
            </Link>

            {/* Navigation Links - Hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link
                href="/"
                className="flex items-center gap-2 text-smoke hover:text-ash transition-colors"
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link
                href="/recipes?visibility=public"
                className="flex items-center gap-2 text-smoke hover:text-ash transition-colors"
              >
                <BookOpen className="h-4 w-4" />
                Recepten
              </Link>
              <Link
                href="/recipes?visibility=private"
                className="flex items-center gap-2 text-smoke hover:text-ash transition-colors"
              >
                <FileText className="h-4 w-4" />
                Mijn Recepten
              </Link>
              <Link
                href="/sessions"
                className="flex items-center gap-2 text-smoke hover:text-ash transition-colors"
              >
                <Clock className="h-4 w-4" />
                Mijn Sessies
              </Link>
              <Link
                href="/import"
                className="flex items-center gap-2 text-smoke hover:text-ash transition-colors"
              >
                <Download className="h-4 w-4" />
                Importeren
              </Link>
            </div>

            {/* Actions - Responsive */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Nieuw Recept knop - Desktop */}
              <Button asChild size="sm" className="bg-ember hover:bg-ember/90 hidden sm:flex">
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nieuw Recept</span>
                </Link>
              </Button>
              
              {/* Nieuw Recept knop - Mobile */}
              <Button asChild size="sm" className="bg-ember hover:bg-ember/90 sm:hidden">
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-ember text-white">
                        {session.user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-coals border-ash" align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profiel</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/recipes" className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span>Mijn Recepten</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/sessions" className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      <span>Mijn Sessies</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <form action="/auth/logout" method="post" className="w-full">
                      <button type="submit" className="flex items-center w-full text-left">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Uitloggen</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
