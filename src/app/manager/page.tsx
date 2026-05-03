import { getSession } from "@/lib/auth";
import { getManagerPerms, ALL_PERMS } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, GraduationCap, BookOpen, FlaskConical, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function ManagerOverviewPage() {
  const session = await getSession();
  if (!session || !["manager", "admin"].includes(session.role)) redirect("/");

  const perms = session.role === "admin" ? ALL_PERMS : await getManagerPerms(session.id);

  const [studentCount, educatorCount, courseCount, testCount] = await Promise.all([
    perms.manage_students ? prisma.users.count({ where: { role: { in: ["free_tier", "standard"] }, is_active: true } }) : Promise.resolve(null),
    perms.manage_educators ? prisma.users.count({ where: { role: "educator", is_active: true } }) : Promise.resolve(null),
    perms.manage_courses ? prisma.courses.count() : Promise.resolve(null),
    perms.manage_tests ? prisma.tests.count() : Promise.resolve(null),
  ]);

  const grantedCount = [perms.manage_students, perms.manage_educators, perms.manage_courses, perms.manage_tests].filter(Boolean).length;

  const cards = [
    { label: "Students", count: studentCount, icon: Users, href: "/manager/students", granted: perms.manage_students, color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
    { label: "Educators", count: educatorCount, icon: GraduationCap, href: "/manager/educators", granted: perms.manage_educators, color: "bg-purple-50 text-purple-600", border: "border-purple-100" },
    { label: "Courses", count: courseCount, icon: BookOpen, href: "/manager/courses", granted: perms.manage_courses, color: "bg-indigo-50 text-indigo-600", border: "border-indigo-100" },
    { label: "Tests", count: testCount, icon: FlaskConical, href: "/manager/tests", granted: perms.manage_tests, color: "bg-sky-50 text-sky-600", border: "border-sky-100" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Manager Overview</h1>
          <p className="text-xs text-gray-500">Welcome back, {session.name} · {grantedCount} of 4 permissions granted</p>
        </div>
      </div>

      {grantedCount === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <Lock className="h-10 w-10 text-amber-400 mx-auto mb-3" />
          <p className="font-bold text-amber-900 mb-1">No permissions assigned yet</p>
          <p className="text-sm text-amber-700">Contact an administrator to grant you access to manage students, educators, courses, or tests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className={cn("bg-white rounded-2xl border shadow-sm overflow-hidden", card.border, !card.granted && "opacity-50")}>
              {card.granted ? (
                <Link href={card.href} className="block p-5 hover:bg-gray-50 transition-colors">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", card.color.split(" ")[0])}>
                    <card.icon className={cn("h-5 w-5", card.color.split(" ")[1])} />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{card.count ?? "—"}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
                </Link>
              ) : (
                <div className="p-5">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", "bg-gray-100")}>
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-2xl font-black text-gray-300">—</p>
                  <p className="text-sm text-gray-400 mt-0.5">{card.label}</p>
                  <p className="text-xs text-gray-400 mt-1">No access</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 mb-3 text-sm">Your Permission Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Manage Students", granted: perms.manage_students, desc: "View, activate, deactivate" },
            { label: "Manage Educators", granted: perms.manage_educators, desc: "View, activate, deactivate" },
            { label: "Manage Courses", granted: perms.manage_courses, desc: "Create, edit, delete" },
            { label: "Manage Tests", granted: perms.manage_tests, desc: "Create, edit, delete" },
          ].map((p) => (
            <div key={p.label} className={cn("rounded-xl p-3 border", p.granted ? "bg-teal-50 border-teal-100" : "bg-gray-50 border-gray-100")}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={cn("text-xs font-bold", p.granted ? "text-teal-700" : "text-gray-400")}>{p.granted ? "✓ " : "✗ "}{p.label}</span>
              </div>
              <p className="text-xs text-gray-500">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
