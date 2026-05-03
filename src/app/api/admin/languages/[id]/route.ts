import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, code, flag_emoji, description, is_active } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name.trim();
  if (code !== undefined) updateData.code = code.toLowerCase().trim();
  if (flag_emoji !== undefined) updateData.flag_emoji = flag_emoji?.trim() || null;
  if (description !== undefined) updateData.description = description?.trim() || null;
  if (is_active !== undefined) updateData.is_active = is_active;

  const language = await prisma.languages.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: { _count: { select: { courses: true, tests: true } } },
  });

  return NextResponse.json({ language });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lang = await prisma.languages.findUnique({
    where: { id: parseInt(id) },
    include: { _count: { select: { courses: true, tests: true } } },
  });

  if (!lang) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (lang._count.courses > 0 || lang._count.tests > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${lang._count.courses} courses and ${lang._count.tests} tests use this language. Disable it instead.` },
      { status: 400 }
    );
  }

  await prisma.languages.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
