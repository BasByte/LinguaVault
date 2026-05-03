import { prisma } from "@/lib/prisma";
import LanguagesManager from "@/components/admin/LanguagesManager";
import { Globe } from "lucide-react";

export default async function AdminLanguagesPage() {
  const languages = await prisma.languages.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { courses: true, tests: true } } },
  });

  const serialized = languages.map((l) => ({
    ...l,
    created_at: l.created_at.toISOString(),
  }));

  const activeCount = languages.filter((l) => l.is_active).length;
  const totalCourses = languages.reduce((s, l) => s + l._count.courses, 0);
  const totalTests = languages.reduce((s, l) => s + l._count.tests, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
          <Globe className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Languages</h1>
          <p className="text-xs text-gray-500">
            {activeCount} of {languages.length} active · used in {totalCourses} courses and {totalTests} tests
          </p>
        </div>
      </div>

      <LanguagesManager languages={serialized} />
    </div>
  );
}
