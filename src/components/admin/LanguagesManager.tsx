"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight, Globe, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Language {
  id: number; name: string; code: string; flag_emoji: string | null;
  description: string | null; is_active: boolean; created_at: string;
  _count: { courses: number; tests: number };
}

const emptyForm = { name: "", code: "", flag_emoji: "", description: "" };

function FlagPreview({ emoji }: { emoji: string }) {
  if (!emoji) return <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300"><Globe className="h-4 w-4" /></div>;
  return <div className={"w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-xl leading-none fi fi-"+emoji.toLowerCase()} />;
}

export default function LanguagesManager({ languages: initial }: { languages: Language[] }) {
  const router = useRouter();
  const [languages, setLanguages] = useState(initial);
  const [, startTransition] = useTransition();

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [loadingId, setLoadingId] = useState<number | null>(null);

  const setAdd = (k: string, v: string) => setAddForm((f) => ({ ...f, [k]: v }));
  const setEdit = (k: string, v: string) => setEditForm((f) => ({ ...f, [k]: v }));

  const startEdit = (lang: Language) => {
    setEditingId(lang.id);
    setEditForm({ name: lang.name, code: lang.code, flag_emoji: lang.flag_emoji ?? "", description: lang.description ?? "" });
    setEditError("");
  };

  const cancelEdit = () => { setEditingId(null); setEditError(""); };

  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.code.trim()) { setAddError("Name and code are required"); return; }
    setAdding(true);
    setAddError("");
    const res = await fetch("/api/admin/languages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    setAdding(false);
    if (res.ok) {
      const data = await res.json();
      setLanguages((prev) => [...prev, data.language].sort((a, b) => a.name.localeCompare(b.name)));
      setAddForm({ ...emptyForm });
      setShowAdd(false);
      startTransition(() => router.refresh());
    } else {
      const data = await res.json().catch(() => ({}));
      setAddError(data.error || "Failed to create language");
    }
  };

  const handleSaveEdit = async (id: number) => {
    if (!editForm.name.trim() || !editForm.code.trim()) { setEditError("Name and code are required"); return; }
    setEditSaving(true);
    setEditError("");
    const res = await fetch(`/api/admin/languages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditSaving(false);
    if (res.ok) {
      const data = await res.json();
      setLanguages((prev) =>
        prev.map((l) => l.id === id ? { ...l, ...data.language } : l).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      startTransition(() => router.refresh());
    } else {
      const data = await res.json().catch(() => ({}));
      setEditError(data.error || "Failed to save");
    }
  };

  const toggleActive = async (lang: Language) => {
    setLoadingId(lang.id);
    const res = await fetch(`/api/admin/languages/${lang.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !lang.is_active }),
    });
    setLoadingId(null);
    if (res.ok) {
      setLanguages((prev) => prev.map((l) => l.id === lang.id ? { ...l, is_active: !lang.is_active } : l));
      startTransition(() => router.refresh());
    }
  };

  const deleteLang = async (lang: Language) => {
    if (!confirm(`Delete "${lang.name}"? This cannot be undone.`)) return;
    setLoadingId(lang.id);
    const res = await fetch(`/api/admin/languages/${lang.id}`, { method: "DELETE" });
    setLoadingId(null);
    if (res.ok) {
      setLanguages((prev) => prev.filter((l) => l.id !== lang.id));
      startTransition(() => router.refresh());
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete language");
    }
  };

  const activeCount = languages.filter((l) => l.is_active).length;

  return (
    <div className="space-y-4">
      {/* Header stats + add button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5 text-center min-w-20">
            <p className="text-lg font-black text-gray-900">{languages.length}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5 text-center min-w-20">
            <p className="text-lg font-black text-green-600">{activeCount}</p>
            <p className="text-xs text-gray-500">Active</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5 text-center min-w-20">
            <p className="text-lg font-black text-gray-400">{languages.length - activeCount}</p>
            <p className="text-xs text-gray-500">Disabled</p>
          </div>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Language
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border-2 border-red-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-red-600" /> New Language
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
              <input
                value={addForm.name}
                onChange={(e) => setAdd("name", e.target.value)}
                placeholder="e.g. Spanish"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Code * <span className="text-gray-400 font-normal">(ISO 639-1)</span></label>
              <input
                value={addForm.code}
                onChange={(e) => setAdd("code", e.target.value.toLowerCase())}
                placeholder="e.g. es"
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Flag Emoji</label>
              <div className="flex gap-2 items-center">
                <input
                  value={addForm.flag_emoji}
                  onChange={(e) => setAdd("flag_emoji", e.target.value)}
                  placeholder="🇪🇸"
                  maxLength={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <FlagPreview emoji={addForm.flag_emoji} />

              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <input
                value={addForm.description}
                onChange={(e) => setAdd("description", e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
          </div>
          {addError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{addError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={adding}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Create Language
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddForm({ ...emptyForm }); setAddError(""); }}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Languages grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {languages.map((lang) => {
          const isEditing = editingId === lang.id;
          const isLoading = loadingId === lang.id;

          return (
            <div
              key={lang.id}
              className={cn(
                "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all",
                lang.is_active ? "border-gray-100" : "border-gray-100 opacity-60",
                isEditing ? "ring-2 ring-red-200" : ""
              )}
            >
              {isEditing ? (
                /* Edit mode */
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEdit("name", e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Code *</label>
                      <input
                        value={editForm.code}
                        onChange={(e) => setEdit("code", e.target.value.toLowerCase())}
                        maxLength={10}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Flag Emoji</label>
                      <div className="flex gap-1.5 items-center">
                        <input
                          value={editForm.flag_emoji}
                          onChange={(e) => setEdit("flag_emoji", e.target.value)}
                          maxLength={4}
                          className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                        />
                        <FlagPreview emoji={editForm.flag_emoji} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                      <input
                        value={editForm.description}
                        onChange={(e) => setEdit("description", e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                    </div>
                  </div>
                  {editError && <p className="text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg">{editError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(lang.id)}
                      disabled={editSaving}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      {editSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <X className="h-3 w-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={"w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-2xl leading-none shrink-0 fi fi-" + lang.flag_emoji?.toLowerCase()}>
                        
                         
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm">{lang.name}</h3>
                        <code className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded font-mono">{lang.code}</code>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActive(lang)}
                      disabled={isLoading}
                      title={lang.is_active ? "Disable language" : "Enable language"}
                      className={cn("shrink-0 transition-colors", lang.is_active ? "text-green-500 hover:text-green-700" : "text-gray-300 hover:text-green-500")}
                    >
                      {isLoading
                        ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        : lang.is_active
                          ? <ToggleRight className="h-6 w-6" />
                          : <ToggleLeft className="h-6 w-6" />
                      }
                    </button>
                  </div>

                  {lang.description && (
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{lang.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="font-bold text-gray-700">{lang._count.courses}</span> courses
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-bold text-gray-700">{lang._count.tests}</span> tests
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-semibold",
                        lang.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                      )}>
                        {lang.is_active ? "Active" : "Disabled"}
                      </span>
                      <button
                        onClick={() => startEdit(lang)}
                        className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteLang(lang)}
                        disabled={isLoading}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {languages.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Globe className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No languages yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Add Language" to create the first one.</p>
        </div>
      )}
    </div>
  );
}
