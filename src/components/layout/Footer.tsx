import Link from "next/link";
import { Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-sky-400 rounded-xl flex items-center justify-center shadow-sm">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Lingua<span className="text-indigo-400">Vault</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              The world&apos;s most comprehensive language learning and CEFR assessment platform.
            </p>
            <div className="flex gap-3">
              {["🐦", "📘", "📸", "💼"].map((emoji, i) => (
                <div key={i} className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center text-sm cursor-pointer hover:bg-gray-700 transition-colors">
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          {/* Learn */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Learn</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/learn", label: "All Courses" },
                { href: "/learn?sort=popular", label: "Popular Courses" },
                { href: "/learn?lang=en", label: "English" },
                { href: "/learn?lang=es", label: "Spanish" },
                { href: "/learn?lang=fr", label: "French" },
                { href: "/learn?lang=de", label: "German" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:translate-x-1 transition-all inline-block text-gray-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Assess */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Assess</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/assess", label: "All Tests" },
                { href: "/assess?level=A1", label: "A1 Tests" },
                { href: "/assess?level=B1", label: "B1 Tests" },
                { href: "/assess?level=C1", label: "C1 Tests" },
                { href: "/assess/leaderboard", label: "Leaderboard" },
                { href: "/assess/my-results", label: "My Results" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:translate-x-1 transition-all inline-block text-gray-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Platform</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/auth/login", label: "Sign In" },
                { href: "/auth/register", label: "Create Account" },
                { href: "/educator", label: "For Educators" },
                { href: "/admin", label: "Admin Dashboard" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white hover:translate-x-1 transition-all inline-block text-gray-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* CEFR Badge */}
            <div className="mt-6 p-4 bg-gray-800 rounded-xl border border-gray-700">
              <p className="text-xs text-gray-400 mb-2 font-semibold">CEFR Aligned</p>
              <div className="flex gap-1 flex-wrap">
                {["A1","A2","B1","B2","C1","C2"].map(level => (
                  <span key={level} className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded-md font-mono font-bold">{level}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} LinguaVault. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="hover:text-gray-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-300 cursor-pointer">Cookie Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
