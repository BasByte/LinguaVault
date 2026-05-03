import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_tests"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const test = await prisma.tests.findUnique({
    where: { id: parseInt(id) },
    include: { languages: { select: { name: true, flag_emoji: true } } },
  });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ test });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_tests"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, description, language_id, educator_id, cefr_level, duration_minutes, passing_score, is_published, is_public } = body;

  const updateData: Record<string, unknown> = { updated_at: new Date() };
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (language_id !== undefined) updateData.language_id = language_id ? parseInt(language_id) : null;
  if (educator_id !== undefined) updateData.educator_id = educator_id ? parseInt(educator_id) : null;
  if (cefr_level !== undefined) updateData.cefr_level = cefr_level;
  if (duration_minutes !== undefined) updateData.duration_minutes = parseInt(duration_minutes);
  if (passing_score !== undefined) updateData.passing_score = parseInt(passing_score);
  if (is_published !== undefined) updateData.is_published = is_published;
  if (is_public !== undefined) updateData.is_public = is_public;

  const test = await prisma.tests.update({ where: { id: parseInt(id) }, data: updateData });
  return NextResponse.json({ test });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_tests"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.tests.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
