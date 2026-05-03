import { prisma } from "@/lib/prisma";
import AdminCoursesTable from "@/components/admin/AdminCoursesTable";
import { BookOpen } from "lucide-react";

export default async function AdminCoursesPage() {
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
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Courses</h1>
          <p className="text-xs text-gray-500">{courses.length} total courses</p>
        </div>
      </div>
      <AdminCoursesTable courses={serialized} />
    </div>
  );
}
