import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LearnSidebar from "@/components/layout/LearnSidebar";
import CourseCard from "@/components/home/CourseCard";
import { Course, Language } from "@/types";
import { Search } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ lang?: string; level?: string; sort?: string; q?: string }>;
}

async function getLearnData(filters: { lang?: string; level?: string; sort?: string; q?: string }) {
  let whereConditions = ["c.is_published = true", "c.is_public = true"];
  const params: unknown[] = [];

  if (filters.lang) { params.push(filters.lang); whereConditions.push(`l.code = $${params.length}`); }
  if (filters.level) { params.push(filters.level); whereConditions.push(`c.level = $${params.length}`); }
  if (filters.q) { params.push(`%${filters.q}%`); whereConditions.push(`(c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`); }

  const where = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
  const orderBy = filters.sort === "newest" ? "c.created_at DESC" : filters.sort === "rating" ? "c.rating DESC" : "c.enrollment_count DESC";

  const [courses, languages] = await Promise.all([
    query<Course>(
      `SELECT c.*, l.name as language_name, l.code as language_code, l.flag_emoji, u.name as educator_name,
              (SELECT COUNT(*) FROM lessons ls WHERE ls.course_id = c.id AND ls.is_published = true) as lesson_count
       FROM courses c
       LEFT JOIN languages l ON c.language_id = l.id
       LEFT JOIN users u ON c.educator_id = u.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT 48`,
      params
    ),
    query<Language>("SELECT * FROM languages WHERE is_active = true ORDER BY name"),
  ]);

  return { courses, languages };
}

export default async function LearnPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const [session, { courses, languages }] = await Promise.all([
    getSession(),
    getLearnData(filters),
  ]);

  const selectedLang = languages.find(l => l.code === filters.lang);
  const title = filters.q
    ? `Results for "${filters.q}"`
    : selectedLang
    ? `${selectedLang.flag_emoji} ${selectedLang.name} Courses`
    : filters.level
    ? `${filters.level.replace("_", " ")} Courses`
    : "All Courses";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header user={session} />

      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-white mb-2">Language Learning Platform</h1>
          <p className="text-indigo-300">Free for everyone — no registration required</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <LearnSidebar languages={languages} />

          <main className="flex-1 min-w-0">
            {/* Search bar */}
            <form method="GET" action="/learn" className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Search courses, languages, educators..."
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>
            </form>

            {/* Sort tabs */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{courses.length} courses found</p>
              </div>
              <div className="flex gap-1">
                {[
                  { value: "popular", label: "Popular" },
                  { value: "newest", label: "Newest" },
                  { value: "rating", label: "Top Rated" },
                ].map((opt) => (
                  <a
                    key={opt.value}
                    href={`/learn?sort=${opt.value}${filters.lang ? `&lang=${filters.lang}` : ""}${filters.level ? `&level=${filters.level}` : ""}`}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      (filters.sort || "popular") === opt.value
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {opt.label}
                  </a>
                ))}
              </div>
            </div>

            {courses.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">No courses found</h3>
                <p className="text-sm">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
