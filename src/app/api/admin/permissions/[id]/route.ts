import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = parseInt(id);
  const body = await req.json();
  const { role, manage_students, manage_educators, manage_courses, manage_tests } = body;

  // Update role if provided
  if (role !== undefined) {
    const allowed = ["free_tier", "standard", "educator", "manager", "admin"];
    if (!allowed.includes(role))
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    if (userId === session.id && role !== "admin")
      return NextResponse.json({ error: "Cannot demote your own admin account" }, { status: 400 });

    await prisma.users.update({
      where: { id: userId },
      data: { role, updated_at: new Date() },
    });

    // If demoted from manager, clean up permissions
    if (role !== "manager") {
      await query("DELETE FROM manager_permissions WHERE user_id = $1", [userId]);
      const user = await prisma.users.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, is_active: true } });
      return NextResponse.json({ user });
    }
  }

  // Upsert manager permissions
  const permsProvided = [manage_students, manage_educators, manage_courses, manage_tests].some(v => v !== undefined);
  if (permsProvided) {
    await query(`
      INSERT INTO manager_permissions (user_id, manage_students, manage_educators, manage_courses, manage_tests, granted_by, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, now())
      ON CONFLICT (user_id) DO UPDATE SET
        manage_students = COALESCE($2, manager_permissions.manage_students),
        manage_educators = COALESCE($3, manager_permissions.manage_educators),
        manage_courses = COALESCE($4, manager_permissions.manage_courses),
        manage_tests = COALESCE($5, manager_permissions.manage_tests),
        granted_by = $6,
        updated_at = now()
    `, [userId, manage_students ?? null, manage_educators ?? null, manage_courses ?? null, manage_tests ?? null, session.id]);
  }

  const user = await prisma.users.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true, is_active: true } });
  return NextResponse.json({ user });
}
