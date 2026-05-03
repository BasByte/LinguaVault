"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, UserCheck, UserX, Pencil, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: number; name: string; email: string; role: string; is_active: boolean;
  total_points: number; streak_days: number; created_at: string;
  _count: { enrollments: number; test_attempts: number; courses: number };
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  educator: "bg-purple-100 text-purple-700 border-purple-200",
  standard: "bg-blue-100 text-blue-700 border-blue-200",
  free_tier: "bg-gray-100 text-gray-600 border-gray-200",
};

const ROLES = ["all", "admin", "educator", "standard", "free_tier"];

export default function UsersTable({ users: initial }: { users: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const toggleActive = async (user: User) => {
    setLoadingId(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    setLoadingId(null);
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !user.is_active } : u));
      startTransition(() => router.refresh());
    }
  };

  const deleteUser = async (user: User) => {
    if (!confirm(`Deactivate ${user.name}? They will lose access but data is preserved.`)) return;
    setDeletingId(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: false } : u));
      startTransition(() => router.refresh());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize",
                roleFilter === r
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
              )}
            >
              {r === "all" ? "All" : r.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300"
            />
          </div>
          <Link
            href="/admin/users/new"
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            New User
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Activity</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Joined</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No users found</td>
                </tr>
              ) : filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0",
                        user.role === "admin" ? "bg-gradient-to-br from-red-400 to-orange-500"
                        : user.role === "educator" ? "bg-gradient-to-br from-purple-400 to-indigo-500"
                        : "bg-gradient-to-br from-blue-400 to-sky-500"
                      )}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate max-w-40">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-40">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border capitalize", ROLE_COLORS[user.role] || "bg-gray-100 text-gray-600 border-gray-200")}>
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div>{user._count.enrollments} enrollments</div>
                      <div>{user._count.test_attempts} attempts</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(user)}
                      disabled={loadingId === user.id}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border",
                        user.is_active
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                      )}
                    >
                      {user.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                      {user.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="p-1.5 hover:bg-indigo-50 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Edit user"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => deleteUser(user)}
                        disabled={deletingId === user.id}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                        title="Deactivate user"
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
          Showing {filtered.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}
