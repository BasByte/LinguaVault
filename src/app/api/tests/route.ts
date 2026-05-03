import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang");
    const level = searchParams.get("level");
    const limit = parseInt(searchParams.get("limit") || "20");
    const educatorId = searchParams.get("educator_id");

    const where: Prisma.testsWhereInput = { is_published: true, is_public: true };
    if (lang) where.languages = { code: lang };
    if (level) where.cefr_level = level;
    if (educatorId) where.educator_id = parseInt(educatorId);

    const tests = await prisma.tests.findMany({
      where,
      orderBy: { attempt_count: "desc" },
      take: limit,
      include: {
        languages: { select: { name: true, code: true, flag_emoji: true } },
        users: { select: { name: true } },
        _count: { select: { test_questions: true } },
      },
    });

    const mapped = tests.map((t) => ({
      ...t,
      language_name: t.languages?.name,
      language_code: t.languages?.code,
      flag_emoji: t.languages?.flag_emoji,
      educator_name: t.users?.name,
      question_count: t._count.test_questions,
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Tests GET error:", err);
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, language_id, cefr_level, duration_minutes, passing_score } = await req.json();
    if (!title || !language_id || !cefr_level) {
      return NextResponse.json({ error: "Title, language and CEFR level are required" }, { status: 400 });
    }

    const test = await prisma.tests.create({
      data: {
        title,
        description,
        language_id,
        educator_id: session.id,
        cefr_level,
        duration_minutes: duration_minutes ?? 60,
        passing_score: passing_score ?? 60,
        is_public: true,
        is_published: false,
      },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create test" }, { status: 500 });
  }
}
