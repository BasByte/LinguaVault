import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import "../../node_modules/flag-icons/css/flag-icons.min.css";


export const metadata: Metadata = {
  title: "LinguaVault— Learn Languages & Get CEFR Certified",
  description: "The world's most comprehensive language learning and assessment platform. Master new languages with expert-led courses and earn CEFR certifications.",
  keywords: "language learning, CEFR, language assessment, online courses, English, Spanish, French, German",
  openGraph: {
    title: "LinguaVault",
    description: "Learn languages and get CEFR certified",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
