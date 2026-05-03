import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { question, question_type, options, correct_answer, explanation, points, order_index } = body;

  const updateData: Record<string, unknown> = {};
  if (question !== undefined) updateData.question = question;
  if (question_type !== undefined) updateData.question_type = question_type;
  if (options !== undefined) updateData.options = options;
  if (correct_answer !== undefined) updateData.correct_answer = correct_answer;
  if (explanation !== undefined) updateData.explanation = explanation;
  if (points !== undefined) updateData.points = parseInt(points);
  if (order_index !== undefined) updateData.order_index = order_index;

  const q = await prisma.test_questions.update({ where: { id: parseInt(id) }, data: updateData });
  return NextResponse.json({ question: q });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.test_questions.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
