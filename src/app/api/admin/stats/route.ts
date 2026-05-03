import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, totalEducators, totalLearners,
      totalCourses, totalLessons, totalTests,
      totalAttempts, totalEnrollments,
      avgScoreResult, newUsers30d, attempts30d,
      roleBreakdown, cefrDistribution, topLanguages, recentUsers,
    ] = await Promise.all([
      prisma.users.count({ where: { is_active: true } }),
      prisma.users.count({ where: { role: "educator" } }),
      prisma.users.count({ where: { role: { in: ["free_tier", "standard"] } } }),
      prisma.courses.count({ where: { is_published: true } }),
      prisma.lessons.count({ where: { is_published: true } }),
      prisma.tests.count({ where: { is_published: true } }),
      prisma.test_attempts.count({ where: { status: "completed" } }),
      prisma.enrollments.count(),
      prisma.test_attempts.aggregate({ where: { status: "completed" }, _avg: { percentage: true } }),
      prisma.users.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
      prisma.test_attempts.count({ where: { status: "completed", completed_at: { gte: thirtyDaysAgo } } }),
      prisma.$queryRaw<{ role: string; count: bigint }[]>`
        SELECT role, COUNT(*) as count FROM users WHERE is_active = true GROUP BY role ORDER BY count DESC
      `,
      prisma.$queryRaw<{ cefr_result: string; count: bigint }[]>`
        SELECT cefr_result, COUNT(*) as count FROM test_attempts WHERE status = 'completed' AND cefr_result IS NOT NULL GROUP BY cefr_result ORDER BY cefr_result
      `,
      prisma.$queryRaw<{ name: string; flag_emoji: string; course_count: bigint; total_enrollments: bigint }[]>`
        SELECT l.name, l.flag_emoji, COUNT(c.id) as course_count, COALESCE(SUM(c.enrollment_count), 0) as total_enrollments
        FROM languages l LEFT JOIN courses c ON c.language_id = l.id
        GROUP BY l.id, l.name, l.flag_emoji ORDER BY total_enrollments DESC LIMIT 6
      `,
      prisma.users.findMany({
        orderBy: { created_at: "desc" },
        take: 8,
        select: { id: true, name: true, email: true, role: true, created_at: true },
      }),
    ]);

    return NextResponse.json({
      stats: {
        total_users: totalUsers,
        total_educators: totalEducators,
        total_learners: totalLearners,
        total_courses: totalCourses,
        total_lessons: totalLessons,
        total_tests: totalTests,
        total_attempts: totalAttempts,
        total_enrollments: totalEnrollments,
        avg_test_score: Number(avgScoreResult._avg.percentage ?? 0),
        new_users_30d: newUsers30d,
        attempts_30d: attempts30d,
      },
      roleBreakdown: roleBreakdown.map((r) => ({ role: r.role, count: Number(r.count) })),
      cefrDistribution: cefrDistribution.map((d) => ({ cefr_result: d.cefr_result, count: Number(d.count) })),
      topLanguages: topLanguages.map((l) => ({
        name: l.name,
        flag_emoji: l.flag_emoji,
        course_count: Number(l.course_count),
        total_enrollments: Number(l.total_enrollments),
      })),
      recentUsers,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
