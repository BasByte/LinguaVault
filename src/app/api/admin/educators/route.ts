import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const educators = await prisma.users.findMany({
    where: { role: "educator" },
    orderBy: { created_at: "desc" },
    select: {
      id: true, name: true, email: true, is_active: true, created_at: true, avatar_url: true,
      _count: { select: { courses: true, tests: true } },
      courses: {
        select: {
          id: true, title: true, is_published: true, enrollment_count: true,
          _count: { select: { enrollments: true } },
        },
      },
      tests: {
        select: { id: true, title: true, is_published: true, attempt_count: true },
      },
    },
  });

  const enriched = educators.map((e) => {
    const totalEnrollments = e.courses.reduce((s, c) => s + (c.enrollment_count ?? 0), 0);
    const publishedCourses = e.courses.filter((c) => c.is_published).length;
    const publishedTests = e.tests.filter((t) => t.is_published).length;
    const totalAttempts = e.tests.reduce((s, t) => s + (t.attempt_count ?? 0), 0);
    return {
      id: e.id, name: e.name, email: e.email, is_active: e.is_active,
      created_at: e.created_at, avatar_url: e.avatar_url,
      total_courses: e._count.courses, published_courses: publishedCourses,
      total_tests: e._count.tests, published_tests: publishedTests,
      total_enrollments: totalEnrollments, total_attempts: totalAttempts,
    };
  });

  // Platform-wide avg score per educator
  const scores = await prisma.$queryRaw<{ educator_id: number; avg_score: number }[]>`
    SELECT t.educator_id, AVG(ta.percentage)::float as avg_score
    FROM test_attempts ta
    JOIN tests t ON t.id = ta.test_id
    WHERE ta.status = 'completed' AND t.educator_id IS NOT NULL
    GROUP BY t.educator_id
  `;

  const scoreMap = Object.fromEntries(scores.map((s) => [s.educator_id, Math.round(s.avg_score)]));

  return NextResponse.json({
    educators: enriched.map((e) => ({ ...e, avg_test_score: scoreMap[e.id] ?? null })),
  });
}
