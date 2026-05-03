import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;

  const students = await prisma.users.findMany({
    where: {
      role: { in: ["free_tier", "standard"] },
      ...(search
        ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true, name: true, email: true, role: true, is_active: true,
      total_points: true, streak_days: true, created_at: true,
      _count: { select: { enrollments: true, test_attempts: true } },
      test_attempts: {
        where: { status: "completed" },
        select: { percentage: true, cefr_result: true, completed_at: true },
        orderBy: { completed_at: "desc" },
        take: 1,
      },
    },
  });

  const summary = await prisma.$queryRaw<{ total: bigint; avg_score: number; total_enrollments: bigint; total_attempts: bigint }[]>`
    SELECT
      COUNT(DISTINCT u.id) as total,
      COALESCE(AVG(ta.percentage)::float, 0) as avg_score,
      COUNT(DISTINCT e.id) as total_enrollments,
      COUNT(DISTINCT ta.id) as total_attempts
    FROM users u
    LEFT JOIN enrollments e ON e.user_id = u.id
    LEFT JOIN test_attempts ta ON ta.user_id = u.id AND ta.status = 'completed'
    WHERE u.role IN ('free_tier', 'standard')
  `;

  const s = summary[0];

  return NextResponse.json({
    summary: {
      total_students: Number(s.total),
      avg_score: Math.round(s.avg_score),
      total_enrollments: Number(s.total_enrollments),
      total_attempts: Number(s.total_attempts),
    },
    students: students.map((st) => ({
      ...st,
      latest_score: st.test_attempts[0]?.percentage ? Math.round(Number(st.test_attempts[0].percentage)) : null,
      latest_cefr: st.test_attempts[0]?.cefr_result ?? null,
      test_attempts: undefined,
    })),
  });
}
