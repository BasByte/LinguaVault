import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import { BookOpen, FlaskConical, Users, Target, Plus, TrendingUp, ArrowRight } from "lucide-react";
import { getCEFRColor, getLevelColor, cn } from "@/lib/utils";

export default async function EducatorOverview() {
  const session = await getSession();
  if (!session) return null;
  const educatorId = session.id;

  const [
    totalCourses, publishedCourses, totalLessons,
    totalTests, publishedTests,
    enrollmentAgg, totalAttempts, avgScoreResult,
    myCourses, myTests, recentAttempts,
  ] = await Promise.all([
    prisma.courses.count({ where: { educator_id: educatorId } }),
    prisma.courses.count({ where: { educator_id: educatorId, is_published: true } }),
    prisma.lessons.count({ where: { courses: { educator_id: educatorId } } }),
    prisma.tests.count({ where: { educator_id: educatorId } }),
    prisma.tests.count({ where: { educator_id: educatorId, is_published: true } }),
    prisma.courses.aggregate({ where: { educator_id: educatorId }, _sum: { enrollment_count: true } }),
    prisma.test_attempts.count({ where: { tests: { educator_id: educatorId }, status: "completed" } }),
    prisma.test_attempts.aggregate({ where: { tests: { educator_id: educatorId }, status: "completed" }, _avg: { percentage: true } }),
    prisma.courses.findMany({ where: { educator_id: educatorId }, orderBy: { created_at: "desc" }, take: 6, include: { languages: { select: { flag_emoji: true } } } }),
    prisma.tests.findMany({ where: { educator_id: educatorId }, orderBy: { created_at: "desc" }, take: 6, include: { languages: { select: { flag_emoji: true } } } }),
    prisma.$queryRaw<{ id: number; user_name: string; test_title: string; percentage: number; cefr_result: string; completed_at: Date; }[]>`
      SELECT ta.id, u.name as user_name, t.title as test_title,
             ta.percentage::float as percentage, ta.cefr_result, ta.completed_at
      FROM test_attempts ta JOIN tests t ON ta.test_id = t.id JOIN users u ON ta.user_id = u.id
      WHERE t.educator_id = ${educatorId} AND ta.status = 'completed'
      ORDER BY ta.completed_at DESC LIMIT 8`,
  ]);

  const stats = [
    { icon: <BookOpen className="h-5 w-5 text-indigo-600" />, label: "Courses", value: totalCourses, sub: `${publishedCourses} published · ${totalLessons} lessons`, bg: "bg-indigo-50 dark:bg-indigo-950/50", href: "/educator/courses" },
    { icon: <FlaskConical className="h-5 w-5 text-sky-600" />, label: "Tests", value: totalTests, sub: `${publishedTests} published`, bg: "bg-sky-50 dark:bg-sky-950/50", href: "/educator/tests" },
    { icon: <Users className="h-5 w-5 text-emerald-600" />, label: "Students", value: (enrollmentAgg._sum.enrollment_count ?? 0).toLocaleString(), sub: "total enrollments", bg: "bg-emerald-50 dark:bg-emerald-950/50", href: "/educator/students" },
    { icon: <Target className="h-5 w-5 text-purple-600" />, label: "Avg Score", value: `${Math.round(Number(avgScoreResult._avg.percentage ?? 0))}%`, sub: `${totalAttempts} test attempts`, bg: "bg-purple-50 dark:bg-purple-950/50", href: "/educator/students" },
  ];

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Welcome back, {session.name.split(" ")[0]}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Here&apos;s an overview of your teaching activity</p>
        </div>
        <div className="flex gap-2">
          <Link href="/educator/courses/new" className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-4 py-2 rounded-xl text-sm transition-all">
            <Plus className="h-4 w-4" /> New Course
          </Link>
          <Link href="/educator/tests/new" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm">
            <Plus className="h-4 w-4" /> New Test
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.bg)}>{s.icon}</div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-indigo-600" /><h2 className="font-bold text-gray-900 dark:text-white">Recent Courses</h2></div>
            <Link href="/educator/courses" className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Manage all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {myCourses.length === 0 ? (
            <div className="p-8 text-center"><BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" /><p className="text-sm text-gray-400 mb-3">No courses yet</p><Link href="/educator/courses/new" className="text-xs text-indigo-600 font-semibold">Create your first course →</Link></div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {myCourses.map((c) => (
                <Link key={c.id} href={`/educator/courses/${c.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-xl">{c.languages?.flag_emoji || "🌐"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{c.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getLevelColor(c.level))}>{c.level.replace("_", " ")}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", c.is_published ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500")}>{c.is_published ? "Live" : "Draft"}</span>
                      <span className="text-xs text-gray-400">{c.enrollment_count} enrolled</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-sky-600" /><h2 className="font-bold text-gray-900 dark:text-white">Recent Tests</h2></div>
            <Link href="/educator/tests" className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Manage all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {myTests.length === 0 ? (
            <div className="p-8 text-center"><FlaskConical className="h-8 w-8 mx-auto mb-2 text-gray-300" /><p className="text-sm text-gray-400 mb-3">No tests yet</p><Link href="/educator/tests/new" className="text-xs text-indigo-600 font-semibold">Create your first test →</Link></div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {myTests.map((t) => (
                <Link key={t.id} href={`/educator/tests/${t.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <span className="text-xl">{t.languages?.flag_emoji || "🌐"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium border", getCEFRColor(t.cefr_level))}>{t.cefr_level}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", t.is_published ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500")}>{t.is_published ? "Live" : "Draft"}</span>
                      <span className="text-xs text-gray-400">{t.attempt_count} attempts</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-600" /><h2 className="font-bold text-gray-900 dark:text-white">Recent Student Activity</h2></div>
            <Link href="/educator/students" className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {recentAttempts.length === 0 ? (
            <div className="p-8 text-center text-gray-400"><p className="text-sm">No student attempts yet. Publish a test to get started.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Student</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Test</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Score</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">CEFR</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Date</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {recentAttempts.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-800 dark:text-gray-200">{a.user_name}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{a.test_title}</td>
                      <td className="px-5 py-3.5"><span className={cn("text-sm font-bold", Number(a.percentage) >= 70 ? "text-green-600" : Number(a.percentage) >= 50 ? "text-amber-600" : "text-red-500")}>{Math.round(Number(a.percentage))}%</span></td>
                      <td className="px-5 py-3.5">{a.cefr_result && <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold border", getCEFRColor(a.cefr_result))}>{a.cefr_result}</span>}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(a.completed_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
