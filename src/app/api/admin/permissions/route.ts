import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

interface ManagerRow {
  id: number; name: string; email: string; is_active: boolean; created_at: string;
  manage_students: boolean | null; manage_educators: boolean | null;
  manage_courses: boolean | null; manage_tests: boolean | null;
  granted_by_name: string | null;
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const managers = await query<ManagerRow>(`
    SELECT u.id, u.name, u.email, u.is_active, u.created_at,
      mp.manage_students, mp.manage_educators, mp.manage_courses, mp.manage_tests,
      g.name as granted_by_name
    FROM users u
    LEFT JOIN manager_permissions mp ON mp.user_id = u.id
    LEFT JOIN users g ON g.id = mp.granted_by
    WHERE u.role = 'manager'
    ORDER BY u.created_at DESC
  `);

  return NextResponse.json({ managers });
}
