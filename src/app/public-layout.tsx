import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChefHat } from "lucide-react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-charcoal">
      {/* Navigation for non-authenticated users */}
      <nav className="bg-coals border-b border-ash">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-ember" />
              <span className="text-xl font-heading font-bold text-ash">Stook</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-smoke hover:text-ash transition-colors"
              >
                Home
              </Link>
              <Link
                href="/recipes"
                className="text-smoke hover:text-ash transition-colors"
              >
                Recepten
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline" className="border-ash text-ash hover:bg-coals">
                <Link href="/login">Inloggen</Link>
              </Button>
              <Button asChild className="bg-ember hover:bg-ember/90 text-white">
                <Link href="/register">Registreren</Link>
              </Button>
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
