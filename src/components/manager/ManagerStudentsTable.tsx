"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ToggleLeft, ToggleRight, Loader2, Trophy, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Student {
  id: number; name: string; email: string; role: string; is_active: boolean;
  total_points: number; streak_days: number; created_at: string;
  _count: { enrollments: number; test_attempts: number };
  test_attempts: { percentage: number | null; cefr_result: string | null }[];
}

export default function ManagerStudentsTable({ students: initial }: { students: Student[] }) {
  const router = useRouter();
  const [students, setStudents] = useState(initial);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const filtered = students.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = async (s: Student) => {
    setLoadingId(s.id);
    const res = await fetch(`/api/manager/students/${s.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !s.is_active }),
    });
    setLoadingId(null);
    if (res.ok) {
      setStudents((prev) => prev.map((u) => u.id === s.id ? { ...u, is_active: !s.is_active } : u));
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Plan</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Progress</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Best Score</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((s) => {
              const best = s.test_attempts[0];
              const isLoading = loadingId === s.id;
              return (
                <tr key={s.id} className={cn("hover:bg-gray-50 transition-colors", !s.is_active && "opacity-60")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{s.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                        <p className="text-xs text-gray-500 truncate">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", s.role === "standard" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")}>
                      {s.role === "standard" ? "Standard" : "Free"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-indigo-400" />{s._count.enrollments}</span>
                      <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-amber-400" />{s.total_points} pts</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs">
                    {best ? (
                      <span className="font-bold text-gray-700">{best.cefr_result ?? `${Math.round(best.percentage ?? 0)}%`}</span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(s)} disabled={isLoading} className={cn("transition-colors", s.is_active ? "text-green-500 hover:text-green-700" : "text-gray-300 hover:text-green-500")}>
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : s.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">No students found</div>
        )}
      </div>
    </div>
  );
}
