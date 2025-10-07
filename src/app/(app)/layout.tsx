import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { LogOut, User, ChefHat, BookOpen, Camera, Plus } from "lucide-react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Navigation */}
      <nav className="bg-coals border-b border-ash">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/app" className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-ember" />
              <span className="text-xl font-heading font-bold text-ash">Stook</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/app"
                className="text-smoke hover:text-ash transition-colors"
              >
                Feed
              </Link>
              <Link
                href="/recipes"
                className="text-smoke hover:text-ash transition-colors"
              >
                Recepten
              </Link>
              <Link
                href="/sessions"
                className="text-smoke hover:text-ash transition-colors"
              >
                Mijn Sessies
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button asChild className="bg-ember hover:bg-ember/90">
                <Link href="/recipes/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuw Recept
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="border-ash text-ash hover:bg-coals">
                <Link href="/import">
                  <Camera className="h-4 w-4 mr-2" />
                  Importeren
                </Link>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
