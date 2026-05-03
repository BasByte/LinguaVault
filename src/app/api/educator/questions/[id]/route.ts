import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getOwnedQuestion(session: { id: number; role: string }, questionId: number) {
  const q = await prisma.test_questions.findFirst({
    where: { id: questionId },
    include: { tests: { select: { educator_id: true } } },
  });
  if (!q) return null;
  if (session.role !== "admin" && q.tests?.educator_id !== session.id) return null;
  return q;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const questionId = parseInt(id);
    const q = await getOwnedQuestion(session, questionId);
    if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    const body = await req.json();
    const { question, question_type, options, correct_answer, explanation, points, order_index } = body;
    const updated = await prisma.test_questions.update({
      where: { id: questionId },
      data: {
        ...(question !== undefined && { question }),
        ...(question_type !== undefined && { question_type }),
        ...(options !== undefined && { options }),
        ...(correct_answer !== undefined && { correct_answer }),
        ...(explanation !== undefined && { explanation }),
        ...(points !== undefined && { points }),
        ...(order_index !== undefined && { order_index }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const questionId = parseInt(id);
    const q = await getOwnedQuestion(session, questionId);
    if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    await prisma.test_questions.delete({ where: { id: questionId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
