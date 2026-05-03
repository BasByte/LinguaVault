"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

interface Language { id: number; name: string; flag_emoji: string; }
interface Educator { id: number; name: string; }

export default function AdminNewTestForm({ languages, educators }: { languages: Language[]; educators: Educator[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", language_id: "", educator_id: "",
    cefr_level: "B1", duration_minutes: "60", passing_score: "60",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        language_id: form.language_id || null,
        educator_id: form.educator_id || null,
        cefr_level: form.cefr_level,
        duration_minutes: parseInt(form.duration_minutes) || 60,
        passing_score: parseInt(form.passing_score) || 60,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/tests/${data.test.id}`);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to create test");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Test Title *</label>
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. French B2 Placement Test"
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          placeholder="What will this test assess?"
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Language</label>
          <select
            value={form.language_id}
            onChange={(e) => set("language_id", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
          >
            <option value="">— Select language —</option>
            {languages.map((l) => <option key={l.id} value={l.id}>{l.flag_emoji} {l.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign Educator</label>
          <select
            value={form.educator_id}
            onChange={(e) => set("educator_id", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
          >
            <option value="">— No educator —</option>
            {educators.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">CEFR Level</label>
          <select
            value={form.cefr_level}
            onChange={(e) => set("cefr_level", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
          >
            {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (min)</label>
          <input
            type="number"
            min="1"
            value={form.duration_minutes}
            onChange={(e) => set("duration_minutes", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Passing Score (%)</label>
          <input
            type="number"
            min="1"
            max="100"
            value={form.passing_score}
            onChange={(e) => set("passing_score", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Create Test
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/tests")}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
