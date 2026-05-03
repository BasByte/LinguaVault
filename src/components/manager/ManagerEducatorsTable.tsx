"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ToggleLeft, ToggleRight, Loader2, BookOpen, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Educator {
  id: number; name: string; email: string; role: string; is_active: boolean;
  bio: string | null; created_at: string;
  _count: { courses: number; tests: number };
}

export default function ManagerEducatorsTable({ educators: initial }: { educators: Educator[] }) {
  const router = useRouter();
  const [educators, setEducators] = useState(initial);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const filtered = educators.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = async (e: Educator) => {
    setLoadingId(e.id);
    const res = await fetch(`/api/manager/educators/${e.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !e.is_active }),
    });
    setLoadingId(null);
    if (res.ok) {
      setEducators((prev) => prev.map((u) => u.id === e.id ? { ...u, is_active: !e.is_active } : u));
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search} onChange={(ev) => setSearch(ev.target.value)}
          placeholder="Search educators…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Educator</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Content</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Bio</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((ed) => {
              const isLoading = loadingId === ed.id;
              return (
                <tr key={ed.id} className={cn("hover:bg-gray-50 transition-colors", !ed.is_active && "opacity-60")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{ed.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{ed.name}</p>
                        <p className="text-xs text-gray-500 truncate">{ed.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-indigo-400" />{ed._count.courses} courses</span>
                      <span className="flex items-center gap-1"><FlaskConical className="h-3.5 w-3.5 text-sky-400" />{ed._count.tests} tests</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-xs text-gray-500 line-clamp-1 max-w-48">{ed.bio || <span className="italic text-gray-300">No bio</span>}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(ed)} disabled={isLoading} className={cn("transition-colors", ed.is_active ? "text-green-500 hover:text-green-700" : "text-gray-300 hover:text-green-500")}>
                      {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : ed.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No educators found</div>}
      </div>
    </div>
  );
}
