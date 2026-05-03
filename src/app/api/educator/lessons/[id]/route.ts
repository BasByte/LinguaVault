import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getOwnedLesson(session: { id: number; role: string }, lessonId: number) {
  const lesson = await prisma.lessons.findFirst({
    where: { id: lessonId },
    include: { courses: { select: { educator_id: true } } },
  });
  if (!lesson) return null;
  if (session.role !== "admin" && lesson.courses?.educator_id !== session.id) return null;
  return lesson;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const lessonId = parseInt(id);
    const lesson = await getOwnedLesson(session, lessonId);
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    const body = await req.json();
    const { title, content, lesson_type, duration_minutes, is_published, order_index, media_url } = body;
    const updated = await prisma.lessons.update({
      where: { id: lessonId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(lesson_type !== undefined && { lesson_type }),
        ...(duration_minutes !== undefined && { duration_minutes }),
        ...(is_published !== undefined && { is_published }),
        ...(order_index !== undefined && { order_index }),
        ...(media_url !== undefined && { media_url }),
        updated_at: new Date(),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const lessonId = parseInt(id);
    const lesson = await getOwnedLesson(session, lessonId);
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    await prisma.lessons.delete({ where: { id: lessonId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
  }
}
