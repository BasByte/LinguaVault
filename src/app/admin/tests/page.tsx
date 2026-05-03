import { prisma } from "@/lib/prisma";
import AdminTestsTable from "@/components/admin/AdminTestsTable";
import { FlaskConical } from "lucide-react";

export default async function AdminTestsPage() {
  const tests = await prisma.tests.findMany({
    orderBy: { created_at: "desc" },
    include: {
      users: { select: { id: true, name: true } },
      languages: { select: { id: true, name: true, flag_emoji: true } },
      _count: { select: { test_questions: true, test_attempts: true } },
    },
  });

  const serialized = tests.map((t) => ({
    ...t,
    created_at: t.created_at.toISOString(),
    updated_at: t.updated_at.toISOString(),
  }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
          <FlaskConical className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Tests</h1>
          <p className="text-xs text-gray-500">{tests.length} total tests</p>
        </div>
      </div>
      <AdminTestsTable tests={serialized} />
    </div>
  );
}
