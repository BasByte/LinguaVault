import { queryOne } from "./db";
import type { SessionUser } from "./auth";

export interface ManagerPerms {
  manage_students: boolean;
  manage_educators: boolean;
  manage_courses: boolean;
  manage_tests: boolean;
}

export const ALL_PERMS: ManagerPerms = {
  manage_students: true,
  manage_educators: true,
  manage_courses: true,
  manage_tests: true,
};

export const NO_PERMS: ManagerPerms = {
  manage_students: false,
  manage_educators: false,
  manage_courses: false,
  manage_tests: false,
};

export async function getManagerPerms(userId: number): Promise<ManagerPerms> {
  const row = await queryOne<ManagerPerms>(
    "SELECT manage_students, manage_educators, manage_courses, manage_tests FROM manager_permissions WHERE user_id = $1",
    [userId]
  );
  return row ?? NO_PERMS;
}

export async function checkManagerPerm(
  session: SessionUser | null,
  perm: keyof ManagerPerms
): Promise<boolean> {
  if (!session) return false;
  if (session.role === "admin") return true;
  if (session.role !== "manager") return false;
  const perms = await getManagerPerms(session.id);
  return perms[perm];
}

export function isManagerOrAdmin(session: SessionUser | null): boolean {
  return session?.role === "manager" || session?.role === "admin";
}
