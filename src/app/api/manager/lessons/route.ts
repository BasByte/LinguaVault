import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_courses"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get("course_id");
  if (!courseId) return NextResponse.json({ error: "course_id required" }, { status: 400 });

  const lessons = await prisma.lessons.findMany({
    where: { course_id: parseInt(courseId) },
    orderBy: { order_index: "asc" },
  });

  return NextResponse.json({ lessons });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_courses"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { course_id, title, content, lesson_type, duration_minutes, order_index } = body;
  if (!course_id || !title) return NextResponse.json({ error: "course_id and title required" }, { status: 400 });

  const lesson = await prisma.lessons.create({
    data: {
      course_id: parseInt(course_id),
      title,
      content: content || null,
      lesson_type: lesson_type || "text",
      duration_minutes: duration_minutes ? parseInt(duration_minutes) : 0,
      order_index: order_index ?? 0,
    },
  });

  return NextResponse.json({ lesson }, { status: 201 });
}
