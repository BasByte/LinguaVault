import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const languages = await prisma.languages.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { courses: true, tests: true } },
    },
  });

  return NextResponse.json({ languages });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, code, flag_emoji, description } = body;

  if (!name?.trim() || !code?.trim())
    return NextResponse.json({ error: "Name and code are required" }, { status: 400 });

  const existing = await prisma.languages.findUnique({ where: { code: code.toLowerCase() } });
  if (existing)
    return NextResponse.json({ error: "Language code already exists" }, { status: 400 });

  const language = await prisma.languages.create({
    data: {
      name: name.trim(),
      code: code.toLowerCase().trim(),
      flag_emoji: flag_emoji?.trim() || null,
      description: description?.trim() || null,
      is_active: true,
    },
    include: { _count: { select: { courses: true, tests: true } } },
  });

  return NextResponse.json({ language }, { status: 201 });
}
