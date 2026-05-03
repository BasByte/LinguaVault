import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CourseEditor from "@/components/educator/CourseEditor";
import { BookOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminCourseEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseId = parseInt(id);

  const [course, lessonsResult, languagesResult] = await Promise.all([
    prisma.courses.findUnique({
      where: { id: courseId },
      include: { languages: { select: { name: true, flag_emoji: true } } },
    }),
    prisma.lessons.findMany({
      where: { course_id: courseId },
      orderBy: { order_index: "asc" },
      select: {
        id: true, title: true, lesson_type: true, order_index: true,
        duration_minutes: true, is_published: true, content: true, media_url: true,
      },
    }),
    prisma.languages.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, flag_emoji: true } }),
  ]);

  // Transform lessons to match Lesson interface (handle null values)
  const lessons = lessonsResult.map((l) => ({
    ...l,
    duration_minutes: l.duration_minutes ?? 0,
    content: l.content ?? "",
  }));

  // Transform languages to ensure flag_emoji is never null (matches Language interface)
  const languages = languagesResult.map((l) => ({
    ...l,
    flag_emoji: l.flag_emoji ?? "",
  }));

  if (!course) notFound();

  const courseForEditor = {
    id: course.id,
    title: course.title,
    description: course.description,
    level: course.level,
    language_id: course.language_id ?? 0,
    duration_minutes: course.duration_minutes ?? 0,
    is_published: course.is_published,
    is_public: course.is_public,
    tags: course.tags,
    flag_emoji: course.languages?.flag_emoji ?? "📚",
    language_name: course.languages?.name ?? "No language",
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/courses" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 truncate max-w-sm">{course.title}</h1>
          <p className="text-xs text-gray-500">Edit course details and manage lessons</p>
        </div>
      </div>

      <CourseEditor
        course={courseForEditor}
        lessons={lessons}
        languages={languages}
        apiBase="/api/admin"
      />
    </div>
  );
}
