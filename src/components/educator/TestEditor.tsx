"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save, FlaskConical, Plus, Trash2, CheckCircle, X, ChevronUp, ChevronDown,
} from "lucide-react";
import { getCEFRColor, cn } from "@/lib/utils";

interface Language { id: number; name: string; flag_emoji: string; }
interface Question {
  id: number; question: string; question_type: string;
  options: string[] | null; correct_answer: string;
  explanation: string | null; points: number; order_index: number;
}
interface Test {
  id: number; title: string; description: string | null; cefr_level: string;
  language_id: number; duration_minutes: number; passing_score: number;
  is_published: boolean; is_public: boolean;
  flag_emoji: string; language_name: string;
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
  { value: "fill_blank", label: "Fill in the Blank" },
  { value: "essay", label: "Short Answer / Essay" },
];

const emptyQForm = {
  question: "", question_type: "multiple_choice",
  options: ["", "", "", ""], correct_answer: "",
  explanation: "", points: 10,
};

export default function TestEditor({
  test: initial,
  questions: initialQuestions,
  languages,
  apiBase = "/api/educator",
}: {
  test: Test;
  questions: Question[];
  languages: Language[];
  apiBase?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"details" | "questions">("details");
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  const [details, setDetails] = useState({ ...initial });
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailSaved, setDetailSaved] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [showAddQ, setShowAddQ] = useState(false);
  const [qForm, setQForm] = useState({ ...emptyQForm });
  const [addingQ, setAddingQ] = useState(false);
  const [qError, setQError] = useState("");

  const [editingQId, setEditingQId] = useState<number | null>(null);
  const [editQForm, setEditQForm] = useState({ ...emptyQForm });
  const [editQSaving, setEditQSaving] = useState(false);

  const [loadingId, setLoadingId] = useState<number | null>(null);

  const setDetail = (k: string, v: string | number | boolean) =>
    setDetails((d) => ({ ...d, [k]: v }));

  const saveDetails = async () => {
    if (!details.title.trim()) { setDetailError("Title is required"); return; }
    setDetailSaving(true);
    setDetailError("");
    const res = await fetch(`${apiBase}/tests/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: details.title, description: details.description,
        cefr_level: details.cefr_level, language_id: details.language_id,
        duration_minutes: details.duration_minutes, passing_score: details.passing_score,
        is_published: details.is_published, is_public: details.is_public,
      }),
    });
    setDetailSaving(false);
    if (res.ok) { setDetailSaved(true); setTimeout(() => setDetailSaved(false), 2500); router.refresh(); }
    else setDetailError("Failed to save changes");
  };

  const buildQuestionPayload = (form: typeof qForm) => {
    const payload: Record<string, unknown> = {
      question: form.question, question_type: form.question_type,
      correct_answer: form.correct_answer, explanation: form.explanation || null,
      points: form.points,
    };
    if (form.question_type === "multiple_choice") {
      payload.options = form.options.filter((o) => o.trim() !== "");
    } else {
      payload.options = null;
    }
    return payload;
  };

  const validateQ = (form: typeof qForm) => {
    if (!form.question.trim()) return "Question text is required";
    if (!form.correct_answer.trim()) return "Correct answer is required";
    if (form.question_type === "multiple_choice") {
      const opts = form.options.filter((o) => o.trim());
      if (opts.length < 2) return "At least 2 options are required";
      if (!opts.includes(form.correct_answer.trim())) return "Correct answer must match one of the options";
    }
    return null;
  };

  const addQuestion = async () => {
    const err = validateQ(qForm);
    if (err) { setQError(err); return; }
    setAddingQ(true);
    setQError("");
    const res = await fetch(`${apiBase}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test_id: initial.id, ...buildQuestionPayload(qForm) }),
    });
    if (res.ok) {
      const created = await res.json();
      setQuestions((qs) => [...qs, created]);
      setQForm({ ...emptyQForm });
      setShowAddQ(false);
    } else {
      setQError("Failed to add question");
    }
    setAddingQ(false);
  };

  const startEditQ = (q: Question) => {
    setEditingQId(q.id);
    setEditQForm({
      question: q.question, question_type: q.question_type,
      options: q.options ? [...q.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""],
      correct_answer: q.correct_answer, explanation: q.explanation || "",
      points: q.points,
    });
  };

  const saveEditQ = async (id: number) => {
    const err = validateQ(editQForm);
    if (err) { alert(err); return; }
    setEditQSaving(true);
    const res = await fetch(`${apiBase}/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildQuestionPayload(editQForm)),
    });
    if (res.ok) {
      const updated = await res.json();
      setQuestions((qs) => qs.map((q) => q.id === id ? { ...q, ...updated } : q));
      setEditingQId(null);
    }
    setEditQSaving(false);
  };

  const deleteQuestion = async (id: number) => {
    if (!confirm("Delete this question?")) return;
    setLoadingId(id);
    const res = await fetch(`${apiBase}/questions/${id}`, { method: "DELETE" });
    if (res.ok) setQuestions((qs) => qs.filter((q) => q.id !== id));
    setLoadingId(null);
  };

  const moveQuestion = async (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((q, i) => (q.order_index = i));
    setQuestions(updated);
    await Promise.all([
      fetch(`${apiBase}/questions/${updated[index].id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_index: index }) }),
      fetch(`${apiBase}/questions/${updated[newIndex].id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_index: newIndex }) }),
    ]);
  };

  const QFormFields = ({ form, setForm }: { form: typeof qForm; setForm: (f: typeof qForm) => void }) => (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Question Type</label>
        <select value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value, correct_answer: "", options: ["", "", "", ""] })}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Question *</label>
        <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
          rows={2} placeholder="Enter the question..."
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
      </div>

      {form.question_type === "multiple_choice" && (
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Answer Options</label>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct_mc" checked={form.correct_answer === opt && opt.trim() !== ""}
                  onChange={() => opt.trim() && setForm({ ...form, correct_answer: opt })}
                  className="h-4 w-4 text-indigo-600 flex-shrink-0" title="Select as correct answer" />
                <input type="text" value={opt}
                  onChange={(e) => { const opts = [...form.options]; opts[i] = e.target.value; setForm({ ...form, options: opts, correct_answer: form.correct_answer === form.options[i] ? e.target.value : form.correct_answer }); }}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Click the radio button to mark the correct answer</p>
        </div>
      )}

      {form.question_type === "true_false" && (
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Correct Answer</label>
          <div className="flex gap-3">
            {["true", "false"].map((v) => (
              <button key={v} type="button" onClick={() => setForm({ ...form, correct_answer: v })}
                className={cn("flex-1 py-2 rounded-lg border text-sm font-semibold capitalize transition-all", form.correct_answer === v ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800")}>
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {(form.question_type === "fill_blank" || form.question_type === "essay") && (
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">
            {form.question_type === "essay" ? "Model Answer / Keywords" : "Correct Answer *"}
          </label>
          <input type="text" value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
            placeholder={form.question_type === "essay" ? "Keywords or model answer..." : "The correct answer..."}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Points</label>
          <input type="number" min={1} value={form.points} onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 10 })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Explanation (optional)</label>
          <input type="text" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            placeholder="Why is this the answer?"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
    </div>
  );

  const totalPoints = questions.reduce((s, q) => s + (q.points || 0), 0);

  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        {(["details", "questions"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-6 py-3.5 text-sm font-semibold capitalize border-b-2 transition-colors", tab === t ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300")}>
            {t === "questions" ? `Questions (${questions.length} · ${totalPoints} pts)` : "Details"}
          </button>
        ))}
      </div>

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
              rows={3} placeholder="What does this test assess?"
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">CEFR Level</label>
              <select value={details.cefr_level} onChange={(e) => setDetail("cefr_level", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {CEFR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Duration (minutes)</label>
              <input type="number" min={1} max={300} value={details.duration_minutes}
                onChange={(e) => setDetail("duration_minutes", parseInt(e.target.value) || 30)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Passing Score (%)</label>
              <input type="number" min={0} max={100} value={details.passing_score}
                onChange={(e) => setDetail("passing_score", parseInt(e.target.value) || 70)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_published" checked={details.is_published} onChange={(e) => setDetail("is_published", e.target.checked)} className="h-4 w-4 rounded text-indigo-600" />
              <label htmlFor="is_published" className="text-sm text-gray-700 dark:text-gray-300 font-medium">Published (visible to students)</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_public" checked={details.is_public} onChange={(e) => setDetail("is_public", e.target.checked)} className="h-4 w-4 rounded text-indigo-600" />
              <label htmlFor="is_public" className="text-sm text-gray-700 dark:text-gray-300 font-medium">Public (listed in test catalog)</label>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button onClick={saveDetails} disabled={detailSaving}
              className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all", detailSaved ? "bg-green-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50")}>
              {detailSaved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : detailSaving ? "Saving..." : <><Save className="h-4 w-4" /> Save Changes</>}
            </button>
          </div>
        </div>
      )}

      {tab === "questions" && (
        <div className="p-6 max-w-3xl">
          {questions.length === 0 && !showAddQ ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <FlaskConical className="h-10 w-10 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No questions yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Add questions to build your test</p>
              <button onClick={() => setShowAddQ(true)} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm">
                <Plus className="h-4 w-4" /> Add First Question
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {questions.map((q, i) => (
                <div key={q.id} className={cn("bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden", loadingId === q.id && "opacity-50")}>
                  {editingQId === q.id ? (
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Edit Question {i + 1}</h4>
                        <button onClick={() => setEditingQId(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-4 w-4" /></button>
                      </div>
                      <QFormFields form={editQForm} setForm={setEditQForm} />
                      <div className="flex gap-2">
                        <button onClick={() => saveEditQ(q.id)} disabled={editQSaving}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold">
                          <Save className="h-3.5 w-3.5" /> {editQSaving ? "Saving..." : "Save"}
                        </button>
                        <button onClick={() => setEditingQId(null)} className="px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-xs font-semibold">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 p-4">
                      <div className="flex flex-col gap-0.5 mt-1">
                        <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
                        <button onClick={() => moveQuestion(i, 1)} disabled={i === questions.length - 1} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
                      </div>
                      <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{q.question}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                            {QUESTION_TYPES.find((t) => t.value === q.question_type)?.label || q.question_type}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{q.points} pts</span>
                          {q.question_type === "multiple_choice" && q.options && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">{q.options.length} options</span>
                          )}
                          {q.correct_answer && (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5">
                              <CheckCircle className="h-3 w-3" /> {q.question_type === "multiple_choice" ? "Answer set" : q.correct_answer}
                            </span>
                          )}
                        </div>
                        {q.explanation && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">{q.explanation}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEditQ(q)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button onClick={() => deleteQuestion(q.id)} disabled={loadingId === q.id} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {!showAddQ && (
                <button onClick={() => { setShowAddQ(true); setQError(""); }}
                  className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-4 py-2.5 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-900 w-full justify-center transition-colors">
                  <Plus className="h-4 w-4" /> Add Question
                </button>
              )}
            </div>
          )}

          {showAddQ && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 shadow-sm p-5 space-y-4 mt-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Plus className="h-4 w-4 text-indigo-600" /> New Question</h3>
                <button onClick={() => { setShowAddQ(false); setQForm({ ...emptyQForm }); setQError(""); }} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"><X className="h-4 w-4" /></button>
              </div>
              {qError && <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/40 px-3 py-2 rounded-lg">{qError}</div>}
              <QFormFields form={qForm} setForm={setQForm} />
              <div className="flex gap-2 pt-1">
                <button onClick={addQuestion} disabled={addingQ || !qForm.question.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
                  <Plus className="h-4 w-4" /> {addingQ ? "Adding..." : "Add Question"}
                </button>
                <button onClick={() => { setShowAddQ(false); setQForm({ ...emptyQForm }); setQError(""); }}
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
