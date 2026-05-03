import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import TestsTable from "@/components/educator/TestsTable";
import { Plus } from "lucide-react";

export default async function TestsPage() {
  const session = await getSession();
  if (!session) return null;

  const tests = await prisma.tests.findMany({
    where: { educator_id: session.id },
    orderBy: { created_at: "desc" },
    include: {
      languages: { select: { name: true, flag_emoji: true } },
      _count: { select: { test_questions: true } },
    },
  });

  const mapped = tests.map((t) => ({
    id: t.id,
    title: t.title,
    cefr_level: t.cefr_level,
    is_published: t.is_published,
    attempt_count: t.attempt_count,
    duration_minutes: t.duration_minutes,
    passing_score: t.passing_score,
    question_count: t._count.test_questions,
    language_name: t.languages?.name ?? "",
    flag_emoji: t.languages?.flag_emoji ?? "🌐",
    created_at: t.created_at.toISOString(),
  }));

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Tests</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{tests.length} test{tests.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link
          href="/educator/tests/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Test
        </Link>
      </div>
      <TestsTable tests={mapped} />
    </div>
  );
}
