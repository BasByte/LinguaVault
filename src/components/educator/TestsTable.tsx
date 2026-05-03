"use client";
import { useState } from "react";
import Link from "next/link";
import { Edit2, Trash2, Eye, EyeOff, FlaskConical } from "lucide-react";
import { getCEFRColor, cn } from "@/lib/utils";

interface Test {
  id: number;
  title: string;
  cefr_level: string;
  is_published: boolean;
  attempt_count: number;
  duration_minutes: number;
  passing_score: number;
  question_count: number;
  language_name: string;
  flag_emoji: string;
  created_at: string;
}

export default function TestsTable({ tests: initial }: { tests: Test[] }) {
  const [tests, setTests] = useState(initial);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const togglePublish = async (test: Test) => {
    setLoadingId(test.id);
    const res = await fetch(`/api/educator/tests/${test.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: !test.is_published }),
    });
    if (res.ok) {
      setTests((ts) => ts.map((t) => t.id === test.id ? { ...t, is_published: !t.is_published } : t));
    }
    setLoadingId(null);
  };

  const deleteTest = async (test: Test) => {
    if (!confirm(`Delete "${test.title}"? This cannot be undone.`)) return;
    setLoadingId(test.id);
    const res = await fetch(`/api/educator/tests/${test.id}`, { method: "DELETE" });
    if (res.ok) {
      setTests((ts) => ts.filter((t) => t.id !== test.id));
    } else {
      alert("Failed to delete test. It may have student attempts.");
    }
    setLoadingId(null);
  };

  if (tests.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-16 text-center">
        <FlaskConical className="h-12 w-12 mx-auto mb-4 text-gray-200 dark:text-gray-700" />
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No tests yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Create your first assessment test</p>
        <Link href="/educator/tests/new" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all">
          + Create Test
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
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Test</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Level</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Questions</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Attempts</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Duration</th>
              <th className="px-5 py-3.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Pass %</th>
              <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {tests.map((test) => (
              <tr key={test.id} className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors", loadingId === test.id && "opacity-50")}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{test.flag_emoji}</span>
                    <div>
                      <Link href={`/educator/tests/${test.id}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {test.title}
                      </Link>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{test.language_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("text-xs px-2 py-1 rounded-full font-bold border", getCEFRColor(test.cefr_level))}>
                    {test.cefr_level}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold", test.is_published ? "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400")}>
                    {test.is_published ? "● Live" : "○ Draft"}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">{test.question_count}</td>
                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{test.attempt_count.toLocaleString()}</td>
                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{test.duration_minutes}m</td>
                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{test.passing_score}%</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1 justify-end">
                    <Link href={`/educator/tests/${test.id}`} title="Edit test"
                      className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 text-gray-400 rounded-lg transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <button onClick={() => togglePublish(test)} disabled={loadingId === test.id}
                      title={test.is_published ? "Unpublish" : "Publish"}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors">
                      {test.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button onClick={() => deleteTest(test)} disabled={loadingId === test.id}
                      title="Delete test"
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
