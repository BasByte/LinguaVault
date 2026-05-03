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

  const tests = await prisma.tests.findMany({
    where: {
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(educatorId ? { educator_id: parseInt(educatorId) } : {}),
    },
    orderBy: { created_at: "desc" },
    include: {
      users: { select: { id: true, name: true } },
      languages: { select: { id: true, name: true, flag_emoji: true } },
      _count: { select: { test_questions: true, test_attempts: true } },
    },
  });

  return NextResponse.json({ tests });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, language_id, educator_id, cefr_level, duration_minutes, passing_score } = body;

  if (!title || !cefr_level) return NextResponse.json({ error: "Title and CEFR level required" }, { status: 400 });

  const test = await prisma.tests.create({
    data: {
      title,
      description: description || null,
      language_id: language_id ? parseInt(language_id) : null,
      educator_id: educator_id ? parseInt(educator_id) : null,
      cefr_level,
      duration_minutes: duration_minutes ? parseInt(duration_minutes) : 60,
      passing_score: passing_score ? parseInt(passing_score) : 60,
    },
  });

  return NextResponse.json({ test }, { status: 201 });
}
