import { prisma } from "@/lib/prisma";
import UsersTable from "@/components/admin/UsersTable";
import { Users } from "lucide-react";

export default async function AdminUsersPage() {
  const users = await prisma.users.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true, name: true, email: true, role: true, is_active: true,
      total_points: true, streak_days: true, created_at: true, avatar_url: true,
      _count: { select: { enrollments: true, test_attempts: true, courses: true } },
    },
  });

  const serialized = users.map((u) => ({ ...u, created_at: u.created_at.toISOString() }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
          <Users className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Users</h1>
          <p className="text-xs text-gray-500">{users.length} total accounts</p>
        </div>
      </div>
      <UsersTable users={serialized} />
    </div>
  );
}
