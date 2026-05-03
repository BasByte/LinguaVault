import { prisma } from "@/lib/prisma";
import { query } from "@/lib/db";
import PermissionsManager from "@/components/admin/PermissionsManager";
import { UserCog } from "lucide-react";

interface ManagerRow {
  id: number; name: string; email: string; is_active: boolean; created_at: string;
  manage_students: boolean | null; manage_educators: boolean | null;
  manage_courses: boolean | null; manage_tests: boolean | null;
  granted_by_name: string | null;
}

export default async function AdminPermissionsPage() {
  const [managers, allUsers] = await Promise.all([
    query<ManagerRow>(`
      SELECT u.id, u.name, u.email, u.is_active, u.created_at::text,
        mp.manage_students, mp.manage_educators, mp.manage_courses, mp.manage_tests,
        g.name as granted_by_name
      FROM users u
      LEFT JOIN manager_permissions mp ON mp.user_id = u.id
      LEFT JOIN users g ON g.id = mp.granted_by
      WHERE u.role = 'manager'
      ORDER BY u.created_at DESC
    `),
    prisma.users.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true, is_active: true },
    }),
  ]);

  const managerCount = managers.length;
  const totalPerms = managers.reduce((s, m) => s + [m.manage_students, m.manage_educators, m.manage_courses, m.manage_tests].filter(Boolean).length, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
          <UserCog className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Manager Permissions</h1>
          <p className="text-xs text-gray-500">
            {managerCount} manager{managerCount !== 1 ? "s" : ""} · {totalPerms} permission{totalPerms !== 1 ? "s" : ""} granted
          </p>
        </div>
      </div>

      <PermissionsManager managers={managers} allUsers={allUsers} />
    </div>
  );
}
