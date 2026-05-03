import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";
import { GraduationCap } from "lucide-react";
import ManagerEducatorsTable from "@/components/manager/ManagerEducatorsTable";

export default async function ManagerEducatorsPage() {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_educators")) redirect("/manager");

  const educators = await prisma.users.findMany({
    where: { role: "educator" },
    orderBy: { created_at: "desc" },
    select: {
      id: true, name: true, email: true, role: true, is_active: true,
      bio: true, created_at: true,
      _count: { select: { courses: true, tests: true } },
    },
  });

  const serialized = educators.map((e) => ({ ...e, created_at: e.created_at.toISOString() }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Educators</h1>
          <p className="text-xs text-gray-500">{educators.length} educators</p>
        </div>
      </div>
      <ManagerEducatorsTable educators={serialized} />
    </div>
  );
}
