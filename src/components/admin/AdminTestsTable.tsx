"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { getCEFRColor, cn } from "@/lib/utils";

interface Test {
  id: number; title: string; cefr_level: string; is_published: boolean; is_public: boolean;
  duration_minutes: number; passing_score: number; attempt_count: number; created_at: string;
  users: { id: number; name: string } | null;
  languages: { id: number; name: string; flag_emoji: string | null } | null;
  _count: { test_questions: number; test_attempts: number };
}

const CEFR = ["all", "A1", "A2", "B1", "B2", "C1", "C2"];

export default function AdminTestsTable({ tests: initial }: { tests: Test[] }) {
  const router = useRouter();
  const [tests, setTests] = useState(initial);
  const [search, setSearch] = useState("");
  const [cefrFilter, setCefrFilter] = useState("all");
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const filtered = tests.filter((t) => {
    const matchCefr = cefrFilter === "all" || t.cefr_level === cefrFilter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.users?.name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchCefr && matchSearch;
  });

  const togglePublish = async (test: Test) => {
    setLoadingId(test.id);
    const res = await fetch(`/api/admin/tests/${test.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !test.is_published }),
    });
    setLoadingId(null);
    if (res.ok) {
      setTests((prev) => prev.map((t) => t.id === test.id ? { ...t, is_published: !test.is_published } : t));
      startTransition(() => router.refresh());
    }
  };

  const deleteTest = async (test: Test) => {
    if (!confirm(`Delete "${test.title}"? All questions and attempts will be removed.`)) return;
    setLoadingId(test.id);
    const res = await fetch(`/api/admin/tests/${test.id}`, { method: "DELETE" });
    setLoadingId(null);
    if (res.ok) {
      setTests((prev) => prev.filter((t) => t.id !== test.id));
      startTransition(() => router.refresh());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {CEFR.map((c) => (
            <button
              key={c}
              onClick={() => setCefrFilter(c)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors",
                cefrFilter === c
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-sky-300"
              )}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tests..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </div>
          <Link
            href="/admin/tests/new"
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Test</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Educator</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Level</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Questions</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Attempts</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Published</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No tests found</td></tr>
              ) : filtered.map((test) => (
                <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg shrink-0">{test.languages?.flag_emoji ?? "📋"}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate max-w-48">{test.title}</p>
                        <p className="text-xs text-gray-400">{test.duration_minutes}min · Pass {test.passing_score}%</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {test.users ? (
                      <Link href={`/admin/users/${test.users.id}`} className="text-xs text-sky-600 hover:underline font-medium">
                        {test.users.name}
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded border", getCEFRColor(test.cefr_level))}>
                      {test.cefr_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm font-bold text-gray-900">{test._count.test_questions}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm font-bold text-gray-900">{test.attempt_count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(test)}
                      disabled={loadingId === test.id}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors",
                        test.is_published
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      {test.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {test.is_published ? "Live" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link
                        href={`/admin/tests/${test.id}`}
                        className="p-1.5 hover:bg-sky-50 rounded-lg text-gray-400 hover:text-sky-600 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => deleteTest(test)}
                        disabled={loadingId === test.id}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-gray-50 bg-gray-50 text-xs text-gray-400">
          Showing {filtered.length} of {tests.length} tests
        </div>
      </div>
    </div>
  );
}
