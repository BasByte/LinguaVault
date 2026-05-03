import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_educators"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;

  const educators = await prisma.users.findMany({
    where: {
      role: "educator",
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {}),
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true, name: true, email: true, role: true, is_active: true,
      bio: true, created_at: true,
      _count: { select: { courses: true, tests: true } },
    },
  });

  return NextResponse.json({ educators });
}
