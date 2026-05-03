import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const courseId = parseInt(req.nextUrl.searchParams.get("course_id") || "0");
    if (!courseId) return NextResponse.json({ error: "course_id required" }, { status: 400 });

    const course = await prisma.courses.findFirst({
      where: { id: courseId, ...(session.role !== "admin" ? { educator_id: session.id } : {}) },
    });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const lessons = await prisma.lessons.findMany({
      where: { course_id: courseId },
      orderBy: { order_index: "asc" },
    });
    return NextResponse.json(lessons);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { course_id, title, content, lesson_type, duration_minutes, is_published, order_index } = body;
    if (!course_id || !title) return NextResponse.json({ error: "course_id and title required" }, { status: 400 });

    const course = await prisma.courses.findFirst({
      where: { id: course_id, ...(session.role !== "admin" ? { educator_id: session.id } : {}) },
    });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const count = await prisma.lessons.count({ where: { course_id } });
    const lesson = await prisma.lessons.create({
      data: {
        course_id,
        title,
        content: content || null,
        lesson_type: lesson_type || "lesson",
        duration_minutes: duration_minutes || 10,
        is_published: is_published ?? false,
        order_index: order_index ?? count,
      },
    });
    return NextResponse.json(lesson, { status: 201 });
  } catch (err) {
    console.error("Lesson POST error:", err);
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}
