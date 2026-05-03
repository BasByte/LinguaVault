import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { checkManagerPerm } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";
import TestEditor from "@/components/educator/TestEditor";
import { FlaskConical, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function ManagerNewTestPage() {
  const session = await getSession();
  if (!await checkManagerPerm(session, "manage_tests")) redirect("/manager");

  const languages = await prisma.languages.findMany({ where: { is_active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, flag_emoji: true } });

  const emptyTest = { id: 0, title: "", description: null, cefr_level: "A1", language_id: 0, duration_minutes: 60, passing_score: 60, is_published: false, is_public: false, flag_emoji: "📋", language_name: "" };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/manager/tests" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center">
          <FlaskConical className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">New Test</h1>
          <p className="text-xs text-gray-500">Create a new assessment</p>
        </div>
      </div>
      <TestEditor test={emptyTest} questions={[]} languages={languages} apiBase="/api/manager" redirectOnCreate="/manager/tests" />
    </div>
  );
}
