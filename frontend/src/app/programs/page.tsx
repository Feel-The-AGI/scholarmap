import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { Program } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getPrograms(level?: string): Promise<Program[]> {
  const supabase = createClient();
  let query = supabase.from("programs").select("*").eq("status", "active");
  if (level) query = query.eq("level", level);
  const { data } = await query.order("name");
  return data ?? [];
}

export default async function ProgramsPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level } = await searchParams;
  const programs = await getPrograms(level);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Programs</h1>
        <div className="flex gap-2">
          {["all", "bachelor", "masters", "phd", "postdoc"].map((l) => (
            <Link
              key={l}
              href={l === "all" ? "/programs" : `/programs?level=${l}`}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                (l === "all" && !level) || l === level
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {l === "all" ? "All" : l.charAt(0).toUpperCase() + l.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {programs.map((program) => (
          <Link
            key={program.id}
            href={`/programs/${program.id}`}
            className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 transition-all bg-white dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-1">{program.name}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{program.provider}</p>
                {program.description && <p className="text-sm text-slate-500 line-clamp-2">{program.description}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 capitalize">{program.level}</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 capitalize">
                  {program.funding_type.replace("_", " ")}
                </span>
              </div>
            </div>
            {program.fields.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {program.fields.slice(0, 5).map((field) => (
                  <span key={field} className="text-xs px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {field}
                  </span>
                ))}
                {program.fields.length > 5 && <span className="text-xs text-slate-400">+{program.fields.length - 5} more</span>}
              </div>
            )}
          </Link>
        ))}
      </div>

      {programs.length === 0 && (
        <div className="text-center py-16 text-slate-500">No programs found{level ? ` for ${level}` : ""}.</div>
      )}
    </div>
  );
}
