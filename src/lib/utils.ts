import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export function getCEFRColor(level: string): string {
  const colors: Record<string, string> = {
    A1: "bg-green-100 text-green-700 border-green-200",
    A2: "bg-emerald-100 text-emerald-700 border-emerald-200",
    B1: "bg-blue-100 text-blue-700 border-blue-200",
    B2: "bg-indigo-100 text-indigo-700 border-indigo-200",
    C1: "bg-purple-100 text-purple-700 border-purple-200",
    C2: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return colors[level] || "bg-gray-100 text-gray-700 border-gray-200";
}

export function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    beginner: "bg-green-100 text-green-700",
    elementary: "bg-teal-100 text-teal-700",
    intermediate: "bg-blue-100 text-blue-700",
    upper_intermediate: "bg-indigo-100 text-indigo-700",
    advanced: "bg-purple-100 text-purple-700",
    proficiency: "bg-rose-100 text-rose-700",
  };
  return colors[level] || "bg-gray-100 text-gray-700";
}

export function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    beginner: "Beginner",
    elementary: "Elementary",
    intermediate: "Intermediate",
    upper_intermediate: "Upper-Intermediate",
    advanced: "Advanced",
    proficiency: "Proficiency",
  };
  return labels[level] || level;
}

export function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function calculateCEFRFromScore(score: number, maxScore: number, targetLevel: string): string {
  const pct = (score / maxScore) * 100;
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const idx = levels.indexOf(targetLevel);
  
  if (pct >= 90) return levels[Math.min(idx + 1, 5)];
  if (pct >= 70) return targetLevel;
  if (pct >= 50) return levels[Math.max(idx - 1, 0)];
  return levels[Math.max(idx - 2, 0)];
}
