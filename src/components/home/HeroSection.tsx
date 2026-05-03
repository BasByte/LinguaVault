"use client";
import Link from "next/link";
import { BookOpen, FlaskConical, Globe, ChevronRight, Star } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-sky-900 py-24 sm:py-32">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Language flags floating */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {["🇬🇧", "🇪🇸", "🇫🇷", "🇩🇪", "🇯🇵", "🇨🇳", "🇧🇷", "🇮🇹"].map((flag, i) => (
          <div
            key={i}
            className="absolute text-4xl opacity-20 animate-float"
            style={{
              left: `${10 + i * 11}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + (i % 2)}s`,
            }}
          >
            {flag}
          </div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 mb-8">
            <div className="flex -space-x-1">
              {["🌍", "🎓", "⭐"].map((e, i) => <span key={i} className="text-sm">{e}</span>)}
            </div>
            <span className="text-white/90 text-sm font-medium">Trusted by 50,000+ learners worldwide</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
            Learn Any Language.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-emerald-300">
              Prove Your Level.
            </span>
          </h1>

          <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Expert-led courses, interactive exercises, and CEFR-certified assessments — everything you need to master a new language and showcase your skills.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/learn"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-lg hover:shadow-xl"
            >
              <BookOpen className="h-5 w-5" />
              Start Learning Free
              <ChevronRight className="h-5 w-5" />
            </Link>
            <Link
              href="/assess"
              className="inline-flex items-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-white border border-white/20 font-bold px-8 py-4 rounded-2xl text-lg transition-all backdrop-blur"
            >
              <FlaskConical className="h-5 w-5" />
              Take an Assessment
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { value: "5+", label: "Languages", icon: "🌍" },
              { value: "50K+", label: "Learners", icon: "👨‍🎓" },
              { value: "200+", label: "Courses", icon: "📚" },
              { value: "A1–C2", label: "CEFR Levels", icon: "🏆" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-sm text-indigo-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
