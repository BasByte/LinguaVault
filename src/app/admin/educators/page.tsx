import { prisma } from "@/lib/prisma";
import { GraduationCap, BookOpen, FlaskConical, Users, TrendingUp, Trophy } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function AdminEducatorsPage() {
  const educators = await prisma.users.findMany({
    where: { role: "educator" },
    orderBy: { created_at: "desc" },
    select: {
      id: true, name: true, email: true, is_active: true, created_at: true,
      _count: { select: { courses: true, tests: true } },
      courses: { select: { id: true, title: true, is_published: true, enrollment_count: true } },
      tests: { select: { id: true, title: true, is_published: true, attempt_count: true } },
    },
  });

  const scores = await prisma.$queryRaw<{ educator_id: number; avg_score: number }[]>`
    SELECT t.educator_id, AVG(ta.percentage)::float as avg_score
    FROM test_attempts ta
    JOIN tests t ON t.id = ta.test_id
    WHERE ta.status = 'completed' AND t.educator_id IS NOT NULL
    GROUP BY t.educator_id
  `;
  const scoreMap = Object.fromEntries(scores.map((s) => [s.educator_id, Math.round(s.avg_score)]));

  const enriched = educators.map((e) => ({
    ...e,
    total_enrollments: e.courses.reduce((s, c) => s + (c.enrollment_count ?? 0), 0),
    published_courses: e.courses.filter((c) => c.is_published).length,
    published_tests: e.tests.filter((t) => t.is_published).length,
    total_attempts: e.tests.reduce((s, t) => s + (t.attempt_count ?? 0), 0),
    avg_score: scoreMap[e.id] ?? null,
  }));

  const totalCourses = enriched.reduce((s, e) => s + e._count.courses, 0);
  const totalTests = enriched.reduce((s, e) => s + e._count.tests, 0);
  const totalEnrollments = enriched.reduce((s, e) => s + e.total_enrollments, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Educators</h1>
            <p className="text-xs text-gray-500">{educators.length} registered educators</p>
          </div>
        </div>
        <Link
          href="/admin/users/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          + Add Educator
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <GraduationCap className="h-5 w-5 text-purple-600" />, label: "Educators", value: educators.length, bg: "bg-purple-50" },
          { icon: <BookOpen className="h-5 w-5 text-indigo-600" />, label: "Total Courses", value: totalCourses, bg: "bg-indigo-50" },
          { icon: <FlaskConical className="h-5 w-5 text-sky-600" />, label: "Total Tests", value: totalTests, bg: "bg-sky-50" },
          { icon: <Users className="h-5 w-5 text-green-600" />, label: "Enrollments", value: totalEnrollments, bg: "bg-green-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", s.bg)}>{s.icon}</div>
            <p className="text-xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Educators table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Educator Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Educator</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Courses</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tests</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Enrollments</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Attempts</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Avg Score</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {enriched.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">No educators found</td>
                </tr>
              ) : enriched.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0">
                        {e.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate max-w-36">{e.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-36">{e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <span className="font-bold text-gray-900">{e._count.courses}</span>
                      <span className="text-gray-400 ml-1">({e.published_courses} pub.)</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <span className="font-bold text-gray-900">{e._count.tests}</span>
                      <span className="text-gray-400 ml-1">({e.published_tests} pub.)</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-xs">
                      <Users className="h-3 w-3 text-gray-400" />
                      <span className="font-semibold text-gray-800">{e.total_enrollments}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3 w-3 text-gray-400" />
                      <span className="font-semibold text-gray-800">{e.total_attempts}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {e.avg_score != null ? (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-amber-500" />
                        <span className="text-xs font-bold text-gray-800">{e.avg_score}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", e.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                      {e.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/courses?educator_id=${e.id}`}
                        className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-semibold transition-colors"
                      >
                        Courses
                      </Link>
                      <Link
                        href={`/admin/users/${e.id}`}
                        className="text-xs px-2.5 py-1 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
