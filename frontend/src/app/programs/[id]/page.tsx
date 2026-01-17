import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Program, EligibilityRule, Requirement, Deadline } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getProgram(id: string): Promise<{ program: Program | null; rules: EligibilityRule[]; requirements: Requirement[]; deadlines: Deadline[] }> {
  const supabase = createClient();
  const [{ data: program }, { data: rules }, { data: requirements }, { data: deadlines }] = await Promise.all([
    supabase.from("programs").select("*").eq("id", id).single(),
    supabase.from("eligibility_rules").select("*").eq("program_id", id),
    supabase.from("requirements").select("*").eq("program_id", id),
    supabase.from("deadlines").select("*").eq("program_id", id).order("deadline_date"),
  ]);
  return { program: program as Program | null, rules: (rules ?? []) as EligibilityRule[], requirements: (requirements ?? []) as Requirement[], deadlines: (deadlines ?? []) as Deadline[] };
}

export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { program, rules, requirements, deadlines } = await getProgram(id);
  if (!program) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      <Link href="/programs" className="text-sm text-brand-600 hover:text-brand-700 mb-6 inline-block">← Back to programs</Link>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 capitalize">{program.level}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 capitalize">
            {program.funding_type.replace("_", " ")}
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-2">{program.name}</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">{program.provider}</p>
      </header>

      {program.description && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-3">About</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{program.description}</p>
        </section>
      )}

      {program.who_wins && (
        <section className="mb-10 p-5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <h2 className="text-lg font-semibold mb-2 text-emerald-800 dark:text-emerald-300">Who Usually Wins</h2>
          <p className="text-emerald-700 dark:text-emerald-400">{program.who_wins}</p>
        </section>
      )}

      {program.rejection_reasons && (
        <section className="mb-10 p-5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <h2 className="text-lg font-semibold mb-2 text-amber-800 dark:text-amber-300">Common Rejection Reasons</h2>
          <p className="text-amber-700 dark:text-amber-400">{program.rejection_reasons}</p>
        </section>
      )}

      {deadlines.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Timeline</h2>
          <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-4">
            {deadlines.map((d) => (
              <div key={d.id} className="relative">
                <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-brand-500" />
                <div className="text-sm font-medium capitalize">{d.stage}</div>
                <div className="text-sm text-slate-500">{new Date(d.deadline_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
                <div className="text-xs text-slate-400">{d.cycle}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {rules.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Eligibility</h2>
          <div className="space-y-3">
            {rules.map((r) => (
              <div key={r.id} className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 capitalize">{r.rule_type}</span>
                <div className="flex-1">
                  <div className="text-sm">{r.operator} {JSON.stringify(r.value)}</div>
                  {r.source_snippet && <div className="text-xs text-slate-500 mt-1 italic">&quot;{r.source_snippet}&quot;</div>}
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded ${r.confidence === "high" ? "bg-green-100 text-green-700" : r.confidence === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-500"}`}>
                  {r.confidence}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {requirements.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Requirements</h2>
          <div className="space-y-2">
            {requirements.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className={`w-2 h-2 rounded-full ${r.mandatory ? "bg-red-500" : "bg-slate-300"}`} />
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 capitalize">{r.type}</span>
                <span className="text-sm flex-1">{r.description}</span>
                {!r.mandatory && <span className="text-xs text-slate-400">Optional</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <a
          href={program.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors"
        >
          Visit Official Site
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
        {program.last_verified_at && (
          <p className="text-xs text-slate-400 mt-4">
            Last verified: {new Date(program.last_verified_at).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
