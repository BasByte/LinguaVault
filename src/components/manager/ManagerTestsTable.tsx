"use client";
import { useState } from "react";
import { Search, Pencil, Trash2, Loader2, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Test {
  id: number; title: string; cefr_level: string; is_published: boolean;
  duration_minutes: number; passing_score: number; created_at: string; updated_at: string;
  users: { id: number; name: string } | null;
  languages: { id: number; name: string; flag_emoji: string | null } | null;
  _count: { test_questions: number; test_attempts: number };
}

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-700", A2: "bg-teal-100 text-teal-700",
  B1: "bg-sky-100 text-sky-700", B2: "bg-blue-100 text-blue-700",
  C1: "bg-violet-100 text-violet-700", C2: "bg-purple-100 text-purple-700",
};

export default function ManagerTestsTable({ tests: initial }: { tests: Test[] }) {
  const router = useRouter();
  const [tests, setTests] = useState(initial);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = tests.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This will remove all questions and attempts.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/manager/tests/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) { setTests((prev) => prev.filter((t) => t.id !== id)); router.refresh(); }
    else alert("Failed to delete test");
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tests…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Test</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">CEFR</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Stats</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Educator</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center shrink-0 text-sm">{t.languages?.flag_emoji || <FlaskConical className="h-4 w-4 text-sky-400" />}</div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate max-w-40">{t.title}</p>
                      <p className="text-xs text-gray-500">{t.languages?.name || "No language"} · {t.duration_minutes}min</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold", CEFR_COLORS[t.cefr_level] ?? "bg-gray-100 text-gray-600")}>{t.cefr_level}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-600">
                  {t._count.test_questions} questions · {t._count.test_attempts} attempts
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-600">{t.users?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", t.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                    {t.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/manager/tests/${t.id}`} className="p-1.5 hover:bg-sky-50 rounded-lg text-gray-400 hover:text-sky-600 transition-colors"><Pencil className="h-3.5 w-3.5" /></Link>
                    <button onClick={() => handleDelete(t.id, t.title)} disabled={deletingId === t.id} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50">
                      {deletingId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No tests found</div>}
      </div>
    </div>
  );
}
