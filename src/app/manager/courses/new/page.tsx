import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";
import CourseEditor from "@/components/educator/CourseEditor";
import { BookOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function ManagerNewCoursePage() {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_courses")) redirect("/manager");

  const languages = await prisma.languages.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, flag_emoji: true } });

  const emptyCourse = { id: 0, title: "", description: null, cefr_level: "A1", language_id: 0, level: "beginner", duration_minutes: 0, is_published: false, is_public: false, flag_emoji: "📘", language_name: "" };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/manager/courses" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">New Course</h1>
          <p className="text-xs text-gray-500">Create a new course</p>
        </div>
      </div>
      <CourseEditor course={emptyCourse} lessons={[]} languages={languages} apiBase="/api/manager" redirectOnCreate="/manager/courses" />
    </div>
  );
}
