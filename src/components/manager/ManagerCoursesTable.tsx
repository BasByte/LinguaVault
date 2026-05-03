"use client";
import { useState } from "react";
import { Search, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Course {
  id: number; title: string; level: string; is_published: boolean; is_public: boolean;
  rating: number | null; created_at: string; updated_at: string;
  users: { id: number; name: string } | null;
  languages: { id: number; name: string; flag_emoji: string | null } | null;
  _count: { lessons: number; enrollments: number };
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
};

export default function ManagerCoursesTable({ courses: initial }: { courses: Course[] }) {
  const router = useRouter();
  const [courses, setCourses] = useState(initial);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = courses.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This will remove all lessons and enrollments.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/manager/courses/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) { setCourses((prev) => prev.filter((c) => c.id !== id)); router.refresh(); }
    else alert("Failed to delete course");
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Course</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Level</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Stats</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Educator</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 text-sm">{c.languages?.flag_emoji || <BookOpen className="h-4 w-4 text-indigo-400" />}</div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate max-w-40">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.languages?.name || "No language"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold capitalize", LEVEL_COLORS[c.level] ?? "bg-gray-100 text-gray-600")}>{c.level}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-600">
                  {c._count.lessons} lessons · {c._count.enrollments} enrolled
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-600">{c.users?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", c.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                    {c.is_published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/manager/courses/${c.id}`} className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"><Pencil className="h-3.5 w-3.5" /></Link>
                    <button onClick={() => handleDelete(c.id, c.title)} disabled={deletingId === c.id} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50">
                      {deletingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-10 text-gray-400 text-sm">No courses found</div>}
      </div>
    </div>
  );
}
