import UserForm from "@/components/admin/UserForm";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function NewUserPage() {
  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </Link>
        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
          <UserPlus className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900">Create User</h1>
          <p className="text-xs text-gray-500">Add a new platform user</p>
        </div>
      </div>
      <UserForm mode="new" />
    </div>
  );
}
