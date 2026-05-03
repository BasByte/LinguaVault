import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Trophy, Medal, Star, Target } from "lucide-react";

interface LeaderEntry {
  rank: number;
  user_id: number;
  name: string;
  total_points: number;
  test_count: string;
  avg_score: number;
  badges_count: string;
}

export default async function LeaderboardPage() {
  const [session, leaders] = await Promise.all([
    getSession(),
    query<LeaderEntry>(
      `SELECT 
         ROW_NUMBER() OVER (ORDER BY u.total_points DESC) as rank,
         u.id as user_id, u.name, u.total_points,
         COUNT(DISTINCT ta.id) as test_count,
         COALESCE(AVG(ta.percentage), 0) as avg_score,
         COUNT(DISTINCT ub.badge_id) as badges_count
       FROM users u
       LEFT JOIN test_attempts ta ON ta.user_id = u.id AND ta.status = 'completed'
       LEFT JOIN user_badges ub ON ub.user_id = u.id
       WHERE u.is_active = true
       GROUP BY u.id, u.name, u.total_points
       ORDER BY u.total_points DESC
       LIMIT 50`
    ),
  ]);

  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header user={session} />

      <div className="bg-gradient-to-br from-amber-600 to-amber-800 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="h-12 w-12 text-amber-300" />
          </div>
          <h1 className="text-4xl font-black mb-2">Global Leaderboard</h1>
          <p className="text-amber-200">Top language learners ranked by XP points earned from assessments</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Top 3 podium */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[1, 0, 2].map((podiumIdx) => {
            const entry = leaders[podiumIdx];
            if (!entry) return <div key={podiumIdx} />;
            const isFirst = podiumIdx === 0;
            return (
              <div key={entry.user_id}
                className={`text-center p-5 rounded-2xl border ${isFirst ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 shadow-lg scale-105" : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 shadow-sm"}`}
              >
                <div className="text-4xl mb-2">{rankEmoji(entry.rank as unknown as number)}</div>
                <div className={`w-12 h-12 ${isFirst ? "bg-amber-500" : "bg-indigo-500"} rounded-2xl flex items-center justify-center text-white font-black text-lg mx-auto mb-2`}>
                  {entry.name.charAt(0)}
                </div>
                <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">{entry.name}</p>
                <p className={`text-2xl font-black ${isFirst ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400"}`}>{entry.total_points.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">XP points</p>
              </div>
            );
          })}
        </div>

        {/* Full leaderboard */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Medal className="h-5 w-5 text-indigo-600" />
            <h2 className="font-bold text-gray-900 dark:text-white">Top 50 Learners</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {leaders.map((entry) => (
              <div key={entry.user_id}
                className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${session?.id === entry.user_id ? "bg-indigo-50 dark:bg-indigo-950/30 border-l-4 border-indigo-600" : ""}`}
              >
                <div className="w-8 text-center">
                  {Number(entry.rank) <= 3 ? (
                    <span className="text-lg">{rankEmoji(Number(entry.rank))}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500">#{entry.rank}</span>
                  )}
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0">
                  {entry.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {entry.name}
                    {session?.id === entry.user_id && <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold">(You)</span>}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    <span>{entry.test_count} tests</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><Target className="h-3 w-3" /> {Math.round(entry.avg_score)}% avg</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><Star className="h-3 w-3" /> {entry.badges_count} badges</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-indigo-700 dark:text-indigo-400 text-sm">{entry.total_points.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
