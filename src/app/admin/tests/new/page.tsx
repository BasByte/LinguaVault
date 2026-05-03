import { prisma } from "@/lib/prisma";
import AdminNewTestForm from "@/components/admin/AdminNewTestForm";
import { FlaskConical, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminNewTestPage() {
  const [languages, educators] = await Promise.all([
    prisma.languages.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, flag_emoji: true } }),
    prisma.users.findMany({ where: { role: "educator", is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/tests" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
          <FlaskConical className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">New Test</h1>
          <p className="text-xs text-gray-500">Create a new assessment and assign an educator</p>
        </div>
      </div>
      <AdminNewTestForm languages={languages} educators={educators} />
    </div>
  );
}
