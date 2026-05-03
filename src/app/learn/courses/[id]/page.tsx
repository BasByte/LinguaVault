import { notFound } from "next/navigation";
import { queryOne, query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Clock, Users, Star, BookOpen, FileText, Zap, PlayCircle, ChevronRight, Download } from "lucide-react";
import { formatDuration, formatNumber, getLevelColor, getLevelLabel, getCEFRColor, cn } from "@/lib/utils";

interface Lesson {
  id: number;
  title: string;
  lesson_type: string;
  duration_minutes: number;
  order_index: number;
  is_published: boolean;
}

const lessonTypeIcon: Record<string, React.ReactNode> = {
  lesson: <BookOpen className="h-4 w-4" />,
  article: <FileText className="h-4 w-4" />,
  exercise: <Zap className="h-4 w-4" />,
  video: <PlayCircle className="h-4 w-4" />,
  quiz: <FileText className="h-4 w-4" />,
};

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const course = await queryOne(
    `SELECT c.*, l.name as language_name, l.code as language_code, l.flag_emoji,
            u.name as educator_name, u.bio as educator_bio
     FROM courses c
     LEFT JOIN languages l ON c.language_id = l.id
     LEFT JOIN users u ON c.educator_id = u.id
     WHERE c.id = $1 AND c.is_published = true`,
    [parseInt(id)]
  ) as { id: number; title: string; description: string; level: string; flag_emoji: string; language_name: string; educator_name: string; educator_bio: string; enrollment_count: number; rating: number; duration_minutes: number; tags: string[] } | null;

  if (!course) notFound();

  const lessons = await query<Lesson>(
    "SELECT * FROM lessons WHERE course_id = $1 AND is_published = true ORDER BY order_index",
    [parseInt(id)]
  );

  const levelCEFR: Record<string, string> = {
    beginner: "A1", elementary: "A2", intermediate: "B1",
    upper_intermediate: "B2", advanced: "C1", proficiency: "C2",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session} />

      {/* Course hero */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-indigo-300 text-sm mb-4">
            <Link href="/learn" className="hover:text-white">Courses</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">{course.title}</span>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{course.flag_emoji}</span>
                <div className="flex gap-2">
                  <span className={cn("px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white")}>{course.language_name}</span>
                  <span className={cn("px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white")}>{getLevelLabel(course.level)}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900">{levelCEFR[course.level]}</span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black mb-4">{course.title}</h1>
              <p className="text-indigo-200 text-lg leading-relaxed mb-6">{course.description}</p>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-400 fill-amber-400" /><span className="font-bold">{Number(course.rating).toFixed(1)}</span></div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span>{formatNumber(course.enrollment_count)} students</span></div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>{formatDuration(course.duration_minutes)}</span></div>
                <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /><span>{lessons.length} lessons</span></div>
              </div>
            </div>

            {/* Enroll card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 text-gray-900">
              <div className="text-5xl text-center mb-4">{course.flag_emoji}</div>
              <div className="text-center mb-4">
                <span className="text-3xl font-black text-indigo-600">Free</span>
                <p className="text-gray-500 text-sm">No registration required</p>
              </div>
              {lessons[0] && (
                <Link
                  href={`/learn/courses/${course.id}/lessons/${lessons[0].id}`}
                  className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl text-center transition-all shadow-sm hover:shadow-md mb-3"
                >
                  Start Course
                </Link>
              )}
              <button className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm">
                <Download className="h-4 w-4" /> Download for Offline
              </button>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <p className="text-xs text-gray-500 flex items-center gap-2"><span>✓</span> Lifetime access</p>
                <p className="text-xs text-gray-500 flex items-center gap-2"><span>✓</span> Offline access available</p>
                <p className="text-xs text-gray-500 flex items-center gap-2"><span>✓</span> Certificate of completion</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Tags */}
            {course.tags && course.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {course.tags.map((tag: string) => (
                  <span key={tag} className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full font-medium">{tag}</span>
                ))}
              </div>
            )}

            {/* Lessons list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Course Content</h2>
                <p className="text-gray-500 text-sm mt-1">{lessons.length} lessons • {formatDuration(course.duration_minutes)}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {lessons.map((lesson, idx) => (
                  <Link
                    key={lesson.id}
                    href={`/learn/courses/${course.id}/lessons/${lesson.id}`}
                    className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      {lessonTypeIcon[lesson.lesson_type] || <BookOpen className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors truncate">{lesson.title}</p>
                      <p className="text-xs text-gray-400 capitalize">{lesson.lesson_type}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{lesson.duration_minutes}m</span>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Instructor */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Instructor</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0">
                  {course.educator_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{course.educator_name}</h3>
                  <p className="text-indigo-600 text-sm font-medium mb-2">Certified Language Educator</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{course.educator_bio || "Expert language educator with years of teaching experience."}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Side info */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-3">Course Level</h3>
              <div className="flex items-center gap-2">
                <span className={cn("px-3 py-1.5 rounded-full text-sm font-bold border", getCEFRColor(levelCEFR[course.level]))}>
                  {levelCEFR[course.level]} — {getLevelLabel(course.level)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                Take an assessment to officially certify your language level after completing this course.
              </p>
              <Link href="/assess" className="mt-3 block text-center text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                View Assessments →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
