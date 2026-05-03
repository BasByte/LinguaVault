import { notFound, redirect } from "next/navigation";
import { queryOne, query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Header from "@/components/layout/Header";
import TestInterface from "@/components/assess/TestInterface";
import Link from "next/link";
import { Clock, BookCheck, Lock, Trophy, Target } from "lucide-react";
import { getCEFRColor, cn } from "@/lib/utils";

export default async function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const test = await queryOne(
    `SELECT t.*, l.name as language_name, l.flag_emoji, u.name as educator_name
     FROM tests t
     LEFT JOIN languages l ON t.language_id = l.id
     LEFT JOIN users u ON t.educator_id = u.id
     WHERE t.id = $1 AND t.is_published = true`,
    [parseInt(id)]
  ) as {
    id: number; title: string; description: string; cefr_level: string;
    duration_minutes: number; passing_score: number; language_name: string;
    flag_emoji: string; educator_name: string; attempt_count: number;
  } | null;

  if (!test) notFound();

  const questions = await query(
    "SELECT id, question, question_type, options, points, order_index FROM test_questions WHERE test_id = $1 ORDER BY order_index",
    [parseInt(id)]
  ) as { id: number; question: string; question_type: string; options: string[] | null; points: number; order_index: number }[];

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={null} />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">Sign In to Take This Test</h1>
          <p className="text-gray-600 text-lg mb-8">
            Create a free account to take CEFR assessments, track your progress, and earn badges.
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8 text-left">
            <h3 className="font-bold text-gray-900 mb-2 text-lg">{test.flag_emoji} {test.title}</h3>
            <p className="text-gray-500 text-sm mb-4">{test.description}</p>
            <div className="flex gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {test.duration_minutes} min</span>
              <span className="flex items-center gap-1"><BookCheck className="h-4 w-4" /> {questions.length} questions</span>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold border", getCEFRColor(test.cefr_level))}>{test.cefr_level}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-sm">
              Create Free Account
            </Link>
            <Link href="/auth/login" className="bg-white hover:bg-gray-50 text-gray-700 font-bold px-8 py-3.5 rounded-xl border border-gray-200 transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Test header */}
        <div className="bg-gradient-to-br from-indigo-900 to-sky-900 rounded-2xl text-white p-6 mb-6 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{test.flag_emoji}</span>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border bg-white/10 border-white/20")}>{test.cefr_level}</span>
                <span className="text-sm text-indigo-300">{test.language_name}</span>
              </div>
              <h1 className="text-2xl font-black">{test.title}</h1>
              {test.description && <p className="text-indigo-200 text-sm mt-1">{test.description}</p>}
              <p className="text-xs text-indigo-400 mt-2">By {test.educator_name}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 justify-end text-sm">
                  <Clock className="h-4 w-4 text-indigo-300" />
                  <span>{test.duration_minutes} min</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end text-sm">
                  <BookCheck className="h-4 w-4 text-indigo-300" />
                  <span>{questions.length} questions</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end text-sm">
                  <Target className="h-4 w-4 text-indigo-300" />
                  <span>Pass: {test.passing_score}%</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end text-sm">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span>{test.attempt_count.toLocaleString()} attempts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No questions yet</h3>
            <p className="text-gray-500 text-sm">This test is being prepared. Check back soon.</p>
          </div>
        ) : (
          <TestInterface
            testId={test.id}
            questions={questions}
            durationMinutes={test.duration_minutes}
            passingScore={test.passing_score}
            cefrLevel={test.cefr_level}
          />
        )}
      </div>
    </div>
  );
}
