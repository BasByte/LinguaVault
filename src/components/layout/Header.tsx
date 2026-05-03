"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookOpen, FlaskConical, Globe, Menu, X, User, LogOut, ChevronDown, BarChart3, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50 shadow-sm dark:shadow-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-sky-500 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Lingua<span className="text-indigo-600">Vault</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/learn" className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium transition-all text-sm">
              <BookOpen className="h-4 w-4" />
              Learn
            </Link>
            <Link href="/assess" className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium transition-all text-sm">
              <FlaskConical className="h-4 w-4" />
              Assessments
            </Link>
            {user?.role === "educator" && (
              <Link href="/educator" className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium transition-all text-sm">
                Dashboard
              </Link>
            )}
            {user?.role === "admin" && (
              <Link href="/admin" className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium transition-all text-sm">
                <BarChart3 className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:block">{user.name.split(" ")[0]}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-gray-950 border border-gray-100 dark:border-gray-800 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 capitalize">{user.role.replace("_", " ")}</span>
                      </div>
                      <Link href="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setUserMenuOpen(false)}>
                        <User className="h-4 w-4" /> Profile
                      </Link>
                      {user.role === "educator" && (
                        <Link href="/educator" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setUserMenuOpen(false)}>
                          <BarChart3 className="h-4 w-4" /> Educator Dashboard
                        </Link>
                      )}
                      {user.role === "admin" && (
                        <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => setUserMenuOpen(false)}>
                          <BarChart3 className="h-4 w-4" /> Admin Dashboard
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100 dark:border-gray-800" />
                      <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Sign in
                </Link>
                <Link href="/auth/register" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-600 dark:text-gray-300"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 space-y-1">
          <Link href="/learn" className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950 text-gray-700 dark:text-gray-300 font-medium" onClick={() => setMobileOpen(false)}>
            <BookOpen className="h-4 w-4" /> Learn
          </Link>
          <Link href="/assess" className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950 text-gray-700 dark:text-gray-300 font-medium" onClick={() => setMobileOpen(false)}>
            <FlaskConical className="h-4 w-4" /> Assessments
          </Link>
        </div>
      )}
    </header>
  );
}
