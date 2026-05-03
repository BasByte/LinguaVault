import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const testId = parseInt(req.nextUrl.searchParams.get("test_id") || "0");
    if (!testId) return NextResponse.json({ error: "test_id required" }, { status: 400 });

    const test = await prisma.tests.findFirst({
      where: { id: testId, ...(session.role !== "admin" ? { educator_id: session.id } : {}) },
    });
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    const questions = await prisma.test_questions.findMany({
      where: { test_id: testId },
      orderBy: { order_index: "asc" },
    });
    return NextResponse.json(questions);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { test_id, question, question_type, options, correct_answer, explanation, points } = body;
    if (!test_id || !question || !correct_answer) {
      return NextResponse.json({ error: "test_id, question, and correct_answer required" }, { status: 400 });
    }

    const test = await prisma.tests.findFirst({
      where: { id: test_id, ...(session.role !== "admin" ? { educator_id: session.id } : {}) },
    });
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    const count = await prisma.test_questions.count({ where: { test_id } });
    const q = await prisma.test_questions.create({
      data: {
        test_id,
        question,
        question_type: question_type || "multiple_choice",
        options: options ?? null,
        correct_answer,
        explanation: explanation || null,
        points: points || 10,
        order_index: count,
      },
    });
    return NextResponse.json(q, { status: 201 });
  } catch (err) {
    console.error("Question POST error:", err);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}
