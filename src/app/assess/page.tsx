import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TestCard from "@/components/home/TestCard";
import { Test } from "@/types";
import Link from "next/link";
import { FlaskConical, Trophy, Target, ChevronRight, Lock } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ lang?: string; level?: string; q?: string }>;
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

async function getAssessData(filters: { lang?: string; level?: string; q?: string }) {
  let whereConditions = ["t.is_published = true", "t.is_public = true"];
  const params: unknown[] = [];

  if (filters.lang) { params.push(filters.lang); whereConditions.push(`l.code = $${params.length}`); }
  if (filters.level) { params.push(filters.level); whereConditions.push(`t.cefr_level = $${params.length}`); }
  if (filters.q) { params.push(`%${filters.q}%`); whereConditions.push(`t.title ILIKE $${params.length}`); }

  return query<Test>(
    `SELECT t.*, l.name as language_name, l.flag_emoji, u.name as educator_name,
            (SELECT COUNT(*) FROM test_questions q WHERE q.test_id = t.id) as question_count
     FROM tests t
     LEFT JOIN languages l ON t.language_id = l.id
     LEFT JOIN users u ON t.educator_id = u.id
     WHERE ${whereConditions.join(" AND ")}
     ORDER BY t.attempt_count DESC`,
    params
  );
}

export default async function AssessPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const [session, tests] = await Promise.all([
    getSession(),
    getAssessData(filters),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header user={session} />

      <div className="bg-gradient-to-br from-sky-900 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black">Language Assessment Center</h1>
              <p className="text-sky-300">CEFR-aligned tests • Instant results • Gamified learning</p>
            </div>
          </div>

          {!session && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 mt-4 max-w-xl">
              <Lock className="h-5 w-5 text-amber-300 shrink-0" />
              <p className="text-sm text-white/90">
                <strong>Sign in required</strong> to take assessments and track your CEFR progress.{" "}
                <Link href="/auth/register" className="text-amber-300 hover:text-amber-200 font-semibold underline">Create free account</Link>
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-8 max-w-md">
            {[
              { value: "10+", label: "Tests", icon: <Target className="h-4 w-4" /> },
              { value: "5K+", label: "Takers", icon: <FlaskConical className="h-4 w-4" /> },
              { value: "A1–C2", label: "CEFR", icon: <Trophy className="h-4 w-4" /> },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <div className="flex justify-center text-white/70 mb-1">{stat.icon}</div>
                <div className="font-black text-xl">{stat.value}</div>
                <div className="text-xs text-sky-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/assess" className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!filters.level ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300"}`}>
              All Levels
            </Link>
            {CEFR_LEVELS.map(level => (
              <Link key={level} href={`/assess?level=${level}`}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filters.level === level ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-300"}`}
              >
                {level}
              </Link>
            ))}

            <div className="ml-auto flex gap-2">
              <Link href="/assess/leaderboard" className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded-xl text-sm font-semibold transition-all">
                <Trophy className="h-4 w-4" /> Leaderboard
              </Link>
              {session && (
                <Link href="/assess/my-results" className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 rounded-xl text-sm font-semibold transition-all">
                  My Results <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {tests.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">No tests found</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">Try a different level or language</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-500 dark:text-gray-400 text-sm">{tests.length} assessments available</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tests.map(test => (
                <TestCard key={test.id} test={test} />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
