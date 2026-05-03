import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const educatorId = session.id;

    const [
      totalCourses, publishedCourses, totalLessons,
      totalTests, publishedTests,
      enrollmentAgg, totalAttempts, avgScoreResult,
      myCourses, myTests, recentAttempts,
    ] = await Promise.all([
      prisma.courses.count({ where: { educator_id: educatorId } }),
      prisma.courses.count({ where: { educator_id: educatorId, is_published: true } }),
      prisma.lessons.count({ where: { courses: { educator_id: educatorId } } }),
      prisma.tests.count({ where: { educator_id: educatorId } }),
      prisma.tests.count({ where: { educator_id: educatorId, is_published: true } }),
      prisma.courses.aggregate({ where: { educator_id: educatorId }, _sum: { enrollment_count: true } }),
      prisma.test_attempts.count({ where: { tests: { educator_id: educatorId }, status: "completed" } }),
      prisma.test_attempts.aggregate({
        where: { tests: { educator_id: educatorId }, status: "completed" },
        _avg: { percentage: true },
      }),
      prisma.courses.findMany({
        where: { educator_id: educatorId },
        orderBy: { created_at: "desc" },
        take: 10,
        include: { languages: { select: { name: true, flag_emoji: true } } },
      }),
      prisma.tests.findMany({
        where: { educator_id: educatorId },
        orderBy: { created_at: "desc" },
        take: 10,
        include: {
          languages: { select: { name: true, flag_emoji: true } },
          _count: { select: { test_questions: true } },
        },
      }),
      prisma.$queryRaw<{
        id: number; user_name: string; test_title: string;
        percentage: number; cefr_result: string; completed_at: Date;
      }[]>`
        SELECT ta.id, u.name as user_name, t.title as test_title,
               ta.percentage, ta.cefr_result, ta.completed_at
        FROM test_attempts ta
        JOIN tests t ON ta.test_id = t.id
        JOIN users u ON ta.user_id = u.id
        WHERE t.educator_id = ${educatorId} AND ta.status = 'completed'
        ORDER BY ta.completed_at DESC
        LIMIT 10
      `,
    ]);

    return NextResponse.json({
      stats: {
        total_courses: totalCourses,
        published_courses: publishedCourses,
        total_lessons: totalLessons,
        total_tests: totalTests,
        published_tests: publishedTests,
        total_students: enrollmentAgg._sum.enrollment_count ?? 0,
        total_attempts: totalAttempts,
        avg_score: Number(avgScoreResult._avg.percentage ?? 0),
      },
      myCourses: myCourses.map((c) => ({
        ...c,
        language_name: c.languages?.name,
        flag_emoji: c.languages?.flag_emoji,
      })),
      myTests: myTests.map((t) => ({
        ...t,
        language_name: t.languages?.name,
        flag_emoji: t.languages?.flag_emoji,
        question_count: t._count.test_questions,
      })),
      recentAttempts,
    });
  } catch (err) {
    console.error("Educator stats error:", err);
    return NextResponse.json({ error: "Failed to fetch educator stats" }, { status: 500 });
  }
}
