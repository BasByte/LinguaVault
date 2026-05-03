import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, content, lesson_type, duration_minutes, media_url, is_published, order_index } = body;

  const updateData: Record<string, unknown> = { updated_at: new Date() };
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (lesson_type !== undefined) updateData.lesson_type = lesson_type;
  if (duration_minutes !== undefined) updateData.duration_minutes = parseInt(duration_minutes);
  if (media_url !== undefined) updateData.media_url = media_url;
  if (is_published !== undefined) updateData.is_published = is_published;
  if (order_index !== undefined) updateData.order_index = order_index;

  const lesson = await prisma.lessons.update({ where: { id: parseInt(id) }, data: updateData });
  return NextResponse.json({ lesson });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.lessons.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
