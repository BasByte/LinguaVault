import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.users.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true, name: true, email: true, role: true, is_active: true,
      bio: true, avatar_url: true, total_points: true, streak_days: true,
      created_at: true, updated_at: true,
      _count: { select: { enrollments: true, test_attempts: true, courses: true, tests: true } },
      enrollments: {
        take: 5, orderBy: { enrolled_at: "desc" },
        include: { courses: { select: { id: true, title: true, is_published: true } } },
      },
      test_attempts: {
        take: 5, orderBy: { started_at: "desc" },
        select: { id: true, percentage: true, cefr_result: true, status: true, completed_at: true, tests: { select: { title: true } } },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, email, role, is_active, bio, password } = body;

  const updateData: Record<string, unknown> = { updated_at: new Date() };
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (bio !== undefined) updateData.bio = bio;
  if (password) updateData.password_hash = await bcrypt.hash(password, 10);

  const user = await prisma.users.update({
    where: { id: parseInt(id) },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, is_active: true },
  });

  return NextResponse.json({ user });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const uid = parseInt(id);

  if (uid === session.id)
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  await prisma.users.update({
    where: { id: uid },
    data: { is_active: false, updated_at: new Date() },
  });

  return NextResponse.json({ success: true });
}
