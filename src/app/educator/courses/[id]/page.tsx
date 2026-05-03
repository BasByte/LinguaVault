import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import Link from "next/link";
import CourseEditor from "@/components/educator/CourseEditor";
import { getLevelColor, cn } from "@/lib/utils";
import { ArrowLeft, Eye } from "lucide-react";

export default async function CourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (!["educator", "admin"].includes(session.role)) redirect("/");

  const { id } = await params;
  const courseId = parseInt(id);
  if (isNaN(courseId)) notFound();

  const [course, languages] = await Promise.all([
    prisma.courses.findFirst({
      where: { id: courseId, ...(session.role !== "admin" ? { educator_id: session.id } : {}) },
      include: { languages: { select: { name: true, flag_emoji: true } } },
    }),
    prisma.languages.findMany({ where: { is_active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!course) notFound();

  const lessons = await prisma.lessons.findMany({
    where: { course_id: courseId },
    orderBy: { order_index: "asc" },
  });

  const courseData = {
    id: course.id,
    title: course.title,
    description: course.description,
    level: course.level,
    language_id: course.language_id!,
    duration_minutes: course.duration_minutes,
    is_published: course.is_published,
    is_public: course.is_public,
    tags: course.tags as string[] | null,
    flag_emoji: course.languages?.flag_emoji ?? "🌐",
    language_name: course.languages?.name ?? "",
  };

  const lessonsData = lessons.map((l) => ({
    id: l.id,
    title: l.title,
    lesson_type: l.lesson_type,
    duration_minutes: l.duration_minutes,
    is_published: l.is_published,
    order_index: l.order_index,
    content: l.content,
  }));

  const languagesData = languages.map((l) => ({
    id: l.id,
    name: l.name,
    flag_emoji: l.flag_emoji ?? "🌐",
  }));

  return (
    <div className="min-h-full">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/educator/courses" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-2xl">{courseData.flag_emoji}</span>
            <div>
              <h1 className="font-black text-lg text-gray-900 dark:text-white leading-tight">{courseData.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getLevelColor(courseData.level))}>
                  {courseData.level.replace("_", " ")}
                </span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", courseData.is_published ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500")}>
                  {courseData.is_published ? "● Live" : "○ Draft"}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{lessonsData.length} lessons</span>
              </div>
            </div>
          </div>
          {courseData.is_published && (
            <Link href={`/learn/courses/${courseId}`} target="_blank"
              className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              <Eye className="h-4 w-4" /> Preview
            </Link>
          )}
        </div>
      </div>

      <CourseEditor
        course={courseData}
        lessons={lessonsData}
        languages={languagesData}
      />
    </div>
  );
}
