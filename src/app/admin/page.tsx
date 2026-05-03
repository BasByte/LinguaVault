import { prisma } from "@/lib/prisma";
import { Users, BookOpen, FlaskConical, Trophy, TrendingUp, Globe, BarChart3, GraduationCap, Shield } from "lucide-react";
import { getCEFRColor, cn } from "@/lib/utils";
import Link from "next/link";

export default async function AdminOverview() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, totalEducators, totalLearners,
    totalCourses, totalTests, totalAttempts, totalEnrollments,
    avgScoreResult, newUsers30d, attempts30d,
    roleBreakdown, cefrDistribution, topLanguages, recentUsers,
  ] = await Promise.all([
    prisma.users.count({ where: { is_active: true } }),
    prisma.users.count({ where: { role: "educator" } }),
    prisma.users.count({ where: { role: { in: ["free_tier", "standard"] } } }),
    prisma.courses.count(),
    prisma.tests.count(),
    prisma.test_attempts.count({ where: { status: "completed" } }),
    prisma.enrollments.count(),
    prisma.test_attempts.aggregate({ where: { status: "completed" }, _avg: { percentage: true } }),
    prisma.users.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
    prisma.test_attempts.count({ where: { status: "completed", completed_at: { gte: thirtyDaysAgo } } }),
    prisma.$queryRaw<{ role: string; count: bigint }[]>`SELECT role, COUNT(*) as count FROM users WHERE is_active = true GROUP BY role ORDER BY count DESC`,
    prisma.$queryRaw<{ cefr_result: string; count: bigint }[]>`SELECT cefr_result, COUNT(*) as count FROM test_attempts WHERE status = 'completed' AND cefr_result IS NOT NULL GROUP BY cefr_result ORDER BY cefr_result`,
    prisma.$queryRaw<{ name: string; flag_emoji: string; course_count: bigint; total_enrollments: bigint }[]>`
      SELECT l.name, l.flag_emoji, COUNT(c.id) as course_count, COALESCE(SUM(c.enrollment_count), 0) as total_enrollments
      FROM languages l LEFT JOIN courses c ON c.language_id = l.id
      GROUP BY l.id, l.name, l.flag_emoji ORDER BY total_enrollments DESC LIMIT 6
    `,
    prisma.users.findMany({
      orderBy: { created_at: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, role: true, created_at: true },
    }),
  ]);

  const avgScore = Math.round(Number(avgScoreResult._avg.percentage ?? 0));
  const totalCEFR = cefrDistribution.reduce((s, d) => s + Number(d.count), 0);
  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-700", educator: "bg-purple-100 text-purple-700",
    standard: "bg-blue-100 text-blue-700", free_tier: "bg-gray-100 text-gray-600",
  };
  const roleBarColors: Record<string, string> = {
    admin: "bg-red-400", educator: "bg-purple-500", standard: "bg-blue-500", free_tier: "bg-gray-400",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time platform analytics and management</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { href: "/admin/users/new", label: "+ New User", color: "bg-red-600 hover:bg-red-700 text-white" },
          { href: "/admin/courses/new", label: "+ New Course", color: "bg-indigo-600 hover:bg-indigo-700 text-white" },
          { href: "/admin/tests/new", label: "+ New Test", color: "bg-sky-600 hover:bg-sky-700 text-white" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-colors", a.color)}>
            {a.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: <Users className="h-5 w-5 text-blue-600" />, label: "Total Users", value: totalUsers, color: "bg-blue-50", href: "/admin/users" },
          { icon: <GraduationCap className="h-5 w-5 text-purple-600" />, label: "Educators", value: totalEducators, color: "bg-purple-50", href: "/admin/educators" },
          { icon: <BookOpen className="h-5 w-5 text-indigo-600" />, label: "Courses", value: totalCourses, color: "bg-indigo-50", href: "/admin/courses" },
          { icon: <FlaskConical className="h-5 w-5 text-sky-600" />, label: "Tests", value: totalTests, color: "bg-sky-50", href: "/admin/tests" },
          { icon: <Trophy className="h-5 w-5 text-amber-600" />, label: "Attempts", value: totalAttempts, color: "bg-amber-50", href: "/admin/students" },
          { icon: <TrendingUp className="h-5 w-5 text-green-600" />, label: "Avg Score", value: `${avgScore}%`, color: "bg-green-50", href: null },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            {stat.href ? (
              <Link href={stat.href} className="block">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2.5", stat.color)}>{stat.icon}</div>
                <p className="text-xl font-black text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </Link>
            ) : (
              <>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2.5", stat.color)}>{stat.icon}</div>
                <p className="text-xl font-black text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-red-500" /> Last 30 Days
          </h3>
          <div className="space-y-3">
            {[
              { label: "New Users", value: newUsers30d },
              { label: "Test Attempts", value: attempts30d },
              { label: "Active Educators", value: totalEducators },
              { label: "Active Learners", value: totalLearners },
              { label: "Total Enrollments", value: totalEnrollments },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className="font-bold text-gray-900 text-sm">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" /> User Roles
          </h3>
          <div className="space-y-3">
            {roleBreakdown.map((role) => {
              const total = roleBreakdown.reduce((s, r) => s + Number(r.count), 0);
              const pct = total > 0 ? Math.round((Number(role.count) / total) * 100) : 0;
              return (
                <div key={role.role}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-600 capitalize">{role.role.replace("_", " ")}</span>
                    <span className="text-xs font-bold text-gray-900">{String(role.count)} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", roleBarColors[role.role] || "bg-indigo-500")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" /> CEFR Distribution
          </h3>
          <div className="space-y-3">
            {cefrDistribution.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No test attempts yet</p>
            ) : cefrDistribution.map((d) => {
              const pct = totalCEFR > 0 ? Math.round((Number(d.count) / totalCEFR) * 100) : 0;
              return (
                <div key={d.cefr_result}>
                  <div className="flex justify-between mb-1">
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded border", getCEFRColor(d.cefr_result))}>{d.cefr_result}</span>
                    <span className="text-xs text-gray-600">{String(d.count)} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <Globe className="h-5 w-5 text-sky-600" />
            <h3 className="font-bold text-gray-900">Top Languages by Enrollment</h3>
          </div>
          <div className="p-5 space-y-4">
            {topLanguages.map((lang) => {
              const maxEnrollments = Number(topLanguages[0]?.total_enrollments ?? 1);
              const pct = maxEnrollments > 0 ? (Number(lang.total_enrollments) / maxEnrollments) * 100 : 0;
              return (
                <div key={lang.name} className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag_emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">{lang.name}</span>
                      <span className="text-xs text-gray-500">{String(lang.total_enrollments)} enrolled</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{String(lang.course_count)} courses</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-bold text-gray-900">Recent Registrations</h3>
            </div>
            <Link href="/admin/users" className="text-xs text-red-600 hover:underline font-medium">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.map((user) => (
              <Link key={user.id} href={`/admin/users/${user.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", roleColors[user.role] || "bg-gray-100 text-gray-600")}>
                    {user.role.replace("_", " ")}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
