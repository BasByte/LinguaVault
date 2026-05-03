import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_courses"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, content, content_type, duration_minutes, order_index, is_published } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (content_type !== undefined) updateData.content_type = content_type;
  if (duration_minutes !== undefined) updateData.duration_minutes = parseInt(duration_minutes);
  if (order_index !== undefined) updateData.order_index = order_index;
  if (is_published !== undefined) updateData.is_published = is_published;

  const lesson = await prisma.lessons.update({ where: { id: parseInt(id) }, data: updateData });
  return NextResponse.json({ lesson });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_courses"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.lessons.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
