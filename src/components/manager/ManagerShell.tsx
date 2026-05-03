"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, BookOpen, FlaskConical, Users, Globe,
  ArrowLeft, LogOut, ChevronRight, Briefcase, GraduationCap, UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ManagerPerms } from "@/lib/manager-auth";

interface Props {
  user: { name: string; email: string; role: string };
  perms: ManagerPerms;
  children: React.ReactNode;
}

function getBreadcrumb(pathname: string) {
  if (pathname === "/manager") return null;
  if (pathname === "/manager/students") return "Students";
  if (pathname === "/manager/educators") return "Educators";
  if (pathname === "/manager/courses/new") return "New Course";
  if (/^\/manager\/courses\/\d+$/.test(pathname)) return "Edit Course";
  if (pathname === "/manager/courses") return "Courses";
  if (pathname === "/manager/tests/new") return "New Test";
  if (/^\/manager\/tests\/\d+$/.test(pathname)) return "Edit Test";
  if (pathname === "/manager/tests") return "Tests";
  return null;
}

export default function ManagerShell({ user, perms, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const breadcrumb = getBreadcrumb(pathname);

  const navItems = [
    { href: "/manager", label: "Overview", icon: LayoutDashboard, exact: true, show: true },
    { href: "/manager/students", label: "Students", icon: Users, exact: false, show: perms.manage_students },
    { href: "/manager/educators", label: "Educators", icon: GraduationCap, exact: false, show: perms.manage_educators },
    { href: "/manager/courses", label: "Courses", icon: BookOpen, exact: false, show: perms.manage_courses },
    { href: "/manager/tests", label: "Tests", icon: FlaskConical, exact: false, show: perms.manage_tests },
  ].filter((i) => i.show);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-14 flex items-center px-4 gap-3 flex-shrink-0 z-40 sticky top-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm hidden sm:block">
            Lingua<span className="text-teal-600">Vault</span>
          </span>
        </Link>
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hidden sm:flex">
          <Briefcase className="h-3.5 w-3.5 text-teal-500" />
          <span>Manager Portal</span>
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
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-teal-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Back to site</span>
          </Link>
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
            <div className="w-7 h-7 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-32 truncate">{user.name}</p>
              <p className="text-xs text-teal-600 font-semibold capitalize">{user.role}</p>
            </div>
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
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-teal-600 dark:text-teal-400" : "text-gray-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="px-3 pb-3 mt-4">
            <div className="bg-teal-50 dark:bg-teal-950/40 rounded-xl p-3">
              <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mb-1 flex items-center gap-1.5">
                <UserCog className="h-3.5 w-3.5" /> Your Access
              </p>
              <div className="space-y-0.5">
                {[
                  { label: "Students", granted: perms.manage_students },
                  { label: "Educators", granted: perms.manage_educators },
                  { label: "Courses", granted: perms.manage_courses },
                  { label: "Tests", granted: perms.manage_tests },
                ].map((p) => (
                  <div key={p.label} className="flex items-center justify-between text-xs">
                    <span className="text-teal-700 dark:text-teal-400">{p.label}</span>
                    <span className={p.granted ? "text-teal-600 font-bold" : "text-gray-400"}>
                      {p.granted ? "✓" : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
