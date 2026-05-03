import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { calculateCEFRFromScore } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const { test_id, answers, time_spent_seconds } = await req.json();
    if (!test_id || !answers) {
      return NextResponse.json({ error: "test_id and answers are required" }, { status: 400 });
    }

    const test = await prisma.tests.findUnique({
      where: { id: test_id },
      select: { id: true, cefr_level: true, passing_score: true },
    });
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    const questions = await prisma.test_questions.findMany({
      where: { test_id },
      select: { id: true, correct_answer: true, points: true },
    });

    let totalPoints = 0;
    let earnedPoints = 0;
    for (const q of questions) {
      totalPoints += q.points;
      const userAnswer = answers[q.id.toString()];
      if (userAnswer && userAnswer.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) {
        earnedPoints += q.points;
      }
    }

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const cefrResult = calculateCEFRFromScore(earnedPoints, totalPoints, test.cefr_level);

    const attempt = await prisma.test_attempts.create({
      data: {
        user_id: session.id,
        test_id,
        score: earnedPoints,
        percentage,
        cefr_result: cefrResult,
        answers,
        time_spent_seconds: time_spent_seconds ?? 0,
        status: "completed",
        completed_at: new Date(),
      },
      select: { id: true },
    });

    await prisma.tests.update({
      where: { id: test_id },
      data: { attempt_count: { increment: 1 } },
    });

    const pointsEarned = Math.round(earnedPoints * 1.5);
    await prisma.users.update({
      where: { id: session.id },
      data: { total_points: { increment: pointsEarned } },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      score: earnedPoints,
      maxScore: totalPoints,
      percentage,
      cefrResult,
      passed: percentage >= test.passing_score,
      pointsEarned,
    });
  } catch (err) {
    console.error("Attempt POST error:", err);
    return NextResponse.json({ error: "Failed to submit attempt" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const attempts = await prisma.test_attempts.findMany({
      where: { user_id: session.id, status: "completed" },
      include: {
        tests: {
          select: {
            title: true,
            languages: { select: { name: true, flag_emoji: true } },
          },
        },
      },
      orderBy: { completed_at: "desc" },
      take: 20,
    });

    const mapped = attempts.map((a) => ({
      ...a,
      test_title: a.tests?.title,
      language_name: a.tests?.languages?.name,
      flag_emoji: a.tests?.languages?.flag_emoji,
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch attempts" }, { status: 500 });
  }
}
