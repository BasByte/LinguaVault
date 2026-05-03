import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const languages = await prisma.languages.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(languages);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch languages" }, { status: 500 });
  }
}
