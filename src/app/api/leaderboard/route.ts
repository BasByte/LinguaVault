import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const leaderboard = await prisma.$queryRaw<
      {
        rank: bigint;
        user_id: number;
        name: string;
        avatar_url: string | null;
        total_points: number;
        test_count: bigint;
        avg_score: number;
        badges_count: bigint;
      }[]
    >`
      SELECT
        ROW_NUMBER() OVER (ORDER BY u.total_points DESC) as rank,
        u.id as user_id,
        u.name,
        u.avatar_url,
        u.total_points,
        COUNT(DISTINCT ta.id) as test_count,
        COALESCE(AVG(ta.percentage), 0) as avg_score,
        COUNT(DISTINCT ub.badge_id) as badges_count
      FROM users u
      LEFT JOIN test_attempts ta ON ta.user_id = u.id AND ta.status = 'completed'
      LEFT JOIN user_badges ub ON ub.user_id = u.id
      WHERE u.role IN ('free_tier', 'standard', 'educator') AND u.is_active = true
      GROUP BY u.id, u.name, u.avatar_url, u.total_points
      ORDER BY u.total_points DESC
      LIMIT 50
    `;

    const serialized = leaderboard.map((r) => ({
      rank: Number(r.rank),
      user_id: r.user_id,
      name: r.name,
      avatar_url: r.avatar_url,
      total_points: r.total_points,
      test_count: Number(r.test_count),
      avg_score: Number(r.avg_score),
      badges_count: Number(r.badges_count),
    }));

    return NextResponse.json(serialized);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
