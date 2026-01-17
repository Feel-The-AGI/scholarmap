"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import type { Program } from "@/lib/types";

type FormData = {
  nationality: string;
  degree: string;
  gpa_band: string;
  field: string;
  work_experience_years: number;
};

const levelConfig: Record<string, { icon: string; color: string; bg: string }> = {
  bachelor: { icon: "🎓", color: "text-blue-700", bg: "bg-blue-100" },
  masters: { icon: "📚", color: "text-purple-700", bg: "bg-purple-100" },
  phd: { icon: "🔬", color: "text-rose-700", bg: "bg-rose-100" },
  postdoc: { icon: "🏆", color: "text-teal-700", bg: "bg-teal-100" },
};

export default function QualifyPage() {
  const [form, setForm] = useState<FormData>({
    nationality: "",
    degree: "",
    gpa_band: "",
    field: "",
    work_experience_years: 0,
  });
  const [results, setResults] = useState<{
    eligible: Program[];
    maybe: Program[];
    not_eligible: Program[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: programs } = await supabase
      .from("programs")
      .select("*, eligibility_rules(*)")
      .eq("status", "active");

    if (!programs) {
      setLoading(false);
      return;
    }

    const eligible: Program[] = [];
    const maybe: Program[] = [];
    const not_eligible: Program[] = [];

    for (const p of programs) {
      const rules = (p as Program & { eligibility_rules: { rule_type: string; operator: string; value: unknown; confidence: string }[] }).eligibility_rules ?? [];
      if (rules.length === 0) {
        maybe.push(p);
        continue;
      }

      let matches = 0,
        fails = 0;
      for (const r of rules) {
        const val = r.value as Record<string, unknown>;
        if (r.rule_type === "nationality" && r.operator === "in") {
          const countries = val.countries as string[] | undefined;
          if (countries?.includes(form.nationality)) matches++;
          else fails++;
        } else if (r.rule_type === "gpa" && r.operator === ">=") {
          const gpaMap: Record<string, number> = {
            "below_2.5": 2.0,
            "2.5_3.0": 2.75,
            "3.0_3.5": 3.25,
            "3.5_4.0": 3.75,
            "above_4.0": 4.0,
          };
          if (gpaMap[form.gpa_band] >= ((val.min as number) ?? 0)) matches++;
          else fails++;
        } else if (r.rule_type === "degree" && r.operator === "in") {
          const degrees = val.degrees as string[] | undefined;
          if (degrees?.includes(form.degree)) matches++;
          else fails++;
        } else if (r.rule_type === "work_experience" && r.operator === ">=") {
          if (form.work_experience_years >= ((val.years as number) ?? 0)) matches++;
          else fails++;
        } else {
          matches++;
        }
      }
      if (fails === 0 && matches > 0) eligible.push(p);
      else if (fails > 0 && matches > 0) maybe.push(p);
      else not_eligible.push(p);
    }
    setResults({ eligible, maybe, not_eligible });
    setLoading(false);
  };

  const totalResults = results ? results.eligible.length + results.maybe.length : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative py-12 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-[10%] w-96 h-96 rounded-full bg-linear-to-tr from-accent-200/40 to-primary-200/20 blur-3xl" />
          <div className="absolute bottom-0 right-[20%] w-64 h-64 rounded-full bg-gradient-to-tr from-primary-200/30 to-accent-200/10 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to home
            </Link>

            <div className="flex items-center gap-4 mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-100 text-accent-700 text-sm font-medium">
                <span className="text-xl">🎯</span>
                Eligibility Checker
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">
              Find Scholarships
              <br />
              <span className="text-gradient">Made for You</span>
            </h1>
            <p className="text-lg text-stone-500 max-w-xl">
              Enter your details and we&apos;ll match you with scholarships you actually qualify for.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Form */}
      <div className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="relative p-8 md:p-10 rounded-[2rem] bg-white border border-stone-200/80 shadow-xl shadow-stone-200/30"
          >
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-10">
              {[1, 2].map((s) => (
                <div key={s} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setStep(s)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step >= s
                        ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                        : "bg-stone-100 text-stone-400"
                    }`}
                  >
                    {s}
                  </button>
                  <span className={`ml-3 text-sm font-medium hidden md:block ${step >= s ? "text-stone-900" : "text-stone-400"}`}>
                    {s === 1 ? "Background" : "Academic Profile"}
                  </span>
                  {s === 1 && <div className="w-24 md:w-32 h-0.5 mx-4 bg-stone-100 rounded" />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-stone-900 mb-3">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={form.nationality}
                      onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-stone-200 bg-stone-50 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 outline-none transition-all text-stone-900 placeholder:text-stone-400"
                      placeholder="e.g., Ghana, Nigeria, Kenya"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-900 mb-3">
                      Field of Study / Interest
                    </label>
                    <input
                      type="text"
                      value={form.field}
                      onChange={(e) => setForm({ ...form, field: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-stone-200 bg-stone-50 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 outline-none transition-all text-stone-900 placeholder:text-stone-400"
                      placeholder="e.g., Computer Science, Medicine, Engineering"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-900 mb-3">
                      Work Experience (years)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.work_experience_years}
                      onChange={(e) => setForm({ ...form, work_experience_years: parseInt(e.target.value) || 0 })}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-stone-200 bg-stone-50 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 outline-none transition-all text-stone-900 placeholder:text-stone-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full px-8 py-4 rounded-2xl bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                  >
                    Continue
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-stone-900 mb-3">
                      Current / Highest Degree
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {["BSc", "BA", "MSc", "MA", "PhD"].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setForm({ ...form, degree: d })}
                          className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            form.degree === d
                              ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-900 mb-3">
                      GPA Range
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { value: "below_2.5", label: "< 2.5" },
                        { value: "2.5_3.0", label: "2.5-3.0" },
                        { value: "3.0_3.5", label: "3.0-3.5" },
                        { value: "3.5_4.0", label: "3.5-4.0" },
                        { value: "above_4.0", label: "> 4.0" },
                      ].map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setForm({ ...form, gpa_band: g.value })}
                          className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            form.gpa_band === g.value
                              ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                              : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-4 rounded-2xl border-2 border-stone-200 text-stone-700 font-semibold hover:bg-stone-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Find My Scholarships
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-12 space-y-8"
              >
                {/* Summary */}
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-6xl mb-4"
                  >
                    {totalResults > 0 ? "🎉" : "😔"}
                  </motion.div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-2">
                    {totalResults > 0
                      ? `We found ${totalResults} potential match${totalResults !== 1 ? "es" : ""}!`
                      : "No matches found"}
                  </h2>
                  <p className="text-stone-500">
                    {totalResults > 0
                      ? "Here are scholarships that match your profile"
                      : "Try adjusting your criteria or browse all programs"}
                  </p>
                </div>

                {/* Eligible */}
                {results.eligible.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                        <span className="text-xl">✅</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-stone-900">Likely Eligible</h3>
                        <p className="text-sm text-stone-500">{results.eligible.length} scholarships match your criteria</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {results.eligible.map((p) => {
                        const config = levelConfig[p.level] || { icon: "📄", color: "text-stone-700", bg: "bg-stone-100" };
                        return (
                          <Link
                            key={p.id}
                            href={`/programs/${p.id}`}
                            className="group p-5 rounded-2xl bg-accent-50 border-2 border-accent-200 hover:border-accent-300 transition-all hover:-translate-y-0.5"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{config.icon}</span>
                              <div>
                                <h4 className="font-semibold text-stone-900 group-hover:text-accent-700 transition-colors">
                                  {p.name}
                                </h4>
                                <p className="text-sm text-stone-500">{p.provider}</p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Maybe */}
                {results.maybe.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <span className="text-xl">🤔</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-stone-900">Worth Checking</h3>
                        <p className="text-sm text-stone-500">{results.maybe.length} scholarships may have additional requirements</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {results.maybe.slice(0, 6).map((p) => {
                        const config = levelConfig[p.level] || { icon: "📄", color: "text-stone-700", bg: "bg-stone-100" };
                        return (
                          <Link
                            key={p.id}
                            href={`/programs/${p.id}`}
                            className="group p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 hover:border-amber-300 transition-all hover:-translate-y-0.5"
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{config.icon}</span>
                              <div>
                                <h4 className="font-semibold text-stone-900 group-hover:text-amber-700 transition-colors">
                                  {p.name}
                                </h4>
                                <p className="text-sm text-stone-500">{p.provider}</p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    {results.maybe.length > 6 && (
                      <p className="text-center text-sm text-stone-500 mt-4">
                        +{results.maybe.length - 6} more programs
                      </p>
                    )}
                  </section>
                )}

                {/* Not Eligible */}
                {results.not_eligible.length > 0 && (
                  <section className="opacity-60">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                        <span className="text-xl">❌</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-stone-900">Not Eligible</h3>
                        <p className="text-sm text-stone-500">{results.not_eligible.length} scholarships don&apos;t match your criteria</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      {results.not_eligible.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="p-4 rounded-xl bg-stone-50 border border-stone-200"
                        >
                          <h4 className="font-medium text-stone-700 text-sm line-clamp-1">{p.name}</h4>
                          <p className="text-xs text-stone-400">{p.provider}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Browse All CTA */}
                <div className="text-center pt-8">
                  <Link
                    href="/programs"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Browse all programs
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
