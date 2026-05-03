import Link from "next/link";
import { Clock, Users, BookCheck } from "lucide-react";
import { Test } from "@/types";
import { cn, formatNumber, getCEFRColor } from "@/lib/utils";

interface TestCardProps {
  test: Test;
}

export default function TestCard({ test }: TestCardProps) {
  return (
    <Link href={`/assess/tests/${test.id}`} className="group">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg dark:hover:shadow-gray-950 hover:-translate-y-1 transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 p-6 relative">
          <div className="flex items-start justify-between mb-3">
            <span className={cn("cefr-badge", getCEFRColor(test.cefr_level))}>
              {test.cefr_level}
            </span>
            <span className="text-3xl">{test.flag_emoji || "📝"}</span>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
            {test.title}
          </h3>
          {test.language_name && (
            <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-1">{test.language_name}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {test.description && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2 flex-1">
              {test.description}
            </p>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
            By {test.educator_name}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{test.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{formatNumber(test.attempt_count)} attempts</span>
            </div>
            {test.question_count && (
              <div className="flex items-center gap-1 ml-auto">
                <BookCheck className="h-3.5 w-3.5" />
                <span>{test.question_count}Q</span>
              </div>
            )}
          </div>

          <div className="mt-3">
            <div className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl text-center transition-colors">
              Take Test
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
