"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Star, Clock, ChevronRight, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Language } from "@/types";

interface LearnSidebarProps {
  languages?: Language[];
}

const LEVELS = [
  { value: "beginner", label: "Beginner", cefr: "A1" },
  { value: "elementary", label: "Elementary", cefr: "A2" },
  { value: "intermediate", label: "Intermediate", cefr: "B1" },
  { value: "upper_intermediate", label: "Upper-Inter.", cefr: "B2" },
  { value: "advanced", label: "Advanced", cefr: "C1" },
  { value: "proficiency", label: "Proficiency", cefr: "C2" },
];

export default function LearnSidebar({ languages = [] }: LearnSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLang = searchParams.get("lang");
  const currentLevel = searchParams.get("level");

  const activeLink = "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300";
  const inactiveLink = "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800";

  return (
    <aside className="w-64 shrink-0 hidden lg:block">
      <div className="sticky top-20 space-y-6">
        {/* Browse */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Browse</h3>
          <nav className="space-y-1">
            <Link href="/learn" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all", pathname === "/learn" && !currentLang && !currentLevel ? activeLink : inactiveLink)}>
              <Layers className="h-4 w-4" /> All Courses
              <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
            </Link>
            <Link href="/learn?sort=popular" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all", inactiveLink)}>
              <Star className="h-4 w-4 text-amber-500" /> Most Popular
              <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
            </Link>
            <Link href="/learn?sort=newest" className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all", inactiveLink)}>
              <Clock className="h-4 w-4 text-blue-500" /> Newest
              <ChevronRight className="h-3 w-3 ml-auto opacity-40" />
            </Link>
          </nav>
        </div>

        {/* Languages */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Languages</h3>
          <nav className="space-y-1">
            {languages.map((lang) => (
              <Link key={lang.id} href={`/learn?lang=${lang.code}`}
                className={cn("flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all", currentLang === lang.code ? activeLink : inactiveLink)}
              >
                <span className={"text-lg fi fi-"+lang.code.toLowerCase()} ></span>
                <span>{lang.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Levels */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Level</h3>
          <nav className="space-y-1">
            {LEVELS.map((level) => (
              <Link key={level.value} href={`/learn?level=${level.value}`}
                className={cn("flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all", currentLevel === level.value ? activeLink : inactiveLink)}
              >
                <span>{level.label}</span>
                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-md font-mono">{level.cefr}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Offline banner */}
        <div className="bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/50 dark:to-sky-950/50 rounded-2xl border border-indigo-100 dark:border-indigo-900 p-5">
          <div className="text-2xl mb-2">📥</div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Offline Access</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">Download courses to learn anywhere, even without internet.</p>
        </div>
      </div>
    </aside>
  );
}
