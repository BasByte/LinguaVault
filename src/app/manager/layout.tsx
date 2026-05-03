import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getManagerPerms, ALL_PERMS } from "@/lib/manager-auth";
import ManagerShell from "@/components/manager/ManagerShell";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (!["manager", "admin"].includes(session.role)) redirect("/");

  const perms = session.role === "admin" ? ALL_PERMS : await getManagerPerms(session.id);

  return <ManagerShell user={session} perms={perms}>{children}</ManagerShell>;
}
