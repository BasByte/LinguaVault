import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import CourseCard from "@/components/home/CourseCard";
import TestCard from "@/components/home/TestCard";
import { Course, Test } from "@/types";
import Link from "next/link";
import { BookOpen, FlaskConical, ChevronRight, Globe, Trophy, Users, Zap } from "lucide-react";


async function getHomeData() {
  const [courses, tests] = await Promise.all([
    query<Course>(
      `SELECT c.*, l.name as language_name, l.code as language_code, l.flag_emoji,
              u.name as educator_name,
              (SELECT COUNT(*) FROM lessons ls WHERE ls.course_id = c.id AND ls.is_published = true) as lesson_count
       FROM courses c
       LEFT JOIN languages l ON c.language_id = l.id
       LEFT JOIN users u ON c.educator_id = u.id
       WHERE c.is_published = true AND c.is_public = true
       ORDER BY c.enrollment_count DESC
       LIMIT 8`
    ),
    query<Test>(
      `SELECT t.*, l.name as language_name, l.flag_emoji, u.name as educator_name,
              (SELECT COUNT(*) FROM test_questions q WHERE q.test_id = t.id) as question_count
       FROM tests t
       LEFT JOIN languages l ON t.language_id = l.id
       LEFT JOIN users u ON t.educator_id = u.id
       WHERE t.is_published = true AND t.is_public = true
       ORDER BY t.attempt_count DESC
       LIMIT 6`
    ),
  ]);
  return { courses, tests };
}

export default async function HomePage() {
  const [session, { courses, tests }] = await Promise.all([
    getSession(),
    getHomeData(),
  ]);

  const lg = "fi fi-";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header user={session} />

      {/* Hero */}
      <HeroSection />

      {/* Features section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Two powerful platforms working together — learn at your own pace, then prove your level with official CEFR assessments.
            </p>
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/learn" className="group block">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Language Learning Platform</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  Explore thousands of expert-led courses, interactive lessons, and exercises across 10+ languages. Free for everyone — no registration required.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Beginner to Advanced", "Offline Access", "Interactive Exercises", "10+ Languages"].map(tag => (
                    <span key={tag} className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold group-hover:gap-3 transition-all">
                  Start Learning Free <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </Link>

            <Link href="/assess" className="group block">
              <div className="bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-950/60 dark:to-emerald-950/60 rounded-3xl p-8 border border-sky-100 dark:border-sky-900 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-xl transition-all duration-300 h-full">
                <div className="w-14 h-14 bg-sky-600 rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                  <FlaskConical className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Assessment & Evaluation</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  Take official CEFR-aligned language tests (A1–C2) with instant results, gamification, and progress tracking. Created by certified educators.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["CEFR A1–C2", "Instant Results", "Leaderboards", "Badges & XP"].map(tag => (
                    <span key={tag} className="bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 text-xs font-semibold px-3 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold group-hover:gap-3 transition-all">
                  Take an Assessment <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Courses */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Popular Courses</h2>
              <p className="text-gray-500 dark:text-gray-400">Expert-led language courses for all levels</p>
            </div>
            <Link href="/learn" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.slice(0, 8).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Assessments */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Latest Assessments</h2>
              <p className="text-gray-500 dark:text-gray-400">CEFR-aligned tests created by certified educators</p>
            </div>
            <Link href="/assess" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.slice(0, 6).map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        </div>
      </section>

      {/* Why LinguaVault — already dark gradient, no changes needed */}
      <section className="py-20 bg-gradient-to-br from-indigo-950 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Why LinguaVault?</h2>
            <p className="text-indigo-300 text-lg max-w-2xl mx-auto">
              We&apos;re not just another language app. We&apos;re a complete ecosystem for language mastery.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Globe className="h-7 w-7" />, title: "10+ Languages", desc: "From English to Arabic, we cover the world's most important languages", color: "from-indigo-500/30 to-purple-500/30" },
              { icon: <Trophy className="h-7 w-7" />, title: "CEFR Certified", desc: "Our assessments follow the official European standard for language proficiency", color: "from-amber-500/30 to-orange-500/30" },
              { icon: <Users className="h-7 w-7" />, title: "Expert Educators", desc: "All courses and tests are created by certified language teachers", color: "from-sky-500/30 to-cyan-500/30" },
              { icon: <Zap className="h-7 w-7" />, title: "Instant Results", desc: "Get your test scores and CEFR level immediately after completing an assessment", color: "from-emerald-500/30 to-green-500/30" },
            ].map((item) => (
              <div key={item.title} className={`bg-gradient-to-br ${item.color} backdrop-blur rounded-2xl p-6 border border-white/10`}>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">{item.icon}</div>
                <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                <p className="text-indigo-300 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">
            Ready to Start Your Language Journey?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
            Join 50,000+ learners who are mastering new languages on LinguaVault today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-lg hover:shadow-xl">
              Create Free Account
            </Link>
            <Link href="/learn" className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold px-8 py-4 rounded-2xl text-lg transition-all">
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
