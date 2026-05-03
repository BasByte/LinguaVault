import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);

    const course = await prisma.courses.findFirst({
      where: { id: courseId, is_published: true },
      include: {
        languages: { select: { name: true, code: true, flag_emoji: true } },
        users: { select: { name: true, bio: true } },
      },
    });

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const lessons = await prisma.lessons.findMany({
      where: { course_id: courseId, is_published: true },
      orderBy: { order_index: "asc" },
    });

    return NextResponse.json({
      course: {
        ...course,
        language_name: course.languages?.name,
        language_code: course.languages?.code,
        flag_emoji: course.languages?.flag_emoji,
        educator_name: course.users?.name,
        educator_bio: course.users?.bio,
      },
      lessons,
    });
  } catch (err) {
    console.error("Course GET error:", err);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const courseId = parseInt(id);
    const { is_published } = await req.json();

    const course = await prisma.courses.findFirst({
      where: {
        id: courseId,
        ...(session.role !== "admin" ? { educator_id: session.id } : {}),
      },
    });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const updated = await prisma.courses.update({
      where: { id: courseId },
      data: { is_published, updated_at: new Date() },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}
