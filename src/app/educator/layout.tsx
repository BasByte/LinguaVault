import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import EducatorShell from "@/components/educator/EducatorShell";

export default async function EducatorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (!["educator", "admin"].includes(session.role)) redirect("/");
  return <EducatorShell user={session}>{children}</EducatorShell>;
}
