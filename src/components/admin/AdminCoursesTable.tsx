"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { getLevelColor, cn } from "@/lib/utils";

interface Course {
  id: number; title: string; level: string; is_published: boolean; is_public: boolean;
  created_at: string; enrollment_count: number;
  users: { id: number; name: string } | null;
  languages: { id: number; name: string; flag_emoji: string | null } | null;
  _count: { lessons: number; enrollments: number };
}

const LEVELS = ["all", "beginner", "elementary", "intermediate", "upper_intermediate", "advanced", "proficiency"];

export default function AdminCoursesTable({ courses: initial }: { courses: Course[] }) {
  const router = useRouter();
  const [courses, setCourses] = useState(initial);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const filtered = courses.filter((c) => {
    const matchLevel = levelFilter === "all" || c.level === levelFilter;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.users?.name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const togglePublish = async (course: Course) => {
    setLoadingId(course.id);
    const res = await fetch(`/api/admin/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !course.is_published }),
    });
    setLoadingId(null);
    if (res.ok) {
      setCourses((prev) => prev.map((c) => c.id === course.id ? { ...c, is_published: !course.is_published } : c));
      startTransition(() => router.refresh());
    }
  };

  const deleteCourse = async (course: Course) => {
    if (!confirm(`Delete "${course.title}"? All lessons and enrollments will be removed.`)) return;
    setLoadingId(course.id);
    const res = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
    setLoadingId(null);
    if (res.ok) {
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      startTransition(() => router.refresh());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors capitalize",
                levelFilter === l
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              )}
            >
              {l === "all" ? "All" : l.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <Link
            href="/admin/courses/new"
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
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
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Course</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Educator</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Level</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Lessons</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Enrolled</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Published</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No courses found</td></tr>
              ) : filtered.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg shrink-0">{course.languages?.flag_emoji ?? "📚"}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate max-w-48">{course.title}</p>
                        <p className="text-xs text-gray-400">{course.languages?.name ?? "No language"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {course.users ? (
                      <Link href={`/admin/users/${course.users.id}`} className="text-xs text-indigo-600 hover:underline font-medium">
                        {course.users.name}
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold border capitalize", getLevelColor(course.level))}>
                      {course.level.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm font-bold text-gray-900">{course._count.lessons}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm font-bold text-gray-900">{course.enrollment_count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => togglePublish(course)}
                      disabled={loadingId === course.id}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors",
                        course.is_published
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      {course.is_published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {course.is_published ? "Live" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => deleteCourse(course)}
                        disabled={loadingId === course.id}
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
          Showing {filtered.length} of {courses.length} courses
        </div>
      </div>
    </div>
  );
}
