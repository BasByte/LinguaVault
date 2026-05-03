import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface BulkQuestion {
  question: string;
  question_type: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  points: number;
}

const VALID_TYPES = ["multiple_choice", "fill_blank", "matching", "translation", "listening", "writing"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { test_id, questions, mode = "append" } = body;

  if (!test_id || !Array.isArray(questions) || questions.length === 0)
    return NextResponse.json({ error: "test_id and questions array required" }, { status: 400 });

  const testExists = await prisma.tests.findUnique({ where: { id: parseInt(test_id) }, select: { id: true } });
  if (!testExists) return NextResponse.json({ error: "Test not found" }, { status: 404 });

  // Validate all questions before inserting any
  const errors: { row: number; message: string }[] = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] as BulkQuestion;
    if (!q.question?.trim()) errors.push({ row: i + 1, message: "Question text is required" });
    if (!VALID_TYPES.includes(q.question_type)) errors.push({ row: i + 1, message: `Invalid type "${q.question_type}". Must be: ${VALID_TYPES.join(", ")}` });
    if (!q.correct_answer?.trim()) errors.push({ row: i + 1, message: "correct_answer is required" });
    if (q.question_type === "multiple_choice" && (!Array.isArray(q.options) || q.options.filter(Boolean).length < 2))
      errors.push({ row: i + 1, message: "multiple_choice requires at least 2 options" });
  }

  if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 });

  // Get current max order_index
  const lastQ = await prisma.test_questions.findFirst({
    where: { test_id: parseInt(test_id) },
    orderBy: { order_index: "desc" },
    select: { order_index: true },
  });

  let startIndex = mode === "replace" ? 0 : (lastQ?.order_index ?? -1) + 1;

  if (mode === "replace") {
    await prisma.test_questions.deleteMany({ where: { test_id: parseInt(test_id) } });
  }

  const created = await prisma.test_questions.createMany({
    data: questions.map((q: BulkQuestion, i: number) => ({
      test_id: parseInt(test_id),
      question: q.question.trim(),
      question_type: q.question_type,
      options: q.options && q.options.filter(Boolean).length > 0 ? q.options.filter(Boolean) : undefined,
      correct_answer: q.correct_answer.trim(),
      explanation: q.explanation?.trim() || null,
      points: q.points > 0 ? q.points : 10,
      order_index: startIndex + i,
    })),
  });

  return NextResponse.json({ imported: created.count, mode }, { status: 201 });
}
