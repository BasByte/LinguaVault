import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_students"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;

  const students = await prisma.users.findMany({
    where: {
      role: { in: ["free_tier", "standard"] },
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {}),
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true, name: true, email: true, role: true, is_active: true,
      total_points: true, streak_days: true, created_at: true,
      _count: { select: { enrollments: true, test_attempts: true } },
      test_attempts: { where: { status: "completed" }, orderBy: { completed_at: "desc" }, take: 1, select: { percentage: true, cefr_result: true } },
    },
  });

  return NextResponse.json({ students });
}
