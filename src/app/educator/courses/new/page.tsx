"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Globe } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface Language { id: number; name: string; flag_emoji: string; }

const LEVELS = [
  { value: "beginner", label: "Beginner (A1)" },
  { value: "elementary", label: "Elementary (A2)" },
  { value: "intermediate", label: "Intermediate (B1)" },
  { value: "upper_intermediate", label: "Upper-Intermediate (B2)" },
  { value: "advanced", label: "Advanced (C1)" },
  { value: "proficiency", label: "Proficiency (C2)" },
];

export default function NewCoursePage() {
  const router = useRouter();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    language_id: "",
    level: "beginner",
    duration_minutes: 60,
    is_public: true,
  });

  useEffect(() => {
    fetch("/api/languages").then((r) => r.json()).then((d) => setLanguages(d.languages || d));
  }, []);

  const set = (k: string, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.language_id) { setError("Please select a language"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, language_id: parseInt(form.language_id) }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to create course");
        setSaving(false);
        return;
      }
      const data = await res.json();
      router.push(`/educator/courses/${data.id || data.course?.id}`);
    } catch {
      setError("Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/educator/courses" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-2 inline-block">← Back to courses</Link>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Create New Course</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">You can add lessons and publish after creation</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-5">
        {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 px-4 py-3 rounded-xl">{error}</div>}

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Course Title *</label>
          <input
            type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Spanish for Beginners"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
          <textarea
            value={form.description} onChange={(e) => set("description", e.target.value)}
            placeholder="What will students learn in this course?"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Language *</label>
            <select
              value={form.language_id} onChange={(e) => set("language_id", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select language...</option>
              {languages.map((l) => <option key={l.id} value={l.id}>{l.flag_emoji} {l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Level</label>
            <select
              value={form.level} onChange={(e) => set("level", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Estimated Duration (minutes)</label>
          <input
            type="number" min={1} value={form.duration_minutes} onChange={(e) => set("duration_minutes", parseInt(e.target.value) || 60)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="is_public" checked={form.is_public} onChange={(e) => set("is_public", e.target.checked)} className="h-4 w-4 rounded text-indigo-600" />
          <label htmlFor="is_public" className="text-sm text-gray-700 dark:text-gray-300">Make course publicly visible (once published)</label>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/educator/courses" className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-center transition-colors">
            Cancel
          </Link>
          <button
            type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {saving ? "Creating..." : <><BookOpen className="h-4 w-4" /> Create Course</>}
          </button>
        </div>
      </form>
    </div>
  );
}
