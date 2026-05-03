import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_tests"))
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
  if (!await checkManagerPerm(session, "manage_tests"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { test_id, question, question_type, options, correct_answer, explanation, points, order_index } = body;
  if (!test_id || !question || !question_type || !correct_answer)
    return NextResponse.json({ error: "test_id, question, question_type, correct_answer required" }, { status: 400 });

  const q = await prisma.test_questions.create({
    data: {
      test_id: parseInt(test_id),
      question,
      question_type,
      options: options || null,
      correct_answer,
      explanation: explanation || null,
      points: points ? parseInt(points) : 10,
      order_index: order_index ?? 0,
    },
  });

  return NextResponse.json({ question: q }, { status: 201 });
}
