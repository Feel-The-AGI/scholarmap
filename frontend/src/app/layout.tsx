import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScholarMap - Find Your Path to Funded Education",
  description: "Discover scholarships from Bachelor's to PhD. Curated, verified, and beautifully organized.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 min-h-screen">
        <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold tracking-tight">ScholarMap</Link>
            <div className="flex items-center gap-6">
              <Link href="/programs" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Programs</Link>
              <Link href="/qualify" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Check Eligibility</Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-slate-200 dark:border-slate-800 mt-24 py-12">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-500">
            ScholarMap — Clarity for your journey.
          </div>
        </footer>
      </body>
    </html>
  );
}
