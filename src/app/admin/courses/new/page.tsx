import { prisma } from "@/lib/prisma";
import AdminNewCourseForm from "@/components/admin/AdminNewCourseForm";
import { BookOpen, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminNewCoursePage() {
  const [languagesResult, educators] = await Promise.all([
    prisma.languages.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, flag_emoji: true } }),
    prisma.users.findMany({ where: { role: "educator", is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // Transform languages to ensure flag_emoji is never null (matches Language interface)
  const languages = languagesResult.map((l) => ({
    ...l,
    flag_emoji: l.flag_emoji ?? "",
  }));

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/courses" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">New Course</h1>
          <p className="text-xs text-gray-500">Create a new course and assign an educator</p>
        </div>
      </div>
      <AdminNewCourseForm languages={languages} educators={educators} />
    </div>
  );
}
