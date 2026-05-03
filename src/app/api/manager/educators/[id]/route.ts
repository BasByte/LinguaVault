import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_educators"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { is_active } = body;

  const updateData: Record<string, unknown> = { updated_at: new Date() };
  if (is_active !== undefined) updateData.is_active = is_active;

  const user = await prisma.users.update({
    where: { id: parseInt(id) },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, is_active: true },
  });

  return NextResponse.json({ user });
}
