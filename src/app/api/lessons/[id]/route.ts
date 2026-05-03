import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lessonId = parseInt(id);

    const lesson = await prisma.lessons.findFirst({
      where: { id: lessonId, is_published: true },
      include: { courses: { select: { id: true, title: true } } },
    });

    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    const courseId = lesson.course_id!;
    const orderIndex = lesson.order_index;

    const [exercises, prev, next] = await Promise.all([
      prisma.exercises.findMany({
        where: { lesson_id: lessonId },
        orderBy: { order_index: "asc" },
      }),
      prisma.lessons.findFirst({
        where: { course_id: courseId, order_index: { lt: orderIndex }, is_published: true },
        orderBy: { order_index: "desc" },
        select: { id: true, title: true },
      }),
      prisma.lessons.findFirst({
        where: { course_id: courseId, order_index: { gt: orderIndex }, is_published: true },
        orderBy: { order_index: "asc" },
        select: { id: true, title: true },
      }),
    ]);

    return NextResponse.json({
      lesson: {
        ...lesson,
        course_title: lesson.courses?.title,
        course_id: lesson.courses?.id,
      },
      exercises,
      prev,
      next,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 });
  }
}
