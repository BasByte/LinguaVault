"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "free_tier", label: "Free Tier (student)" },
  { value: "standard", label: "Standard (student)" },
  { value: "educator", label: "Educator" },
  { value: "admin", label: "Admin" },
];

interface UserData {
  id?: number; name: string; email: string; role: string;
  is_active?: boolean; bio?: string;
}

export default function UserForm({ user, mode }: { user?: UserData; mode: "new" | "edit" }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "free_tier",
    bio: user?.bio ?? "",
    password: "",
    is_active: user?.is_active ?? true,
  });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required"); return; }
    if (mode === "new" && !form.password) { setError("Password is required for new users"); return; }
    setSaving(true);
    setError("");

    const payload: Record<string, unknown> = {
      name: form.name, email: form.email, role: form.role,
      bio: form.bio || null, is_active: form.is_active,
    };
    if (form.password) payload.password = form.password;

    const url = mode === "new" ? "/api/admin/users" : `/api/admin/users/${user!.id}`;
    const method = mode === "new" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      if (mode === "new") {
        router.push("/admin/users");
        router.refresh();
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        router.refresh();
      }
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed to save user");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Dr. Sarah Chen"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="user@linguaVault.com"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role *</label>
          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Password {mode === "edit" && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={mode === "new" ? "Set password" : "Change password"}
              className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
        <textarea
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={3}
          placeholder="Optional bio or notes about this user..."
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
        />
      </div>

      {mode === "edit" && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set("is_active", !form.is_active)}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
              form.is_active ? "bg-green-500" : "bg-gray-300"
            )}
          >
            <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", form.is_active ? "translate-x-4" : "translate-x-0.5")} />
          </button>
          <span className="text-sm font-medium text-gray-700">Account {form.is_active ? "Active" : "Inactive"}</span>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {mode === "new" ? "Create User" : saved ? "Saved!" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
