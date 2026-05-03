"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save, Eye, EyeOff, BookOpen, Plus, Trash2, ChevronUp, ChevronDown,
  GripVertical, CheckCircle, Clock, FileText, Video, Layers,
} from "lucide-react";
import { getLevelColor, cn } from "@/lib/utils";

interface Language { id: number; name: string; flag_emoji: string; }
interface Lesson {
  id: number; title: string; lesson_type: string;
  duration_minutes: number; is_published: boolean; order_index: number; content: string | null;
}
interface Course {
  id: number; title: string; description: string | null; level: string;
  language_id: number; duration_minutes: number; is_published: boolean; is_public: boolean;
  tags: string[] | null; flag_emoji: string; language_name: string;
}

const LEVELS = [
  { value: "beginner", label: "Beginner (A1)" },
  { value: "elementary", label: "Elementary (A2)" },
  { value: "intermediate", label: "Intermediate (B1)" },
  { value: "upper_intermediate", label: "Upper-Intermediate (B2)" },
  { value: "advanced", label: "Advanced (C1)" },
  { value: "proficiency", label: "Proficiency (C2)" },
];

const LESSON_TYPES = [
  { value: "lesson", label: "Lesson", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { value: "article", label: "Article", icon: <FileText className="h-3.5 w-3.5" /> },
  { value: "video", label: "Video", icon: <Video className="h-3.5 w-3.5" /> },
  { value: "quiz", label: "Quiz", icon: <Layers className="h-3.5 w-3.5" /> },
  { value: "exercise", label: "Exercise", icon: <CheckCircle className="h-3.5 w-3.5" /> },
];

const emptyLesson = { title: "", lesson_type: "lesson", duration_minutes: 10, content: "", is_published: false };

export default function CourseEditor({
  course: initial,
  lessons: initialLessons,
  languages,
  apiBase = "/api/educator",
}: {
  course: Course;
  lessons: Lesson[];
  languages: Language[];
  apiBase?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"details" | "lessons">("details");
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);

  // Details form state
  const [details, setDetails] = useState({ ...initial });
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailSaved, setDetailSaved] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Lesson add state
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({ ...emptyLesson });
  const [addingLesson, setAddingLesson] = useState(false);

  // Lesson edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLesson, setEditLesson] = useState<Partial<Lesson>>({});
  const [editSaving, setEditSaving] = useState(false);

  const [loadingId, setLoadingId] = useState<number | null>(null);

  const setDetail = (k: string, v: string | number | boolean) =>
    setDetails((d) => ({ ...d, [k]: v }));

  const saveDetails = async () => {
    if (!details.title.trim()) { setDetailError("Title is required"); return; }
    setDetailSaving(true);
    setDetailError("");
    const res = await fetch(`${apiBase}/courses/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: details.title,
        description: details.description,
        level: details.level,
        language_id: details.language_id,
        duration_minutes: details.duration_minutes,
        is_published: details.is_published,
        is_public: details.is_public,
      }),
    });
    setDetailSaving(false);
    if (res.ok) {
      setDetailSaved(true);
      setTimeout(() => setDetailSaved(false), 2500);
      router.refresh();
    } else {
      setDetailError("Failed to save changes");
    }
  };

  const addLesson = async () => {
    if (!newLesson.title.trim()) return;
    setAddingLesson(true);
    const res = await fetch(`${apiBase}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course_id: initial.id, ...newLesson, order_index: lessons.length }),
    });
    if (res.ok) {
      const created = await res.json();
      setLessons((ls) => [...ls, created]);
      setNewLesson({ ...emptyLesson });
      setShowAddLesson(false);
    }
    setAddingLesson(false);
  };

  const startEdit = (lesson: Lesson) => {
    setEditingId(lesson.id);
    setEditLesson({ title: lesson.title, lesson_type: lesson.lesson_type, duration_minutes: lesson.duration_minutes, content: lesson.content || "", is_published: lesson.is_published });
  };

  const saveEdit = async (id: number) => {
    setEditSaving(true);
    const res = await fetch(`${apiBase}/lessons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editLesson),
    });
    if (res.ok) {
      const updated = await res.json();
      setLessons((ls) => ls.map((l) => l.id === id ? { ...l, ...updated } : l));
      setEditingId(null);
    }
    setEditSaving(false);
  };

  const deleteLesson = async (id: number) => {
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    setLoadingId(id);
    const res = await fetch(`${apiBase}/lessons/${id}`, { method: "DELETE" });
    if (res.ok) setLessons((ls) => ls.filter((l) => l.id !== id));
    setLoadingId(null);
  };

  const moveLesson = async (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= lessons.length) return;
    const updated = [...lessons];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((l, i) => (l.order_index = i));
    setLessons(updated);
    await Promise.all([
      fetch(`${apiBase}/lessons/${updated[index].id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_index: index }) }),
      fetch(`${apiBase}/lessons/${updated[newIndex].id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_index: newIndex }) }),
    ]);
  };

  const toggleLessonPublish = async (lesson: Lesson) => {
    setLoadingId(lesson.id);
    const res = await fetch(`${apiBase}/lessons/${lesson.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !lesson.is_published }),
    });
    if (res.ok) setLessons((ls) => ls.map((l) => l.id === lesson.id ? { ...l, is_published: !l.is_published } : l));
    setLoadingId(null);
  };

  const lessonTypeInfo = (type: string) => LESSON_TYPES.find((t) => t.value === type) || LESSON_TYPES[0];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {(["details", "lessons"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-6 py-3.5 text-sm font-semibold capitalize border-b-2 transition-colors",
              tab === t
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            {t === "lessons" ? `Lessons (${lessons.length})` : "Details"}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {tab === "details" && (
        <div className="p-6 max-w-2xl space-y-5">
          {detailError && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/40 px-4 py-3 rounded-xl">{detailError}</div>}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
            <input type="text" value={details.title} onChange={(e) => setDetail("title", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea value={details.description || ""} onChange={(e) => setDetail("description", e.target.value)}
              rows={4} placeholder="Describe what students will learn..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Language</label>
              <select value={details.language_id} onChange={(e) => setDetail("language_id", parseInt(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {languages.map((l) => <option key={l.id} value={l.id}>{l.flag_emoji} {l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Level</label>
              <select value={details.level} onChange={(e) => setDetail("level", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Estimated Duration (minutes)</label>
            <input type="number" min={0} value={details.duration_minutes}
              onChange={(e) => setDetail("duration_minutes", parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_published" checked={details.is_published} onChange={(e) => setDetail("is_published", e.target.checked)} className="h-4 w-4 rounded text-indigo-600" />
              <label htmlFor="is_published" className="text-sm text-gray-700 dark:text-gray-300 font-medium">Published (visible to students)</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_public" checked={details.is_public} onChange={(e) => setDetail("is_public", e.target.checked)} className="h-4 w-4 rounded text-indigo-600" />
              <label htmlFor="is_public" className="text-sm text-gray-700 dark:text-gray-300 font-medium">Public (listed in course catalog)</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button onClick={saveDetails} disabled={detailSaving}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                detailSaved
                  ? "bg-green-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
              )}>
              {detailSaved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : detailSaving ? "Saving..." : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
          </div>
        </div>
      )}

      {/* Lessons tab */}
      {tab === "lessons" && (
        <div className="p-6 max-w-3xl">
          {lessons.length === 0 && !showAddLesson ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <BookOpen className="h-10 w-10 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No lessons yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Add lessons to build your course</p>
              <button onClick={() => setShowAddLesson(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm">
                <Plus className="h-4 w-4" /> Add First Lesson
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {lessons.map((lesson, i) => (
                  <div key={lesson.id} className={cn("bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden", loadingId === lesson.id && "opacity-50")}>
                    {editingId === lesson.id ? (
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Title</label>
                            <input type="text" value={editLesson.title || ""}
                              onChange={(e) => setEditLesson((el) => ({ ...el, title: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Type</label>
                            <select value={editLesson.lesson_type || "lesson"}
                              onChange={(e) => setEditLesson((el) => ({ ...el, lesson_type: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                              {LESSON_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Duration (min)</label>
                            <input type="number" min={1} value={editLesson.duration_minutes || 10}
                              onChange={(e) => setEditLesson((el) => ({ ...el, duration_minutes: parseInt(e.target.value) || 10 }))}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={editLesson.is_published || false}
                                onChange={(e) => setEditLesson((el) => ({ ...el, is_published: e.target.checked }))}
                                className="h-4 w-4 rounded text-indigo-600" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">Published</span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Content / Notes</label>
                          <textarea value={editLesson.content || ""}
                            onChange={(e) => setEditLesson((el) => ({ ...el, content: e.target.value }))}
                            rows={3} placeholder="Lesson content or notes..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(lesson.id)} disabled={editSaving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold">
                            <Save className="h-3.5 w-3.5" /> {editSaving ? "Saving..." : "Save"}
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs font-semibold">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveLesson(i, -1)} disabled={i === 0} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                          <button onClick={() => moveLesson(i, 1)} disabled={i === lessons.length - 1} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                        </div>
                        <GripVertical className="h-4 w-4 text-gray-200 dark:text-gray-700 flex-shrink-0" />
                        <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex items-center gap-1.5 text-gray-400 flex-shrink-0">
                          {lessonTypeInfo(lesson.lesson_type).icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{lesson.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">{lesson.lesson_type}</span>
                            <span className="text-gray-200 dark:text-gray-700">·</span>
                            <span className="flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500"><Clock className="h-3 w-3" />{lesson.duration_minutes}m</span>
                          </div>
                        </div>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0", lesson.is_published ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500")}>
                          {lesson.is_published ? "Live" : "Draft"}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => startEdit(lesson)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors">
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button onClick={() => toggleLessonPublish(lesson)} disabled={loadingId === lesson.id} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            {lesson.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => deleteLesson(lesson.id)} disabled={loadingId === lesson.id} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!showAddLesson && (
                <button onClick={() => setShowAddLesson(true)}
                  className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-4 py-2.5 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-900 w-full justify-center transition-colors">
                  <Plus className="h-4 w-4" /> Add Lesson
                </button>
              )}
            </>
          )}

          {showAddLesson && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 shadow-sm p-5 space-y-4 mt-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Plus className="h-4 w-4 text-indigo-600" /> New Lesson</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Title *</label>
                  <input type="text" value={newLesson.title} onChange={(e) => setNewLesson((n) => ({ ...n, title: e.target.value }))}
                    placeholder="e.g. Introduction to greetings"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Type</label>
                  <select value={newLesson.lesson_type} onChange={(e) => setNewLesson((n) => ({ ...n, lesson_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {LESSON_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Duration (min)</label>
                  <input type="number" min={1} value={newLesson.duration_minutes} onChange={(e) => setNewLesson((n) => ({ ...n, duration_minutes: parseInt(e.target.value) || 10 }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newLesson.is_published} onChange={(e) => setNewLesson((n) => ({ ...n, is_published: e.target.checked }))} className="h-4 w-4 rounded text-indigo-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Content / Notes</label>
                <textarea value={newLesson.content} onChange={(e) => setNewLesson((n) => ({ ...n, content: e.target.value }))}
                  rows={3} placeholder="Lesson content, notes, or description..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={addLesson} disabled={addingLesson || !newLesson.title.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
                  <Plus className="h-4 w-4" /> {addingLesson ? "Adding..." : "Add Lesson"}
                </button>
                <button onClick={() => { setShowAddLesson(false); setNewLesson({ ...emptyLesson }); }}
                  className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-sm font-semibold">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
