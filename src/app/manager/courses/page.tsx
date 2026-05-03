import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";
import { BookOpen, Plus } from "lucide-react";
import Link from "next/link";
import ManagerCoursesTable from "@/components/manager/ManagerCoursesTable";

export default async function ManagerCoursesPage() {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_courses")) redirect("/manager");

  const courses = await prisma.courses.findMany({
    orderBy: { created_at: "desc" },
    include: {
      users: { select: { id: true, name: true } },
      languages: { select: { id: true, name: true, flag_emoji: true } },
      _count: { select: { lessons: true, enrollments: true } },
    },
  });

  const serialized = courses.map((c) => ({
    ...c,
    rating: c.rating ? Number(c.rating) : null,
    created_at: c.created_at.toISOString(),
    updated_at: c.updated_at.toISOString(),
  }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Courses</h1>
            <p className="text-xs text-gray-500">{courses.length} total</p>
          </div>
        </div>
        <Link href="/manager/courses/new" className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" /> New Course
        </Link>
      </div>
      <ManagerCoursesTable courses={serialized} />
    </div>
  );
}
