import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UserForm from "@/components/admin/UserForm";
import { ChevronLeft, BookOpen, FlaskConical, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { cn, getCEFRColor } from "@/lib/utils";

export default async function AdminUserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.users.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true, name: true, email: true, role: true, is_active: true,
      bio: true, total_points: true, streak_days: true, created_at: true,
      _count: { select: { enrollments: true, test_attempts: true, courses: true, tests: true } },
      enrollments: {
        take: 5, orderBy: { enrolled_at: "desc" },
        include: { courses: { select: { id: true, title: true, is_published: true } } },
      },
      test_attempts: {
        take: 5, orderBy: { started_at: "desc" },
        select: { id: true, percentage: true, cefr_result: true, status: true, completed_at: true, tests: { select: { title: true } } },
      },
    },
  });

  if (!user) notFound();

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-700", educator: "bg-purple-100 text-purple-700",
    standard: "bg-blue-100 text-blue-700", free_tier: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="w-9 h-9 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-sm font-black">
          {user.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">{user.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold capitalize", roleColors[user.role] || "bg-gray-100")}>
              {user.role.replace("_", " ")}
            </span>
            <span className="text-xs text-gray-400">Joined {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <BookOpen className="h-4 w-4 text-indigo-600" />, label: "Enrollments", value: user._count.enrollments, bg: "bg-indigo-50" },
          { icon: <FlaskConical className="h-4 w-4 text-sky-600" />, label: "Attempts", value: user._count.test_attempts, bg: "bg-sky-50" },
          { icon: <Trophy className="h-4 w-4 text-amber-600" />, label: "Points", value: user.total_points, bg: "bg-amber-50" },
          { icon: <Users className="h-4 w-4 text-green-600" />, label: "Streak Days", value: user.streak_days, bg: "bg-green-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-1.5", s.bg)}>{s.icon}</div>
            <p className="text-lg font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3">Edit Profile</h2>
          <UserForm mode="edit" user={{ id: user.id, name: user.name, email: user.email, role: user.role, is_active: user.is_active, bio: user.bio ?? "" }} />
        </div>

        <div className="space-y-4">
          {/* Recent enrollments */}
          {user.enrollments.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-600" /> Recent Enrollments
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {user.enrollments.map((e) => (
                  <div key={e.id} className="px-4 py-3 flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-800 font-medium truncate">{e.courses?.title ?? "—"}</p>
                    {e.courses && (
                      <Link href={`/admin/courses/${e.courses.id}`} className="text-xs text-indigo-600 hover:underline shrink-0">Edit</Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent test attempts */}
          {user.test_attempts.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-sky-600" /> Recent Test Attempts
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {user.test_attempts.map((a) => (
                  <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.tests?.title ?? "—"}</p>
                      <p className="text-xs text-gray-400">
                        {a.status === "completed" && a.completed_at
                          ? new Date(a.completed_at).toLocaleDateString()
                          : a.status}
                      </p>
                    </div>
                    {a.status === "completed" && a.percentage != null && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-sm font-bold text-gray-900">{Math.round(Number(a.percentage))}%</span>
                        {a.cefr_result && (
                          <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded border", getCEFRColor(a.cefr_result))}>
                            {a.cefr_result}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
