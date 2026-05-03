"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, BookOpen, FlaskConical, Users, Globe,
  ArrowLeft, LogOut, ChevronRight, Shield, GraduationCap, UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/admin/educators", label: "Educators", icon: GraduationCap, exact: false },
  { href: "/admin/courses", label: "Courses", icon: BookOpen, exact: false },
  { href: "/admin/tests", label: "Tests", icon: FlaskConical, exact: false },
  { href: "/admin/students", label: "Students", icon: Shield, exact: false },
  { href: "/admin/languages", label: "Languages", icon: Globe, exact: false },
  { href: "/admin/permissions", label: "Permissions", icon: UserCog, exact: false },
];

interface Props {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}

function getBreadcrumb(pathname: string) {
  if (pathname === "/admin") return null;
  if (pathname === "/admin/users/new") return "New User";
  if (/^\/admin\/users\/\d+$/.test(pathname)) return "Edit User";
  if (pathname === "/admin/users") return "Users";
  if (pathname === "/admin/educators") return "Educators";
  if (pathname === "/admin/courses/new") return "New Course";
  if (/^\/admin\/courses\/\d+$/.test(pathname)) return "Edit Course";
  if (pathname === "/admin/courses") return "Courses";
  if (pathname === "/admin/tests/new") return "New Test";
  if (/^\/admin\/tests\/\d+$/.test(pathname)) return "Edit Test";
  if (pathname === "/admin/tests") return "Tests";
  if (pathname === "/admin/students") return "Students";
  if (pathname === "/admin/languages") return "Languages";
  if (pathname === "/admin/permissions") return "Permissions";
  return null;
}

export default function AdminShell({ user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const breadcrumb = getBreadcrumb(pathname);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-14 flex items-center px-4 gap-3 flex-shrink-0 z-40 sticky top-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm hidden sm:block">
            Lingua<span className="text-red-600">Vault</span>
          </span>
        </Link>
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hidden sm:flex">
          <Shield className="h-3.5 w-3.5 text-red-500" />
          <span>Admin Portal</span>
        </div>

        {breadcrumb && (
          <div className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 hidden md:flex">
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{breadcrumb}</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Back to site</span>
          </Link>
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
            <div className="w-7 h-7 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-red-700 dark:text-red-300">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden lg:block max-w-32 truncate">
              {user.name}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>
        <aside className="w-52 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-y-auto">
          <nav className="p-3 space-y-0.5">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      active ? "text-red-600 dark:text-red-400" : "text-gray-400"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 pb-3 mt-4">
            <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Admin Access</p>
              <p className="text-xs text-red-600 dark:text-red-500 leading-relaxed">
                Full platform control. Changes take effect immediately.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
