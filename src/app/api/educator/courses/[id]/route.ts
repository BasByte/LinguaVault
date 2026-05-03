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
    const courseId = parseInt(id);
    const body = await req.json();

    const course = await prisma.courses.findFirst({
      where: { id: courseId, ...(session.role !== "admin" ? { educator_id: session.id } : {}) },
    });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const { title, description, level, language_id, duration_minutes, tags, is_published, is_public } = body;
    const updated = await prisma.courses.update({
      where: { id: courseId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(level !== undefined && { level }),
        ...(language_id !== undefined && { language_id }),
        ...(duration_minutes !== undefined && { duration_minutes }),
        ...(tags !== undefined && { tags }),
        ...(is_published !== undefined && { is_published }),
        ...(is_public !== undefined && { is_public }),
        updated_at: new Date(),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Course PATCH error:", err);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !["educator", "admin"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const courseId = parseInt(id);

    const course = await prisma.courses.findFirst({
      where: { id: courseId, ...(session.role !== "admin" ? { educator_id: session.id } : {}) },
    });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    await prisma.courses.delete({ where: { id: courseId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Course DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
