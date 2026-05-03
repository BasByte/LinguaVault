import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { getCEFRColor, cn } from "@/lib/utils";
import { Trophy, Target, ChevronRight, Medal } from "lucide-react";

interface Attempt {
  id: number;
  test_title: string;
  language_name: string;
  flag_emoji: string;
  score: number;
  percentage: number;
  cefr_result: string;
  time_spent_seconds: number;
  completed_at: string;
  test_id: number;
}

export default async function MyResultsPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const attempts = await query<Attempt>(
    `SELECT ta.*, t.title as test_title, l.name as language_name, l.flag_emoji, ta.test_id
     FROM test_attempts ta
     JOIN tests t ON ta.test_id = t.id
     LEFT JOIN languages l ON t.language_id = l.id
     WHERE ta.user_id = $1 AND ta.status = 'completed'
     ORDER BY ta.completed_at DESC
     LIMIT 30`,
    [session.id]
  );

  const bestResult = attempts.reduce((best: string | null, a) => {
    const order = ["A1", "A2", "B1", "B2", "C1", "C2"];
    if (!best) return a.cefr_result;
    return order.indexOf(a.cefr_result) > order.indexOf(best) ? a.cefr_result : best;
  }, null);

  const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + Number(a.percentage), 0) / attempts.length) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header user={session} />

      <div className="bg-gradient-to-br from-indigo-900 to-sky-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-black mb-2">My Assessment Results</h1>
          <p className="text-indigo-300">Track your language proficiency progress</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <Trophy className="h-5 w-5 text-amber-400 mb-2" />
              <p className="text-2xl font-black">{attempts.length}</p>
              <p className="text-xs text-indigo-300">Tests Taken</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <Target className="h-5 w-5 text-green-400 mb-2" />
              <p className="text-2xl font-black">{avgScore}%</p>
              <p className="text-xs text-indigo-300">Avg Score</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <Medal className="h-5 w-5 text-purple-400 mb-2" />
              <p className="text-2xl font-black">{bestResult || "—"}</p>
              <p className="text-xs text-indigo-300">Best CEFR Level</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <Trophy className="h-5 w-5 text-indigo-400 mb-2" />
              <p className="text-2xl font-black">{session.name.split(" ")[0]}</p>
              <p className="text-xs text-indigo-300 capitalize">{session.role.replace("_", " ")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {attempts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No tests taken yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Take your first assessment to start tracking your CEFR progress</p>
            <Link href="/assess" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all">
              Browse Assessments
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{attempt.flag_emoji}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{attempt.test_title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{attempt.language_name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(attempt.completed_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        {attempt.time_spent_seconds && <span> • {Math.round(attempt.time_spent_seconds / 60)}m spent</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn("px-3 py-1 rounded-full text-sm font-black border", getCEFRColor(attempt.cefr_result))}>
                      {attempt.cefr_result}
                    </span>
                    <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{Math.round(attempt.percentage)}%</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{attempt.score} pts</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${Number(attempt.percentage) >= 70 ? "bg-green-500" : Number(attempt.percentage) >= 50 ? "bg-amber-500" : "bg-red-400"}`}
                      style={{ width: `${attempt.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Link href={`/assess/tests/${attempt.test_id}`} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold">
                    Retake Test <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
