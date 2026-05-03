import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TestEditor from "@/components/educator/TestEditor";
import BulkQuestionsIO from "@/components/admin/BulkQuestionsIO";
import { FlaskConical, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminTestEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const testId = parseInt(id);

  const [test, questions, languagesResult] = await Promise.all([
    prisma.tests.findUnique({
      where: { id: testId },
      include: { languages: { select: { name: true, flag_emoji: true } } },
    }),
    prisma.test_questions.findMany({
      where: { test_id: testId },
      orderBy: { order_index: "asc" },
    }),
    prisma.languages.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, flag_emoji: true } }),
  ]);

  const languages = languagesResult.map((l) => ({
    ...l,
    flag_emoji: l.flag_emoji ?? "🌐",
  }));

  if (!test) notFound();

  const testForEditor = {
    id: test.id,
    title: test.title,
    description: test.description,
    cefr_level: test.cefr_level,
    language_id: test.language_id ?? 0,
    duration_minutes: test.duration_minutes,
    passing_score: test.passing_score,
    is_published: test.is_published,
    is_public: test.is_public,
    flag_emoji: test.languages?.flag_emoji ?? "📋",
    language_name: test.languages?.name ?? "No language",
  };

  const questionsForEditor = questions.map((q) => ({
    id: q.id,
    question: q.question,
    question_type: q.question_type,
    options: q.options as string[] | null,
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    points: q.points,
    order_index: q.order_index,
  }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/tests" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
          <FlaskConical className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 truncate max-w-sm">{test.title}</h1>
          <p className="text-xs text-gray-500">Edit test details, manage questions, or bulk import from CSV</p>
        </div>
      </div>

      <TestEditor
        test={testForEditor}
        questions={questionsForEditor}
        languages={languages}
        apiBase="/api/admin"
      />

      <BulkQuestionsIO
        testId={testId}
        testTitle={test.title}
        questions={questionsForEditor}
        apiBase="/api/admin"
      />
    </div>
  );
}
