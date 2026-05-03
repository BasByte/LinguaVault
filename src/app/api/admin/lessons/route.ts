import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("course_id");
  if (!courseId) return NextResponse.json({ error: "course_id required" }, { status: 400 });

  const lessons = await prisma.lessons.findMany({
    where: { course_id: parseInt(courseId) },
    orderBy: { order_index: "asc" },
    select: {
      id: true, title: true, lesson_type: true, order_index: true,
      duration_minutes: true, is_published: true, content: true, media_url: true,
    },
  });

  return NextResponse.json({ lessons });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { course_id, title, content, lesson_type, duration_minutes, media_url } = body;
  if (!course_id || !title) return NextResponse.json({ error: "course_id and title required" }, { status: 400 });

  const last = await prisma.lessons.findFirst({
    where: { course_id: parseInt(course_id) },
    orderBy: { order_index: "desc" },
    select: { order_index: true },
  });

  const lesson = await prisma.lessons.create({
    data: {
      course_id: parseInt(course_id),
      title,
      content: content || null,
      lesson_type: lesson_type || "lesson",
      duration_minutes: duration_minutes ? parseInt(duration_minutes) : 0,
      media_url: media_url || null,
      order_index: (last?.order_index ?? -1) + 1,
    },
  });

  return NextResponse.json({ lesson }, { status: 201 });
}
