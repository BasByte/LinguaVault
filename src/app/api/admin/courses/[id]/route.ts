import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, description, language_id, educator_id, level, duration_minutes, tags, is_published, is_public } = body;

  const updateData: Record<string, unknown> = { updated_at: new Date() };
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (language_id !== undefined) updateData.language_id = language_id ? parseInt(language_id) : null;
  if (educator_id !== undefined) updateData.educator_id = educator_id ? parseInt(educator_id) : null;
  if (level !== undefined) updateData.level = level;
  if (duration_minutes !== undefined) updateData.duration_minutes = parseInt(duration_minutes);
  if (tags !== undefined) updateData.tags = tags;
  if (is_published !== undefined) updateData.is_published = is_published;
  if (is_public !== undefined) updateData.is_public = is_public;

  const course = await prisma.courses.update({
    where: { id: parseInt(id) },
    data: updateData,
  });

  return NextResponse.json({ course });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.courses.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
