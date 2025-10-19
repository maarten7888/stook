"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Plus, Download, ChefHat, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: {
    id: string;
    displayName?: string;
    avatarUrl?: string;
  } | null;
  className?: string;
}

export function Navbar({ user, className }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Recepten", href: "/recipes", icon: ChefHat },
    { name: "Sessies", href: "/sessions", icon: ChefHat },
  ];

  const userActions = [
    { name: "Nieuw Recept", href: "/recipes/new", icon: Plus },
    { name: "Importeren", href: "/import", icon: Download },
  ];

  return (
    <nav className={cn("bg-coals border-b border-ash", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="Stook"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl font-outfit font-bold text-white">
                Stook
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-smoke hover:text-white transition-colors flex items-center gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {userActions.map((action) => (
                  <Button
                    key={action.name}
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-ash text-smoke hover:bg-ember hover:text-white hover:border-ember"
                  >
                    <Link href={action.href} className="flex items-center gap-2">
                      <action.icon className="h-4 w-4" />
                      {action.name}
                    </Link>
                  </Button>
                ))}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-auto p-2 rounded-lg hover:bg-ash/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback className="bg-ember text-white">
                            {user.displayName?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden lg:block text-left">
                          <div className="text-white font-medium text-sm">
                            {user.displayName || "Gebruiker"}
                          </div>
                          <div className="text-smoke text-xs">
                            {user.displayName?.includes("@") ? user.displayName : "gebruiker@stook.nl"}
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4 text-smoke hidden lg:block" />
                      </div>
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
                        <ChefHat className="mr-2 h-4 w-4" />
                        <span>Mijn Recepten</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/sessions" className="flex items-center">
                        <ChefHat className="mr-2 h-4 w-4" />
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
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Inloggen</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Registreren</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-smoke hover:text-white"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-ash">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user ? (
                <>
                  {/* Logged in user menu */}
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-smoke hover:text-white hover:bg-ash/20 rounded-md transition-colors flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profiel
                  </Link>
                  
                  <Link
                    href="/recipes/new"
                    className="block px-3 py-2 text-smoke hover:text-white hover:bg-ember/20 rounded-md transition-colors flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Plus className="h-4 w-4" />
                    Nieuw Recept
                  </Link>
                  
                  <Link
                    href="/recipes?visibility=private"
                    className="block px-3 py-2 text-smoke hover:text-white hover:bg-ash/20 rounded-md transition-colors flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ChefHat className="h-4 w-4" />
                    Mijn Recepten
                  </Link>
                  
                  <Link
                    href="/sessions"
                    className="block px-3 py-2 text-smoke hover:text-white hover:bg-ash/20 rounded-md transition-colors flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ChefHat className="h-4 w-4" />
                    Mijn Sessies
                  </Link>
                  
                  {/* Divider */}
                  <div className="border-t border-ash my-2" />
                  
                  <Link
                    href="/recipes?visibility=public"
                    className="block px-3 py-2 text-smoke hover:text-white hover:bg-ash/20 rounded-md transition-colors flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ChefHat className="h-4 w-4" />
                    Publieke Recepten
                  </Link>
                  
                  <Link
                    href="/import"
                    className="block px-3 py-2 text-smoke hover:text-white hover:bg-ash/20 rounded-md transition-colors flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Download className="h-4 w-4" />
                    Importeren
                  </Link>
                  
                  {/* Logout at bottom */}
                  <div className="border-t border-ash my-2" />
                  
                  <form action="/auth/logout" method="post" className="w-full">
                    <button 
                      type="submit" 
                      className="block w-full px-3 py-2 text-left text-smoke hover:text-white hover:bg-red-600/20 rounded-md transition-colors flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Uitloggen
                    </button>
                  </form>
                </>
              ) : (
                <>
                  {/* Not logged in user menu */}
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-smoke hover:text-white hover:bg-ash/20 rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Inloggen
                  </Link>
                  
                  <Link
                    href="/register"
                    className="block px-3 py-2 text-ember hover:text-white hover:bg-ember rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Registreren
                  </Link>
                  
                  <Link
                    href="/recipes?visibility=public"
                    className="block px-3 py-2 text-smoke hover:text-white hover:bg-ash/20 rounded-md transition-colors flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ChefHat className="h-4 w-4" />
                    Recepten
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
