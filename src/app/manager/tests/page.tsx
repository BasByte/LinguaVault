import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";
import { FlaskConical, Plus } from "lucide-react";
import Link from "next/link";
import ManagerTestsTable from "@/components/manager/ManagerTestsTable";

export default async function ManagerTestsPage() {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_tests")) redirect("/manager");

  const tests = await prisma.tests.findMany({
    orderBy: { created_at: "desc" },
    include: {
      users: { select: { id: true, name: true } },
      languages: { select: { id: true, name: true, flag_emoji: true } },
      _count: { select: { test_questions: true, test_attempts: true } },
    },
  });

  const serialized = tests.map((t) => ({ ...t, created_at: t.created_at.toISOString(), updated_at: t.updated_at.toISOString() }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">Tests</h1>
            <p className="text-xs text-gray-500">{tests.length} total</p>
          </div>
        </div>
        <Link href="/manager/tests/new" className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="h-4 w-4" /> New Test
        </Link>
      </div>
      <ManagerTestsTable tests={serialized} />
    </div>
  );
}
