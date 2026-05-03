import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { query, queryOne } from "./db";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "lingua-Vault-secret-key-2024"
);

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: "free_tier" | "standard" | "educator" | "manager" | "admin";
  avatarUrl?: string;
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return (payload as { user: SessionUser }).user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getUserById(id: number): Promise<SessionUser | null> {
  return queryOne<SessionUser>(
    "SELECT id, name, email, role, avatar_url as \"avatarUrl\" FROM users WHERE id = $1 AND is_active = true",
    [id]
  );
}

export type UserRole = "free_tier" | "standard" | "educator" | "manager" | "admin";

export function hasRole(user: SessionUser | null, role: UserRole): boolean {
  if (!user) return false;
  const hierarchy: UserRole[] = ["free_tier", "standard", "educator", "manager", "admin"];
  return hierarchy.indexOf(user.role) >= hierarchy.indexOf(role);
}
