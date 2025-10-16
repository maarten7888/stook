"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Home, BookOpen, FileText, Clock, Download, Plus } from "lucide-react";

interface MobileMenuProps {
  session?: {
    user: {
      email?: string;
      user_metadata?: {
        avatar_url?: string;
      };
    };
  };
}

export default function MobileMenu({ session }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMenu}
        className="lg:hidden text-smoke hover:text-ash"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={toggleMenu} />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-coals border-l border-ash shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-ash">
                <span className="text-lg font-heading font-bold text-ash">Menu</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMenu}
                  className="text-smoke hover:text-ash"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 p-4 space-y-2">
                <Link
                  href="/"
                  onClick={toggleMenu}
                  className="flex items-center gap-3 p-3 text-smoke hover:text-ash hover:bg-charcoal/50 rounded-lg transition-colors"
                >
                  <Home className="h-5 w-5" />
                  Home
                </Link>

                <Link
                  href="/recipes?visibility=public"
                  onClick={toggleMenu}
                  className="flex items-center gap-3 p-3 text-smoke hover:text-ash hover:bg-charcoal/50 rounded-lg transition-colors"
                >
                  <BookOpen className="h-5 w-5" />
                  Recepten
                </Link>

                {session && (
                  <>
                    <Link
                      href="/recipes?visibility=private"
                      onClick={toggleMenu}
                      className="flex items-center gap-3 p-3 text-smoke hover:text-ash hover:bg-charcoal/50 rounded-lg transition-colors"
                    >
                      <FileText className="h-5 w-5" />
                      Mijn Recepten
                    </Link>

                    <Link
                      href="/sessions"
                      onClick={toggleMenu}
                      className="flex items-center gap-3 p-3 text-smoke hover:text-ash hover:bg-charcoal/50 rounded-lg transition-colors"
                    >
                      <Clock className="h-5 w-5" />
                      Mijn Sessies
                    </Link>

                    <Link
                      href="/import"
                      onClick={toggleMenu}
                      className="flex items-center gap-3 p-3 text-smoke hover:text-ash hover:bg-charcoal/50 rounded-lg transition-colors"
                    >
                      <Download className="h-5 w-5" />
                      Importeren
                    </Link>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-ash space-y-3">
                {session ? (
                  <>
                    <Button asChild className="w-full bg-ember hover:bg-ember/90">
                      <Link href="/recipes/new" onClick={toggleMenu}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nieuw Recept
                      </Link>
                    </Button>
                    <Link
                      href="/profile"
                      onClick={toggleMenu}
                      className="block w-full p-3 text-sm text-smoke hover:text-ash hover:bg-charcoal/50 rounded-lg transition-colors"
                    >
                      Profiel
                    </Link>
                  </>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full border-ash text-ash hover:bg-coals">
                      <Link href="/login" onClick={toggleMenu}>Inloggen</Link>
                    </Button>
                    <Button asChild className="w-full bg-ember hover:bg-ember/90 text-white">
                      <Link href="/register" onClick={toggleMenu}>Registreren</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
