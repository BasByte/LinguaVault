import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const testId = parseInt(id);
    const body = await req.json();

    const test = await prisma.tests.findFirst({
      where: { id: testId, ...(session.role !== "admin" ? { educator_id: session.id } : {}) },
    });
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    const { title, description, cefr_level, duration_minutes, passing_score, is_published, is_public } = body;
    const updated = await prisma.tests.update({
      where: { id: testId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(cefr_level !== undefined && { cefr_level }),
        ...(duration_minutes !== undefined && { duration_minutes }),
        ...(passing_score !== undefined && { passing_score }),
        ...(is_published !== undefined && { is_published }),
        ...(is_public !== undefined && { is_public }),
        updated_at: new Date(),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Test PATCH error:", err);
    return NextResponse.json({ error: "Failed to update test" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const testId = parseInt(id);

    const test = await prisma.tests.findFirst({
      where: { id: testId, ...(session.role !== "admin" ? { educator_id: session.id } : {}) },
    });
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    await prisma.tests.delete({ where: { id: testId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Test DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete test" }, { status: 500 });
  }
}
