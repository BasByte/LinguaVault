"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Users, Shield, CheckCircle, XCircle, Loader2,
  UserCog, ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Manager {
  id: number; name: string; email: string; is_active: boolean; created_at: string;
  manage_students: boolean | null; manage_educators: boolean | null;
  manage_courses: boolean | null; manage_tests: boolean | null;
  granted_by_name: string | null;
}

interface AllUser {
  id: number; name: string; email: string; role: string; is_active: boolean;
}

interface Props {
  managers: Manager[];
  allUsers: AllUser[];
}

const PERM_KEYS = ["manage_students", "manage_educators", "manage_courses", "manage_tests"] as const;
const PERM_LABELS: Record<string, string> = {
  manage_students: "Students",
  manage_educators: "Educators",
  manage_courses: "Courses",
  manage_tests: "Tests",
};

function PermToggle({ value, onChange, loading }: { value: boolean; onChange: () => void; loading: boolean }) {
  return (
    <button onClick={onChange} disabled={loading} className={cn(
      "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border",
      value ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100" : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
    )}>
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : value ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {PERM_LABELS[Object.keys(PERM_LABELS).find(k => PERM_LABELS[k] === PERM_LABELS[Object.keys(PERM_LABELS)[PERM_KEYS.indexOf("manage_students")]]) ?? ""] ?? ""}
    </button>
  );
}

function ManagerCard({ manager: initial, onDemote }: { manager: Manager; onDemote: (id: number) => void }) {
  const router = useRouter();
  const [manager, setManager] = useState(initial);
  const [loadingPerm, setLoadingPerm] = useState<string | null>(null);
  const [demoting, setDemoting] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const patchPerm = async (perm: string, value: boolean) => {
    setLoadingPerm(perm);
    const res = await fetch(`/api/admin/permissions/${manager.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [perm]: value }),
    });
    setLoadingPerm(null);
    if (res.ok) {
      setManager((prev) => ({ ...prev, [perm]: value }));
      router.refresh();
    }
  };

  const handleDemote = async () => {
    if (!confirm(`Remove manager role from ${manager.name}? They will become a regular user.`)) return;
    setDemoting(true);
    const res = await fetch(`/api/admin/permissions/${manager.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "standard" }),
    });
    setDemoting(false);
    if (res.ok) { onDemote(manager.id); router.refresh(); }
  };

  const grantedCount = PERM_KEYS.filter((k) => manager[k]).length;

  return (
    <div className={cn("bg-white rounded-2xl border shadow-sm overflow-hidden", !manager.is_active && "opacity-60")}>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-sm font-black text-white">{manager.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 truncate">{manager.name}</p>
            <p className="text-xs text-gray-500 truncate">{manager.email}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", grantedCount > 0 ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500")}>
              {grantedCount}/4 perms
            </span>
            <button onClick={() => setExpanded((v) => !v)} className="p-1 text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {PERM_KEYS.map((perm) => {
                const granted = !!manager[perm];
                return (
                  <button
                    key={perm}
                    onClick={() => patchPerm(perm, !granted)}
                    disabled={loadingPerm === perm}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                      granted
                        ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                        : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-700"
                    )}
                  >
                    {loadingPerm === perm
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                      : granted
                        ? <CheckCircle className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        : <XCircle className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    }
                    {PERM_LABELS[perm]}
                  </button>
                );
              })}
            </div>

            {manager.granted_by_name && (
              <p className="text-xs text-gray-400 mb-3">Granted by {manager.granted_by_name}</p>
            )}

            <button
              onClick={handleDemote}
              disabled={demoting}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors"
            >
              {demoting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              Remove Manager Role
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PermissionsManager({ managers: initial, allUsers }: Props) {
  const router = useRouter();
  const [managers, setManagers] = useState(initial);
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [promoting, setPromoting] = useState<number | null>(null);
  const [showPromote, setShowPromote] = useState(false);

  const handleDemote = (id: number) => setManagers((prev) => prev.filter((m) => m.id !== id));

  const nonManagers = allUsers.filter(
    (u) => u.role !== "manager" && u.role !== "admin" && u.is_active &&
    (u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const promoteUser = async (user: AllUser) => {
    if (!confirm(`Make ${user.name} a manager? They will get access to the Manager Portal.`)) return;
    setPromoting(user.id);
    const res = await fetch(`/api/admin/permissions/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "manager" }),
    });
    setPromoting(null);
    if (res.ok) {
      const newManager: Manager = {
        id: user.id, name: user.name, email: user.email, is_active: user.is_active,
        created_at: new Date().toISOString(),
        manage_students: false, manage_educators: false, manage_courses: false, manage_tests: false,
        granted_by_name: null,
      };
      setManagers((prev) => [newManager, ...prev]);
      setShowPromote(false);
      setUserSearch("");
      router.refresh();
    }
  };

  const filtered = managers.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Promote section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2"><UserCog className="h-4 w-4 text-teal-600" /> Promote to Manager</h2>
            <p className="text-xs text-gray-500 mt-0.5">Assign the manager role to an existing user</p>
          </div>
          <button
            onClick={() => setShowPromote((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Users className="h-4 w-4" /> {showPromote ? "Cancel" : "Add Manager"}
          </button>
        </div>

        {showPromote && (
          <div className="mt-3 border-t border-gray-100 pt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users to promote…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
              {nonManagers.slice(0, 20).map((u) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-gray-600">{u.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email} · <span className="capitalize">{u.role.replace("_", " ")}</span></p>
                    </div>
                  </div>
                  <button
                    onClick={() => promoteUser(u)}
                    disabled={promoting === u.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold ml-3 shrink-0 transition-colors disabled:opacity-50"
                  >
                    {promoting === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                    Make Manager
                  </button>
                </div>
              ))}
              {nonManagers.length === 0 && <div className="px-4 py-8 text-center text-sm text-gray-400">No users found</div>}
            </div>
          </div>
        )}
      </div>

      {/* Managers list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 text-sm">{managers.length} Current Manager{managers.length !== 1 ? "s" : ""}</h2>
          {managers.length > 3 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter managers…"
                className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-300" />
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <UserCog className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="font-semibold text-gray-500">No managers yet</p>
            <p className="text-sm text-gray-400 mt-1">Use "Add Manager" above to promote a user.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => <ManagerCard key={m.id} manager={m} onDemote={handleDemote} />)}
          </div>
        )}
      </div>
    </div>
  );
}
