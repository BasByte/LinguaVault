import { prisma } from "@/lib/prisma";
import { Users, Trophy, TrendingUp, BookOpen, Search } from "lucide-react";
import { getCEFRColor, cn } from "@/lib/utils";
import Link from "next/link";

export default async function AdminStudentsPage() {
  const [students, summary, cefrDist] = await Promise.all([
    prisma.users.findMany({
      where: { role: { in: ["free_tier", "standard"] } },
      orderBy: { created_at: "desc" },
      select: {
        id: true, name: true, email: true, role: true, is_active: true,
        total_points: true, streak_days: true, created_at: true,
        _count: { select: { enrollments: true, test_attempts: true } },
        test_attempts: {
          where: { status: "completed" },
          orderBy: { completed_at: "desc" },
          take: 1,
          select: { percentage: true, cefr_result: true },
        },
        enrollments: {
          orderBy: { enrolled_at: "desc" },
          take: 1,
          include: { courses: { select: { title: true } } },
        },
      },
    }),
    prisma.$queryRaw<{ total: bigint; avg_score: number; total_enrollments: bigint; total_attempts: bigint }[]>`
      SELECT COUNT(DISTINCT u.id) as total, COALESCE(AVG(ta.percentage)::float, 0) as avg_score,
        COUNT(DISTINCT e.id) as total_enrollments, COUNT(DISTINCT ta2.id) as total_attempts
      FROM users u
      LEFT JOIN enrollments e ON e.user_id = u.id
      LEFT JOIN test_attempts ta ON ta.user_id = u.id AND ta.status = 'completed'
      LEFT JOIN test_attempts ta2 ON ta2.user_id = u.id
      WHERE u.role IN ('free_tier', 'standard')
    `,
    prisma.$queryRaw<{ cefr_result: string; count: bigint }[]>`
      SELECT ta.cefr_result, COUNT(*) as count FROM test_attempts ta
      JOIN users u ON u.id = ta.user_id WHERE ta.status = 'completed'
      AND ta.cefr_result IS NOT NULL AND u.role IN ('free_tier', 'standard')
      GROUP BY ta.cefr_result ORDER BY ta.cefr_result
    `,
  ]);

  const s = summary[0];
  const totalCEFR = cefrDist.reduce((acc, d) => acc + Number(d.count), 0);

  const roleColors: Record<string, string> = {
    standard: "bg-blue-100 text-blue-700",
    free_tier: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Students</h1>
          <p className="text-xs text-gray-500">Per-student progress analytics</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Users className="h-5 w-5 text-blue-600" />, label: "Total Students", value: Number(s.total), bg: "bg-blue-50" },
          { icon: <BookOpen className="h-5 w-5 text-indigo-600" />, label: "Enrollments", value: Number(s.total_enrollments), bg: "bg-indigo-50" },
          { icon: <Trophy className="h-5 w-5 text-amber-600" />, label: "Test Attempts", value: Number(s.total_attempts), bg: "bg-amber-50" },
          { icon: <TrendingUp className="h-5 w-5 text-green-600" />, label: "Avg Score", value: `${Math.round(s.avg_score)}%`, bg: "bg-green-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", stat.bg)}>{stat.icon}</div>
            <p className="text-xl font-black text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* CEFR distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> CEFR Distribution
          </h3>
          {cefrDist.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No completed tests yet</p>
          ) : (
            <div className="space-y-3">
              {cefrDist.map((d) => {
                const pct = totalCEFR > 0 ? Math.round((Number(d.count) / totalCEFR) * 100) : 0;
                return (
                  <div key={d.cefr_result}>
                    <div className="flex justify-between mb-1">
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded border", getCEFRColor(d.cefr_result))}>{d.cefr_result}</span>
                      <span className="text-xs text-gray-500">{String(d.count)} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Students table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <h3 className="font-bold text-gray-900">All Students</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Enrollments</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Attempts</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Score / CEFR</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No students yet</td></tr>
                ) : students.map((st) => {
                  const latestAttempt = st.test_attempts[0];
                  const latestScore = latestAttempt?.percentage ? Math.round(Number(latestAttempt.percentage)) : null;
                  const latestCEFR = latestAttempt?.cefr_result ?? null;
                  return (
                    <tr key={st.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-sky-500 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0">
                            {st.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-xs truncate max-w-28">{st.name}</p>
                            <p className="text-xs text-gray-400 truncate max-w-28">{st.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold capitalize", roleColors[st.role] || "bg-gray-100 text-gray-600")}>
                          {st.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm font-bold text-gray-900">{st._count.enrollments}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm font-bold text-gray-900">{st._count.test_attempts}</span>
                      </td>
                      <td className="px-4 py-3">
                        {latestScore != null ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-gray-900">{latestScore}%</span>
                            {latestCEFR && (
                              <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded border", getCEFRColor(latestCEFR))}>
                                {latestCEFR}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No attempts</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Link
                            href={`/admin/users/${st.id}`}
                            className="text-xs px-2.5 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
