import { redirect } from "next/navigation";
import { queryOne, query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import {
  Trophy,
  Star,
  Target,
  BookOpen,
  Award,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { getCEFRColor, cn } from "@/lib/utils";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const [user, userBadges, recentAttempts, enrollments] = await Promise.all([
    queryOne(
      "SELECT id, name, email, role, total_points, created_at, bio FROM users WHERE id = $1",
      [session.id],
    ) as Promise<{
      id: number;
      name: string;
      email: string;
      role: string;
      total_points: number;
      created_at: string;
      bio: string;
    } | null>,
    query(
      `SELECT b.*, ub.earned_at FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = $1 ORDER BY ub.earned_at DESC`,
      [session.id],
    ) as Promise<
      {
        id: number;
        name: string;
        description: string;
        icon: string;
        color: string;
        earned_at: string;
      }[]
    >,
    query(
      `SELECT ta.*, t.title as test_title, l.flag_emoji FROM test_attempts ta JOIN tests t ON ta.test_id = t.id LEFT JOIN languages l ON t.language_id = l.id WHERE ta.user_id = $1 AND ta.status = 'completed' ORDER BY ta.completed_at DESC LIMIT 5`,
      [session.id],
    ) as Promise<
      {
        id: number;
        test_title: string;
        flag_emoji: string;
        percentage: number;
        cefr_result: string;
        completed_at: string;
      }[]
    >,
    query(
      `SELECT e.*, c.title as course_title, l.flag_emoji FROM enrollments e JOIN courses c ON e.course_id = c.id LEFT JOIN languages l ON c.language_id = l.id WHERE e.user_id = $1 ORDER BY e.enrolled_at DESC LIMIT 5`,
      [session.id],
    ) as Promise<
      {
        id: number;
        course_title: string;
        flag_emoji: string;
        progress_percentage: number;
        enrolled_at: string;
      }[]
    >,
  ]);

  if (!user) redirect("/auth/login");

  const roleColors: Record<string, string> = {
    admin:
      "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
    educator:
      "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900",
    standard:
      "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
    free_tier:
      "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  };

  const xpForNextLevel = 2 * 500;
  const xpProgress = Math.min(
    ((100 % xpForNextLevel) / xpForNextLevel) * 100,
    100,
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header user={session} />

      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-xl shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                className="lucide lucide-shield-user-icon lucide-shield-user"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="M6.376 18.91a6 6 0 0 1 11.249.003" />
                <circle cx="12" cy="11" r="4" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black">{user.name}</h1>
              <p className="text-indigo-300 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold border capitalize",
                    roleColors[user.role] || roleColors.free_tier,
                  )}
                >
                  {user.role.replace("_", " ")}
                </span>
                <span className="text-indigo-300 text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined{" "}
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-bold flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" /> Level{" "}
                {xpForNextLevel}
              </span>
              <span className="text-sm text-indigo-300">
                {xpProgress} XP total
              </span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-indigo-300">
              <span>
                {xpProgress % xpForNextLevel} / {xpForNextLevel} XP
              </span>
              <span>Level {xpForNextLevel + 1}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 text-center">
            <Trophy className="h-6 w-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {user.total_points.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total Points
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 text-center">
            <Award className="h-6 w-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {userBadges.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Badges Earned
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4 text-center">
            <Target className="h-6 w-6 text-sky-500 mx-auto mb-2" />
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {recentAttempts.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Tests Taken
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Badges */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-600" /> My Badges
              </h2>
            </div>
            {userBadges.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Take assessments to earn your first badge!
                </p>
                <Link
                  href="/assess"
                  className="mt-3 inline-block text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
                >
                  Browse tests →
                </Link>
              </div>
            ) : (
              <div className="p-4 flex flex-wrap gap-3">
                {userBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
                    title={badge.description}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {badge.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(badge.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Tests */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="h-4 w-4 text-sky-600" /> Recent Assessments
              </h2>
              <Link
                href="/assess/my-results"
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700"
              >
                View all
              </Link>
            </div>
            {recentAttempts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No tests taken yet
                </p>
                <Link
                  href="/assess"
                  className="mt-3 inline-block text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
                >
                  Take your first test →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <span className="text-xl">{attempt.flag_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {attempt.test_title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-bold border",
                          getCEFRColor(attempt.cefr_result),
                        )}
                      >
                        {attempt.cefr_result}
                      </span>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">
                        {Math.round(attempt.percentage)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {enrollments.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden sm:col-span-2">
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-600" /> My Courses
                </h2>
                <Link
                  href="/learn"
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700"
                >
                  Browse more
                </Link>
              </div>
              <div className="p-4 grid sm:grid-cols-2 gap-3">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700"
                  >
                    <span className="text-xl">{enrollment.flag_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {enrollment.course_title}
                      </p>
                      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{
                            width: `${enrollment.progress_percentage || 0}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {enrollment.progress_percentage || 0}% complete
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
