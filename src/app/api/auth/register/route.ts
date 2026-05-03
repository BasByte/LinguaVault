import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, SessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role = "free_tier" } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const allowedRoles = ["free_tier", "standard", "educator"];
    const userRole = allowedRoles.includes(role) ? role : "free_tier";

    const existing = await prisma.users.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: { name: name.trim(), email: email.toLowerCase(), password_hash: passwordHash, role: userRole },
      select: { id: true, name: true, email: true, role: true },
    });

    const sessionUser: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as SessionUser["role"],
    };

    const token = await createToken(sessionUser);
    const response = NextResponse.json({ success: true, user: sessionUser }, { status: 201 });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
