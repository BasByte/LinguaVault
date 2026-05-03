import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import CoursesTable from "@/components/educator/CoursesTable";
import { Plus } from "lucide-react";

export default async function CoursesPage() {
  const session = await getSession();
  if (!session) return null;

  const courses = await prisma.courses.findMany({
    where: { educator_id: session.id },
    orderBy: { created_at: "desc" },
    include: {
      languages: { select: { name: true, flag_emoji: true } },
      _count: { select: { lessons: true } },
    },
  });

  const mapped = courses.map((c) => ({
    id: c.id,
    title: c.title,
    level: c.level,
    is_published: c.is_published,
    enrollment_count: c.enrollment_count,
    duration_minutes: c.duration_minutes,
    lesson_count: c._count.lessons,
    language_name: c.languages?.name ?? "",
    flag_emoji: c.languages?.flag_emoji ?? "🌐",
    created_at: c.created_at.toISOString(),
    rating: Number(c.rating),
  }));

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Courses</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{courses.length} course{courses.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link
          href="/educator/courses/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Course
        </Link>
      </div>
      <CoursesTable courses={mapped} />
    </div>
  );
}
