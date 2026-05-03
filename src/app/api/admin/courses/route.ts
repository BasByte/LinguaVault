import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const educatorId = searchParams.get("educator_id");

  const courses = await prisma.courses.findMany({
    where: {
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(educatorId ? { educator_id: parseInt(educatorId) } : {}),
    },
    orderBy: { created_at: "desc" },
    include: {
      users: { select: { id: true, name: true } },
      languages: { select: { id: true, name: true, flag_emoji: true } },
      _count: { select: { lessons: true, enrollments: true } },
    },
  });

  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, language_id, educator_id, level, duration_minutes, tags } = body;

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const course = await prisma.courses.create({
    data: {
      title,
      description: description || null,
      language_id: language_id ? parseInt(language_id) : null,
      educator_id: educator_id ? parseInt(educator_id) : null,
      level: level || "beginner",
      duration_minutes: duration_minutes ? parseInt(duration_minutes) : 0,
      tags: tags || [],
    },
  });

  return NextResponse.json({ course }, { status: 201 });
}
