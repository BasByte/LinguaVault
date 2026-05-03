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

    const [enrollments, attempts, courseSummary, testSummary] = await Promise.all([
      prisma.$queryRaw<{
        user_id: number; user_name: string; user_email: string;
        course_id: number; course_title: string; flag_emoji: string;
        progress_percentage: number; enrolled_at: Date; completed_at: Date | null;
      }[]>`
        SELECT u.id as user_id, u.name as user_name, u.email as user_email,
               c.id as course_id, c.title as course_title, l.flag_emoji,
               e.progress_percentage, e.enrolled_at, e.completed_at
        FROM enrollments e
        JOIN users u ON e.user_id = u.id
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN languages l ON c.language_id = l.id
        WHERE c.educator_id = ${educatorId}
        ORDER BY e.enrolled_at DESC
        LIMIT 100
      `,
      prisma.$queryRaw<{
        user_id: number; user_name: string; user_email: string;
        test_id: number; test_title: string; cefr_level: string;
        percentage: number; cefr_result: string; completed_at: Date;
      }[]>`
        SELECT u.id as user_id, u.name as user_name, u.email as user_email,
               t.id as test_id, t.title as test_title, t.cefr_level,
               ta.percentage::float as percentage, ta.cefr_result, ta.completed_at
        FROM test_attempts ta
        JOIN tests t ON ta.test_id = t.id
        JOIN users u ON ta.user_id = u.id
        WHERE t.educator_id = ${educatorId} AND ta.status = 'completed'
        ORDER BY ta.completed_at DESC
        LIMIT 200
      `,
      prisma.courses.findMany({
        where: { educator_id: educatorId },
        select: {
          id: true, title: true, enrollment_count: true,
          languages: { select: { flag_emoji: true } },
          _count: { select: { lessons: { where: { is_published: true } } } },
        },
        orderBy: { enrollment_count: "desc" },
      }),
      prisma.tests.findMany({
        where: { educator_id: educatorId },
        select: {
          id: true, title: true, cefr_level: true, attempt_count: true,
          languages: { select: { flag_emoji: true } },
        },
        orderBy: { attempt_count: "desc" },
      }),
    ]);

    const uniqueStudentIds = new Set([
      ...enrollments.map((e) => e.user_id),
      ...attempts.map((a) => a.user_id),
    ]);

    return NextResponse.json({
      summary: {
        total_students: uniqueStudentIds.size,
        total_enrollments: enrollments.length,
        total_attempts: attempts.length,
        avg_score:
          attempts.length > 0
            ? Math.round(attempts.reduce((s, a) => s + Number(a.percentage), 0) / attempts.length)
            : 0,
      },
      enrollments,
      attempts,
      courses: courseSummary.map((c) => ({
        ...c,
        flag_emoji: c.languages?.flag_emoji,
        lesson_count: c._count.lessons,
      })),
      tests: testSummary.map((t) => ({ ...t, flag_emoji: t.languages?.flag_emoji })),
    });
  } catch (err) {
    console.error("Students GET error:", err);
    return NextResponse.json({ error: "Failed to fetch student data" }, { status: 500 });
  }
}
