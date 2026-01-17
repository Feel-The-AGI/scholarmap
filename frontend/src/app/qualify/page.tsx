"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { Program } from "@/lib/types";

type FormData = { nationality: string; degree: string; gpa_band: string; field: string; work_experience_years: number };

export default function QualifyPage() {
  const [form, setForm] = useState<FormData>({ nationality: "", degree: "", gpa_band: "", field: "", work_experience_years: 0 });
  const [results, setResults] = useState<{ eligible: Program[]; maybe: Program[]; not_eligible: Program[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: programs } = await supabase.from("programs").select("*, eligibility_rules(*)").eq("status", "active");
    if (!programs) { setLoading(false); return; }

    const eligible: Program[] = [];
    const maybe: Program[] = [];
    const not_eligible: Program[] = [];

    for (const p of programs) {
      const rules = (p as Program & { eligibility_rules: { rule_type: string; operator: string; value: unknown; confidence: string }[] }).eligibility_rules ?? [];
      if (rules.length === 0) { maybe.push(p); continue; }

      let matches = 0, fails = 0;
      for (const r of rules) {
        const val = r.value as Record<string, unknown>;
        if (r.rule_type === "nationality" && r.operator === "in") {
          const countries = val.countries as string[] | undefined;
          if (countries?.includes(form.nationality)) matches++; else fails++;
        } else if (r.rule_type === "gpa" && r.operator === ">=") {
          const gpaMap: Record<string, number> = { "below_2.5": 2.0, "2.5_3.0": 2.75, "3.0_3.5": 3.25, "3.5_4.0": 3.75, "above_4.0": 4.0 };
          if (gpaMap[form.gpa_band] >= (val.min as number ?? 0)) matches++; else fails++;
        } else if (r.rule_type === "degree" && r.operator === "in") {
          const degrees = val.degrees as string[] | undefined;
          if (degrees?.includes(form.degree)) matches++; else fails++;
        } else if (r.rule_type === "work_experience" && r.operator === ">=") {
          if (form.work_experience_years >= (val.years as number ?? 0)) matches++; else fails++;
        } else { matches++; }
      }
      if (fails === 0 && matches > 0) eligible.push(p);
      else if (fails > 0 && matches > 0) maybe.push(p);
      else not_eligible.push(p);
    }
    setResults({ eligible, maybe, not_eligible });
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">Check Your Eligibility</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">Enter your details to see which programs match your profile.</p>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6 mb-12">
        <div>
          <label className="block text-sm font-medium mb-2">Nationality</label>
          <input type="text" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" placeholder="e.g., Ghana" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Current/Highest Degree</label>
          <select value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
            <option value="">Select degree</option>
            <option value="BSc">BSc</option><option value="BA">BA</option><option value="MSc">MSc</option><option value="MA">MA</option><option value="PhD">PhD</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">GPA Band</label>
          <select value={form.gpa_band} onChange={(e) => setForm({ ...form, gpa_band: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none">
            <option value="">Select GPA range</option>
            <option value="below_2.5">Below 2.5</option><option value="2.5_3.0">2.5 - 3.0</option><option value="3.0_3.5">3.0 - 3.5</option><option value="3.5_4.0">3.5 - 4.0</option><option value="above_4.0">Above 4.0</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Field of Study</label>
          <input type="text" value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" placeholder="e.g., Computer Science" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Work Experience (years)</label>
          <input type="number" min={0} value={form.work_experience_years} onChange={(e) => setForm({ ...form, work_experience_years: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none" />
        </div>
        <div className="md:col-span-2">
          <button type="submit" disabled={loading}
            className="px-8 py-3 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
            {loading ? "Checking..." : "Check Eligibility"}
          </button>
        </div>
      </form>

      {results && (
        <div className="space-y-8">
          {results.eligible.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-emerald-600">Eligible ({results.eligible.length})</h2>
              <div className="space-y-3">
                {results.eligible.map((p) => (
                  <Link key={p.id} href={`/programs/${p.id}`} className="block p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:border-emerald-400 transition-colors">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-emerald-700 dark:text-emerald-400">{p.provider}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.maybe.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-amber-600">Maybe ({results.maybe.length})</h2>
              <div className="space-y-3">
                {results.maybe.map((p) => (
                  <Link key={p.id} href={`/programs/${p.id}`} className="block p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 hover:border-amber-400 transition-colors">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-amber-700 dark:text-amber-400">{p.provider}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.not_eligible.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 text-slate-500">Not Eligible ({results.not_eligible.length})</h2>
              <div className="space-y-3 opacity-60">
                {results.not_eligible.slice(0, 5).map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-slate-500">{p.provider}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
