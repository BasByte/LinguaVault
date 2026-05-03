import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const testId = searchParams.get("test_id");
  if (!testId) return NextResponse.json({ error: "test_id required" }, { status: 400 });

  const questions = await prisma.test_questions.findMany({
    where: { test_id: parseInt(testId) },
    orderBy: { order_index: "asc" },
  });

  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { test_id, question, question_type, options, correct_answer, explanation, points } = body;
  if (!test_id || !question || !question_type || !correct_answer)
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });

  const last = await prisma.test_questions.findFirst({
    where: { test_id: parseInt(test_id) },
    orderBy: { order_index: "desc" },
    select: { order_index: true },
  });

  const q = await prisma.test_questions.create({
    data: {
      test_id: parseInt(test_id),
      question,
      question_type,
      options: options || null,
      correct_answer,
      explanation: explanation || null,
      points: points ? parseInt(points) : 10,
      order_index: (last?.order_index ?? -1) + 1,
    },
  });

  return NextResponse.json({ question: q }, { status: 201 });
}
