import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const testId = parseInt(id);

    const test = await prisma.tests.findFirst({
      where: { id: testId, is_published: true },
      include: {
        languages: { select: { name: true, flag_emoji: true } },
        users: { select: { name: true } },
      },
    });

    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    const questions = await prisma.test_questions.findMany({
      where: { test_id: testId },
      orderBy: { order_index: "asc" },
      select: {
        id: true,
        test_id: true,
        question: true,
        question_type: true,
        options: true,
        points: true,
        order_index: true,
        audio_url: true,
        image_url: true,
      },
    });

    return NextResponse.json({
      test: {
        ...test,
        language_name: test.languages?.name,
        flag_emoji: test.languages?.flag_emoji,
        educator_name: test.users?.name,
      },
      questions,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch test" }, { status: 500 });
  }
}
