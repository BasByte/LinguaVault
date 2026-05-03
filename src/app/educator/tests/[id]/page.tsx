import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import TestEditor from "@/components/educator/TestEditor";
import { getCEFRColor, cn } from "@/lib/utils";
import { ArrowLeft, Eye } from "lucide-react";

export default async function TestEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (!["educator", "admin"].includes(session.role)) redirect("/");

  const { id } = await params;
  const testId = parseInt(id);
  if (isNaN(testId)) notFound();

  const [test, languages] = await Promise.all([
    prisma.tests.findFirst({
      where: { id: testId, ...(session.role !== "admin" ? { educator_id: session.id } : {}) },
      include: { languages: { select: { name: true, flag_emoji: true } } },
    }),
    prisma.languages.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!test) notFound();

  const questions = await prisma.test_questions.findMany({
    where: { test_id: testId },
    orderBy: { order_index: "asc" },
  });

  const testData = {
    id: test.id,
    title: test.title,
    description: test.description,
    cefr_level: test.cefr_level,
    language_id: test.language_id!,
    duration_minutes: test.duration_minutes,
    passing_score: test.passing_score,
    is_published: test.is_published,
    is_public: test.is_public,
    flag_emoji: test.languages?.flag_emoji ?? "🌐",
    language_name: test.languages?.name ?? "",
  };

  const questionsData = questions.map((q) => ({
    id: q.id,
    question: q.question,
    question_type: q.question_type,
    options: q.options as string[] | null,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    points: q.points,
    order_index: q.order_index,
  }));

  const languagesData = languages.map((l) => ({
    id: l.id,
    name: l.name,
    flag_emoji: l.flag_emoji ?? "🌐",
  }));

  const totalPoints = questionsData.reduce((s, q) => s + q.points, 0);

  return (
    <div className="min-h-full">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/educator/tests" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-2xl">{testData.flag_emoji}</span>
            <div>
              <h1 className="font-black text-lg text-gray-900 dark:text-white leading-tight">{testData.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold border", getCEFRColor(testData.cefr_level))}>
                  {testData.cefr_level}
                </span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", testData.is_published ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500")}>
                  {testData.is_published ? "● Live" : "○ Draft"}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {questionsData.length} questions · {totalPoints} pts · {testData.duration_minutes}min
                </span>
              </div>
            </div>
          </div>
          {testData.is_published && (
            <Link href={`/assess/tests/${testId}`} target="_blank"
              className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              <Eye className="h-4 w-4" /> Preview
            </Link>
          )}
        </div>
      </div>

      <TestEditor
        test={testData}
        questions={questionsData}
        languages={languagesData}
      />
    </div>
  );
}
