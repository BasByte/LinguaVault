import Link from "next/link";
import { Clock, Users, Star, BookOpen } from "lucide-react";
import { Course } from "@/types";
import { cn, formatDuration, formatNumber, getLevelLabel, getLevelColor } from "@/lib/utils";

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/learn/courses/${course.id}`} className="group">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg dark:hover:shadow-gray-950 hover:-translate-y-1 transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-sky-100 dark:from-indigo-950 dark:via-purple-950 dark:to-sky-950">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl">{course.flag_emoji || "📚"}</div>
          </div>
          <div className="absolute top-3 left-3">
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", getLevelColor(course.level))}>
              {getLevelLabel(course.level)}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="bg-white/90 dark:bg-gray-900/90 text-gray-700 dark:text-gray-200 px-2.5 py-1 rounded-full text-xs font-semibold">
              {course.language_name}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1.5 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
            {course.title}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2 flex-1">
            {course.description}
          </p>

          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">
            By {course.educator_name}
          </div>

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {course.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-md font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">{Number(course.rating).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{formatNumber(course.enrollment_count)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDuration(course.duration_minutes)}</span>
            </div>
            {course.lesson_count && (
              <div className="flex items-center gap-1 ml-auto">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{course.lesson_count} lessons</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
