import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getCEFRColor, cn } from "@/lib/utils";
import { Users, BookOpen, FlaskConical, Target } from "lucide-react";

export default async function StudentsPage() {
  const session = await getSession();
  if (!session) return null;

  const educatorId = session.id;

  const [enrollments, attempts, courses, tests] = await Promise.all([
    prisma.$queryRaw<{
      user_id: number; user_name: string; user_email: string;
      course_id: number; course_title: string; flag_emoji: string;
      progress_percentage: number; enrolled_at: Date;
    }[]>`
      SELECT u.id as user_id, u.name as user_name, u.email as user_email,
             c.id as course_id, c.title as course_title, COALESCE(l.flag_emoji, '🌐') as flag_emoji,
             e.progress_percentage, e.enrolled_at
      FROM enrollments e
      JOIN users u ON e.user_id = u.id
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN languages l ON c.language_id = l.id
      WHERE c.educator_id = ${educatorId}
      ORDER BY e.enrolled_at DESC
      LIMIT 200`,
    prisma.$queryRaw<{
      user_id: number; user_name: string; user_email: string;
      test_id: number; test_title: string; cefr_level: string;
      percentage: number; cefr_result: string | null; completed_at: Date;
    }[]>`
      SELECT u.id as user_id, u.name as user_name, u.email as user_email,
             t.id as test_id, t.title as test_title, t.cefr_level,
             ta.percentage::float as percentage, ta.cefr_result, ta.completed_at
      FROM test_attempts ta
      JOIN tests t ON ta.test_id = t.id
      JOIN users u ON ta.user_id = u.id
      WHERE t.educator_id = ${educatorId} AND ta.status = 'completed'
      ORDER BY ta.completed_at DESC
      LIMIT 300`,
    prisma.courses.findMany({
      where: { educator_id: educatorId },
      select: { id: true, title: true, enrollment_count: true, languages: { select: { flag_emoji: true } } },
      orderBy: { enrollment_count: "desc" },
    }),
    prisma.tests.findMany({
      where: { educator_id: educatorId },
      select: { id: true, title: true, attempt_count: true, languages: { select: { flag_emoji: true } } },
      orderBy: { attempt_count: "desc" },
    }),
  ]);

  const uniqueStudents = new Set([...enrollments.map((e) => e.user_id), ...attempts.map((a) => a.user_id)]);
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + Number(a.percentage), 0) / attempts.length)
    : 0;

  // Per-student summary
  const studentMap = new Map<number, { name: string; email: string; enrollments: number; attempts: number; avgScore: number }>();
  enrollments.forEach((e) => {
    if (!studentMap.has(e.user_id)) studentMap.set(e.user_id, { name: e.user_name, email: e.user_email, enrollments: 0, attempts: 0, avgScore: 0 });
    studentMap.get(e.user_id)!.enrollments++;
  });
  const scoreAccumulator = new Map<number, { total: number; count: number }>();
  attempts.forEach((a) => {
    if (!studentMap.has(a.user_id)) studentMap.set(a.user_id, { name: a.user_name, email: a.user_email, enrollments: 0, attempts: 0, avgScore: 0 });
    studentMap.get(a.user_id)!.attempts++;
    if (!scoreAccumulator.has(a.user_id)) scoreAccumulator.set(a.user_id, { total: 0, count: 0 });
    const acc = scoreAccumulator.get(a.user_id)!;
    acc.total += Number(a.percentage);
    acc.count++;
  });
  scoreAccumulator.forEach((acc, id) => {
    if (studentMap.has(id)) studentMap.get(id)!.avgScore = Math.round(acc.total / acc.count);
  });
  const students = Array.from(studentMap.entries()).map(([id, s]) => ({ id, ...s }));
  students.sort((a, b) => b.enrollments + b.attempts - (a.enrollments + a.attempts));

  const summaryCards = [
    { icon: <Users className="h-5 w-5 text-indigo-600" />, label: "Total Students", value: uniqueStudents.size, bg: "bg-indigo-50 dark:bg-indigo-950/50" },
    { icon: <BookOpen className="h-5 w-5 text-emerald-600" />, label: "Enrollments", value: enrollments.length, bg: "bg-emerald-50 dark:bg-emerald-950/50" },
    { icon: <FlaskConical className="h-5 w-5 text-sky-600" />, label: "Test Attempts", value: attempts.length, bg: "bg-sky-50 dark:bg-sky-950/50" },
    { icon: <Target className="h-5 w-5 text-purple-600" />, label: "Avg Score", value: `${avgScore}%`, bg: "bg-purple-50 dark:bg-purple-950/50" },
  ];

  return (
    <div className="p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Student Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Track engagement and progress across your content</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.bg)}>{s.icon}</div>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Top Courses */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">Course Enrollments</h2>
          </div>
          {courses.length === 0 ? <div className="p-6 text-center text-sm text-gray-400">No courses yet</div> : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {courses.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{c.languages?.flag_emoji || "🌐"}</span>
                  <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{c.title}</p>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{c.enrollment_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Tests */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-sky-600" />
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">Test Popularity</h2>
          </div>
          {tests.length === 0 ? <div className="p-6 text-center text-sm text-gray-400">No tests yet</div> : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {tests.slice(0, 8).map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{t.languages?.flag_emoji || "🌐"}</span>
                  <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{t.title}</p>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{t.attempt_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Score distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            <h2 className="font-bold text-sm text-gray-900 dark:text-white">Score Distribution</h2>
          </div>
          {attempts.length === 0 ? <div className="p-6 text-center text-sm text-gray-400">No attempts yet</div> : (() => {
            const bands = [
              { label: "90–100%", min: 90, color: "bg-green-500" },
              { label: "70–89%", min: 70, color: "bg-emerald-400" },
              { label: "50–69%", min: 50, color: "bg-amber-400" },
              { label: "Below 50%", min: 0, color: "bg-red-400" },
            ];
            return (
              <div className="p-4 space-y-3">
                {bands.map((b, i) => {
                  const max = i === 0 ? 101 : bands[i - 1].min;
                  const count = attempts.filter((a) => Number(a.percentage) >= b.min && Number(a.percentage) < max).length;
                  const pct = attempts.length > 0 ? Math.round((count / attempts.length) * 100) : 0;
                  return (
                    <div key={b.label}>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>{b.label}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", b.color)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Per-student table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-600" />
          <h2 className="font-bold text-gray-900 dark:text-white">All Students</h2>
          <span className="ml-auto text-xs text-gray-400">{students.length} total</span>
        </div>
        {students.length === 0 ? (
          <div className="p-12 text-center text-gray-400"><p className="text-sm">No students yet. Publish content to attract learners.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Student</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Courses</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Tests Taken</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{s.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{s.enrollments}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{s.attempts}</td>
                    <td className="px-5 py-3.5">
                      {s.attempts > 0 ? (
                        <span className={cn("text-sm font-bold", s.avgScore >= 70 ? "text-green-600" : s.avgScore >= 50 ? "text-amber-600" : "text-red-500")}>
                          {s.avgScore}%
                        </span>
                      ) : <span className="text-sm text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Test Attempts */}
      {attempts.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden mt-6">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-sky-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Recent Test Attempts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Student</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Test</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Score</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">CEFR Result</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {attempts.slice(0, 20).map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{a.user_name}</p>
                      <p className="text-xs text-gray-400">{a.user_email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">{a.test_title}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn("text-sm font-bold", Number(a.percentage) >= 70 ? "text-green-600" : Number(a.percentage) >= 50 ? "text-amber-600" : "text-red-500")}>
                        {Math.round(Number(a.percentage))}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {a.cefr_result && <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold border", getCEFRColor(a.cefr_result))}>{a.cefr_result}</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(a.completed_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
