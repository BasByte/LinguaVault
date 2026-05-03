"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, Eye, EyeOff, BookOpen, Star } from "lucide-react";
import { getLevelColor, cn, formatDuration } from "@/lib/utils";

interface Course {
  id: number;
  title: string;
  level: string;
  is_published: boolean;
  enrollment_count: number;
  duration_minutes: number;
  lesson_count: number;
  language_name: string;
  flag_emoji: string;
  created_at: string;
  rating: number;
}

export default function CoursesTable({ courses: initial }: { courses: Course[] }) {
  const router = useRouter();
  const [courses, setCourses] = useState(initial);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const togglePublish = async (course: Course) => {
    setLoadingId(course.id);
    const res = await fetch(`/api/educator/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !course.is_published }),
    });
    if (res.ok) {
      setCourses((cs) => cs.map((c) => c.id === course.id ? { ...c, is_published: !c.is_published } : c));
    }
    setLoadingId(null);
  };

  const deleteCourse = async (course: Course) => {
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    setLoadingId(course.id);
    const res = await fetch(`/api/educator/courses/${course.id}`, { method: "DELETE" });
    if (res.ok) {
      setCourses((cs) => cs.filter((c) => c.id !== course.id));
    } else {
      alert("Failed to delete course. It may have enrollments.");
    }
    setLoadingId(null);
  };

  if (courses.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-16 text-center">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-200 dark:text-gray-700" />
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No courses yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Create your first course to get started</p>
        <Link href="/educator/courses/new" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all">
          + Create Course
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Course</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Level</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Enrolled</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Lessons</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Duration</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Rating</th>
              <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {courses.map((course) => (
              <tr key={course.id} className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors", loadingId === course.id && "opacity-50")}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{course.flag_emoji}</span>
                    <div>
                      <Link href={`/educator/courses/${course.id}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {course.title}
                      </Link>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{course.language_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", getLevelColor(course.level))}>
                    {course.level.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold", course.is_published ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400")}>
                    {course.is_published ? "● Live" : "○ Draft"}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {course.enrollment_count.toLocaleString()}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {course.lesson_count}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {course.duration_minutes > 0 ? formatDuration(course.duration_minutes) : "—"}
                </td>
                <td className="px-5 py-4">
                  {course.rating > 0 ? (
                    <span className="flex items-center gap-1 text-sm text-amber-500 font-medium">
                      <Star className="h-3.5 w-3.5 fill-current" /> {Number(course.rating).toFixed(1)}
                    </span>
                  ) : <span className="text-sm text-gray-300 dark:text-gray-600">—</span>}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <Link href={`/educator/courses/${course.id}`} title="Edit course"
                      className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 text-gray-400 rounded-lg transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <button onClick={() => togglePublish(course)} disabled={loadingId === course.id}
                      title={course.is_published ? "Unpublish" : "Publish"}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors">
                      {course.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={() => deleteCourse(course)} disabled={loadingId === course.id}
                      title="Delete course"
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 text-gray-400 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
