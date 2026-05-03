import { notFound } from "next/navigation";
import { queryOne, query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen, FileText, Zap, Download } from "lucide-react";

interface Exercise {
  id: number;
  exercise_type: string;
  question: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
  points: number;
}

export default async function LessonPage({ params }: { params: Promise<{ id: string; lessonId: string }> }) {
  const { id, lessonId } = await params;
  const session = await getSession();

  const lesson = await queryOne(
    `SELECT l.*, c.title as course_title, c.id as course_id
     FROM lessons l
     JOIN courses c ON l.course_id = c.id
     WHERE l.id = $1 AND l.is_published = true`,
    [parseInt(lessonId)]
  ) as {
    id: number; title: string; content: string; lesson_type: string;
    duration_minutes: number; order_index: number; course_id: number; course_title: string;
  } | null;

  if (!lesson) notFound();

  const [exercises, prev, next, allLessons] = await Promise.all([
    query<Exercise>("SELECT * FROM exercises WHERE lesson_id = $1 ORDER BY order_index", [parseInt(lessonId)]),
    queryOne("SELECT id, title FROM lessons WHERE course_id = $1 AND order_index < $2 AND is_published = true ORDER BY order_index DESC LIMIT 1", [lesson.course_id, lesson.order_index]),
    queryOne("SELECT id, title FROM lessons WHERE course_id = $1 AND order_index > $2 AND is_published = true ORDER BY order_index ASC LIMIT 1", [lesson.course_id, lesson.order_index]),
    query("SELECT id, title, lesson_type, order_index FROM lessons WHERE course_id = $1 AND is_published = true ORDER BY order_index", [lesson.course_id]),
  ]);

  const lessonTypeIcon: Record<string, React.ReactNode> = {
    lesson: <BookOpen className="h-4 w-4" />,
    article: <FileText className="h-4 w-4" />,
    exercise: <Zap className="h-4 w-4" />,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={session} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Lesson list sidebar */}
          <aside className="w-72 shrink-0 hidden xl:block">
            <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                <Link href={`/learn/courses/${id}`} className="text-xs text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-1">
                  <ChevronLeft className="h-3 w-3" /> Back to course
                </Link>
                <h3 className="text-sm font-bold text-gray-900 mt-1 line-clamp-2">{lesson.course_title}</h3>
              </div>
              <div className="max-h-[70vh] overflow-y-auto scrollbar-thin">
                {(allLessons as { id: number; title: string; lesson_type: string; order_index: number }[]).map((l) => (
                  <Link
                    key={l.id}
                    href={`/learn/courses/${id}/lessons/${l.id}`}
                    className={`flex items-center gap-3 px-4 py-3 text-sm border-b border-gray-50 hover:bg-gray-50 transition-colors ${l.id === parseInt(lessonId) ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-700"}`}
                  >
                    <span className="text-gray-400">{lessonTypeIcon[l.lesson_type] || <BookOpen className="h-4 w-4" />}</span>
                    <span className="truncate">{l.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Link href="/learn" className="hover:text-indigo-600">Courses</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={`/learn/courses/${id}`} className="hover:text-indigo-600">{lesson.course_title}</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-gray-900 font-medium">{lesson.title}</span>
            </div>

            {/* Lesson content */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full capitalize">
                  {lessonTypeIcon[lesson.lesson_type]} {lesson.lesson_type}
                </span>
                <span className="text-xs text-gray-400">{lesson.duration_minutes} minutes</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mb-6">{lesson.title}</h1>

              {lesson.content && (
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  {lesson.content.split("\n").map((para, i) => (
                    <p key={i} className="mb-4">{para}</p>
                  ))}
                </div>
              )}

              {/* Offline download button */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 font-medium transition-colors">
                  <Download className="h-4 w-4" />
                  Save for offline reading
                </button>
              </div>
            </div>

            {/* Exercises */}
            {exercises.length > 0 && (
              <div className="space-y-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Practice Exercises</h2>
                {exercises.map((ex) => (
                  <div key={ex.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <p className="font-semibold text-gray-900">{ex.question}</p>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-bold shrink-0">{ex.points} pts</span>
                    </div>
                    {ex.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {ex.options.map((opt: string) => (
                          <button
                            key={opt}
                            className="text-left px-4 py-3 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-sm font-medium transition-all"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                    {ex.explanation && (
                      <details className="mt-4">
                        <summary className="text-xs text-indigo-600 cursor-pointer font-semibold">Show explanation</summary>
                        <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{ex.explanation}</p>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between gap-4">
              {prev ? (
                <Link href={`/learn/courses/${id}/lessons/${(prev as { id: number }).id}`} className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-all">
                  <ChevronLeft className="h-4 w-4" /> Previous: {(prev as { title: string }).title}
                </Link>
              ) : <div />}
              {next ? (
                <Link href={`/learn/courses/${id}/lessons/${(next as { id: number }).id}`} className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
                  Next: {(next as { title: string }).title} <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href={`/learn/courses/${id}`} className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-all">
                  Complete Course ✓
                </Link>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
