import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { Program } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getPrograms(): Promise<Program[]> {
  const supabase = createClient();
  const { data } = await supabase.from("programs").select("*").eq("status", "active").order("name");
  return data ?? [];
}

export default async function Home() {
  const programs = await getPrograms();
  const levels = ["bachelor", "masters", "phd", "postdoc"] as const;
  const grouped = levels.reduce(
    (acc, level) => ({ ...acc, [level]: programs.filter((p) => p.level === level) }),
    {} as Record<string, Program[]>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 animate-fade-in">
      <section className="text-center mb-20">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Find Your Path to Funded Education</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Curated scholarships from Bachelor&apos;s to PhD. Verified. Organized. Clear.
        </p>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {levels.map((level) => (
          <Link
            key={level}
            href={`/programs?level=${level}`}
            className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-lg transition-all bg-white dark:bg-slate-900"
          >
            <div className="text-3xl font-bold text-brand-600 mb-1">{grouped[level]?.length ?? 0}</div>
            <div className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">{level}</div>
            <div className="text-xs text-slate-500 mt-1">programs</div>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-8">Featured Programs</h2>
        <div className="grid gap-4">
          {programs.slice(0, 6).map((program) => (
            <Link
              key={program.id}
              href={`/programs/${program.id}`}
              className="flex items-center justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 transition-all bg-white dark:bg-slate-900"
            >
              <div>
                <h3 className="font-medium mb-1">{program.name}</h3>
                <p className="text-sm text-slate-500">{program.provider}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 capitalize">{program.level}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 capitalize">
                  {program.funding_type.replace("_", " ")}
                </span>
              </div>
            </Link>
          ))}
        </div>
        {programs.length > 6 && (
          <div className="text-center mt-8">
            <Link href="/programs" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all {programs.length} programs →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
