import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || undefined;
  const search = searchParams.get("search") || undefined;

  const users = await prisma.users.findMany({
    where: {
      ...(role ? { role } : {}),
      ...(search
        ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true, name: true, email: true, role: true, is_active: true,
      total_points: true, streak_days: true, created_at: true, avatar_url: true,
      _count: { select: { enrollments: true, test_attempts: true, courses: true } },
    },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password || !role)
    return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });

  const password_hash = await bcrypt.hash(password, 10);
  const user = await prisma.users.create({
    data: { name, email, password_hash, role },
    select: { id: true, name: true, email: true, role: true, created_at: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
