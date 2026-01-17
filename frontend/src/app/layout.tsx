import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScholarMap — Your Path to Funded Education",
  description: "Discover life-changing scholarships from Bachelor's to PhD. Curated by AI, verified by humans, designed for dreamers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen flex flex-col">
        {/* Floating decorative elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-[40%] -right-[20%] w-[800px] h-[800px] rounded-full bg-linear-to-tr from-primary-100/40 to-accent-100/20 blur-3xl" />
          <div className="absolute -bottom-[30%] -left-[15%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-accent-100/30 to-primary-100/10 blur-3xl" />
        </div>

        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50">
          <div className="mx-4 mt-4">
            <div className="max-w-7xl mx-auto glass rounded-2xl border border-stone-200/50 shadow-lg shadow-stone-200/20">
              <div className="px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">
                    Scholar<span className="text-primary-500">Map</span>
                  </span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center gap-1">
                  <Link 
                    href="/programs" 
                    className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    Browse Programs
                  </Link>
                  <Link 
                    href="/qualify" 
                    className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    Check Eligibility
                  </Link>
                </div>

                {/* CTA Button */}
                <Link 
                  href="/qualify"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 transition-all active:scale-[0.98]"
                >
                  Find My Match
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 pt-28">
          {children}
        </main>

        {/* Footer */}
        <footer className="relative mt-32 overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-100 to-transparent pointer-events-none" />
          
          <div className="relative border-t border-stone-200/80">
            <div className="max-w-7xl mx-auto px-6 py-16">
              <div className="grid md:grid-cols-4 gap-12">
                {/* Brand */}
                <div className="md:col-span-2">
                  <Link href="/" className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">ScholarMap</span>
                  </Link>
                  <p className="text-stone-300 text-sm max-w-sm leading-relaxed">
                    Mapping dreams to funded education. AI-curated scholarships for ambitious students worldwide.
                  </p>
                </div>

                {/* Links */}
                <div>
                  <h4 className="font-semibold text-white mb-4 text-sm">Explore</h4>
                  <ul className="space-y-3">
                    <li><Link href="/programs" className="text-sm text-stone-300 hover:text-primary-500 transition-colors">All Programs</Link></li>
                    <li><Link href="/programs?level=bachelor" className="text-sm text-stone-300 hover:text-primary-500 transition-colors">Bachelor&apos;s</Link></li>
                    <li><Link href="/programs?level=masters" className="text-sm text-stone-300 hover:text-primary-500 transition-colors">Master&apos;s</Link></li>
                    <li><Link href="/programs?level=phd" className="text-sm text-stone-300 hover:text-primary-500 transition-colors">PhD</Link></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-4 text-sm">Tools</h4>
                  <ul className="space-y-3">
                    <li><Link href="/qualify" className="text-sm text-stone-300 hover:text-primary-500 transition-colors">Eligibility Checker</Link></li>
                    <li><Link href="/admin" className="text-sm text-stone-300 hover:text-primary-500 transition-colors">Admin Portal</Link></li>
                  </ul>
                </div>
              </div>

              {/* Bottom */}
              <div className="mt-16 pt-8 border-t border-stone-700 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-stone-400">
                  &copy; {new Date().getFullYear()} ScholarMap. Clarity for your journey.
                </p>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-stone-400 font-mono">v1.0</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                    <span className="text-xs text-stone-400">All systems operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
