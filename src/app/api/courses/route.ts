import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang");
    const level = searchParams.get("level");
    const sort = searchParams.get("sort") || "popular";
    const limit = parseInt(searchParams.get("limit") || "20");
    const educatorId = searchParams.get("educator_id");

    const where: Prisma.coursesWhereInput = { is_published: true, is_public: true };
    if (lang) where.languages = { code: lang };
    if (level) where.level = level;
    if (educatorId) where.educator_id = parseInt(educatorId);

    const orderBy: Prisma.coursesOrderByWithRelationInput =
      sort === "newest" ? { created_at: "desc" }
      : sort === "rating" ? { rating: "desc" }
      : { enrollment_count: "desc" };

    const courses = await prisma.courses.findMany({
      where,
      orderBy,
      take: limit,
      include: {
        languages: { select: { name: true, code: true, flag_emoji: true } },
        users: { select: { name: true } },
        _count: { select: { lessons: { where: { is_published: true } } } },
      },
    });

    const mapped = courses.map((c) => ({
      ...c,
      language_name: c.languages?.name,
      language_code: c.languages?.code,
      flag_emoji: c.languages?.flag_emoji,
      educator_name: c.users?.name,
      lesson_count: c._count.lessons,
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    console.error("Courses GET error:", err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, language_id, level, tags, duration_minutes } = body;

    if (!title || !language_id || !level) {
      return NextResponse.json({ error: "Title, language and level are required" }, { status: 400 });
    }

    const course = await prisma.courses.create({
      data: {
        title,
        description,
        language_id,
        educator_id: session.id,
        level,
        tags: tags ?? [],
        duration_minutes: duration_minutes ?? 0,
        is_public: true,
        is_published: false,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (err) {
    console.error("Course POST error:", err);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
