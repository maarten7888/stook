import { ChefHat } from "lucide-react";
import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-charcoal">
      {/* Navigation */}
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
                href="/login"
                className="text-smoke hover:text-ash transition-colors"
              >
                Inloggen
              </Link>
              <Link
                href="/register"
                className="bg-ember hover:bg-ember/90 text-white px-4 py-2 rounded-md transition-colors"
              >
                Registreren
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
