import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getManagerPerms, ALL_PERMS } from "@/lib/manager-auth";

export async function GET() {
  const session = await getSession();
  if (!session || !["manager", "admin"].includes(session.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const perms = session.role === "admin" ? ALL_PERMS : await getManagerPerms(session.id);
  return NextResponse.json({ perms });
}
