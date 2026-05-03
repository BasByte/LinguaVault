import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import ManagerStudentsTable from "@/components/manager/ManagerStudentsTable";

export default async function ManagerStudentsPage() {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_students")) redirect("/manager");

  const students = await prisma.users.findMany({
    where: { role: { in: ["free_tier", "standard"] } },
    orderBy: { created_at: "desc" },
    select: {
      id: true, name: true, email: true, role: true, is_active: true,
      total_points: true, streak_days: true, created_at: true,
      _count: { select: { enrollments: true, test_attempts: true } },
      test_attempts: { where: { status: "completed" }, orderBy: { completed_at: "desc" }, take: 1, select: { percentage: true, cefr_result: true } },
    },
  });

  const serialized = students.map((s) => ({
    ...s,
    created_at: s.created_at.toISOString(),
    test_attempts: s.test_attempts.map((t) => ({ ...t, percentage: t.percentage ? Number(t.percentage) : null })),
  }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Students</h1>
          <p className="text-xs text-gray-500">{students.length} registered students</p>
        </div>
      </div>
      <ManagerStudentsTable students={serialized} />
    </div>
  );
}
