"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, Eye, EyeOff, BookOpen } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-sky-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white">LinguaVault</span>
          </Link>
          <p className="text-indigo-300 mt-2 text-sm">Welcome back</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Sign in</h1>
          <p className="text-gray-500 text-sm mb-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Create one free
            </Link>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* Demo credentials */}
{/*           <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-bold text-indigo-700 mb-2">Demo Accounts (password: admin123):</p>
            <div className="space-y-1 text-xs text-indigo-600">
              <p>Admin: <code className="bg-indigo-100 px-1 rounded">admin@linguaVault.com</code></p>
              <p>Educator: <code className="bg-indigo-100 px-1 rounded">sarah@linguaVault.com</code></p>
              <p>Student: <code className="bg-indigo-100 px-1 rounded">john@example.com</code></p>
            </div>
          </div> */}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link href="/learn" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-indigo-600 font-medium transition-colors">
              <BookOpen className="h-4 w-4" />
              Continue browsing without an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
