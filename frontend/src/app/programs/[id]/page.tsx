"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Program, EligibilityRule, Requirement, Deadline } from "@/lib/types";

const levelConfig: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  bachelor: { icon: "🎓", label: "Bachelor's", color: "text-blue-700", bg: "bg-blue-100" },
  masters: { icon: "📚", label: "Master's", color: "text-purple-700", bg: "bg-purple-100" },
  phd: { icon: "🔬", label: "PhD", color: "text-rose-700", bg: "bg-rose-100" },
  postdoc: { icon: "🏆", label: "Postdoc", color: "text-teal-700", bg: "bg-teal-100" },
};

export default function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{
    program: Program | null;
    rules: EligibilityRule[];
    requirements: Requirement[];
    deadlines: Deadline[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const [{ data: program }, { data: rules }, { data: requirements }, { data: deadlines }] = await Promise.all([
        supabase.from("programs").select("*").eq("id", id).single(),
        supabase.from("eligibility_rules").select("*").eq("program_id", id),
        supabase.from("requirements").select("*").eq("program_id", id),
        supabase.from("deadlines").select("*").eq("program_id", id).order("deadline_date"),
      ]);
      setData({
        program: program as Program | null,
        rules: (rules ?? []) as EligibilityRule[],
        requirements: (requirements ?? []) as Requirement[],
        deadlines: (deadlines ?? []) as Deadline[],
      });
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-stone-500">Loading program details...</p>
        </div>
      </div>
    );
  }

  if (!data?.program) {
    notFound();
  }

  const { program, rules, requirements, deadlines } = data;
  const config = levelConfig[program.level] || { icon: "📄", label: program.level, color: "text-stone-700", bg: "bg-stone-100" };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative py-16 px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-[10%] w-96 h-96 rounded-full bg-linear-to-tr from-primary-200/30 to-accent-200/20 blur-3xl" />
          <div className="absolute bottom-0 right-[20%] w-64 h-64 rounded-full bg-gradient-to-tr from-accent-200/30 to-primary-200/10 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Breadcrumb */}
            <Link 
              href="/programs" 
              className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 mb-8 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              All programs
            </Link>

            {/* Tags */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${config.bg} ${config.color}`}>
                <span>{config.icon}</span>
                {config.label}
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-accent-100 text-accent-700 capitalize">
                {program.funding_type.replace("_", " ")}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4 leading-tight">
              {program.name}
            </h1>

            {/* Provider */}
            <p className="text-xl text-stone-600 mb-8">{program.provider}</p>

            {/* CTA */}
            <div className="flex flex-wrap gap-4">
              <a
                href={program.official_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all active:scale-[0.98]"
              >
                Visit Official Site
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              {program.last_verified_at && (
                <span className="inline-flex items-center gap-2 px-4 py-2 text-sm text-stone-500">
                  <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verified {new Date(program.last_verified_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Description */}
              {program.description && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-8 rounded-3xl bg-white border border-stone-200/80 shadow-lg shadow-stone-200/30"
                >
                  <h2 className="text-xl font-bold text-stone-900 mb-4 flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    About This Scholarship
                  </h2>
                  <p className="text-stone-600 leading-relaxed">{program.description}</p>
                </motion.section>
              )}

              {/* Who Wins */}
              {program.who_wins && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="p-8 rounded-3xl bg-linear-to-tr from-accent-50 to-accent-100/50 border border-accent-200"
                >
                  <h2 className="text-xl font-bold text-accent-800 mb-4 flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    Who Usually Wins
                  </h2>
                  <p className="text-accent-700 leading-relaxed">{program.who_wins}</p>
                </motion.section>
              )}

              {/* Rejection Reasons */}
              {program.rejection_reasons && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-8 rounded-3xl bg-linear-to-tr from-amber-50 to-amber-100/50 border border-amber-200"
                >
                  <h2 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    Common Rejection Reasons
                  </h2>
                  <p className="text-amber-700 leading-relaxed">{program.rejection_reasons}</p>
                </motion.section>
              )}

              {/* Eligibility Rules */}
              {rules.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="p-8 rounded-3xl bg-white border border-stone-200/80 shadow-lg shadow-stone-200/30"
                >
                  <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    Eligibility Criteria
                  </h2>
                  <div className="space-y-4">
                    {rules.map((rule) => (
                      <div key={rule.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs px-2.5 py-1 rounded-lg bg-stone-200 text-stone-700 capitalize font-medium">
                                {rule.rule_type}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                                rule.confidence === "high" ? "bg-green-100 text-green-700" :
                                rule.confidence === "medium" ? "bg-yellow-100 text-yellow-700" :
                                "bg-stone-100 text-stone-500"
                              }`}>
                                {rule.confidence} confidence
                              </span>
                            </div>
                            <p className="text-stone-700 text-sm">
                              {rule.operator} {JSON.stringify(rule.value)}
                            </p>
                            {rule.source_snippet && (
                              <p className="text-xs text-stone-500 mt-2 italic border-l-2 border-stone-200 pl-3">
                                &quot;{rule.source_snippet}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Requirements */}
              {requirements.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-8 rounded-3xl bg-white border border-stone-200/80 shadow-lg shadow-stone-200/30"
                >
                  <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    Application Requirements
                  </h2>
                  <div className="space-y-3">
                    {requirements.map((req) => (
                      <div key={req.id} className="flex items-start gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-100">
                        <div className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${req.mandatory ? "bg-primary-500" : "bg-stone-300"}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-lg bg-stone-200 text-stone-700 capitalize font-medium">
                              {req.type}
                            </span>
                            {!req.mandatory && (
                              <span className="text-xs text-stone-400">Optional</span>
                            )}
                          </div>
                          <p className="text-stone-700 mt-1">{req.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Timeline */}
              {deadlines.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-lg shadow-stone-200/30 sticky top-32"
                >
                  <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    Timeline
                  </h3>
                  <div className="relative pl-6">
                    {/* Line */}
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-500 via-primary-300 to-stone-200" />
                    
                    <div className="space-y-6">
                      {deadlines.map((deadline, i) => (
                        <div key={deadline.id} className="relative">
                          {/* Dot */}
                          <div className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                            i === 0 ? "bg-primary-500" : "bg-stone-300"
                          }`} />
                          
                          <div>
                            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                              {deadline.stage}
                            </span>
                            <div className="text-sm font-semibold text-stone-900 mt-0.5">
                              {new Date(deadline.deadline_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              })}
                            </div>
                            {deadline.cycle && (
                              <span className="text-xs text-stone-400">{deadline.cycle}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Fields */}
              {program.fields.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-lg shadow-stone-200/30"
                >
                  <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    Fields of Study
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {program.fields.map((field) => (
                      <span key={field} className="text-xs px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700">
                        {field}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-3xl bg-stone-900 text-white"
              >
                <h3 className="text-lg font-bold mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Level</span>
                    <span className="capitalize">{program.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Funding</span>
                    <span className="capitalize">{program.funding_type.replace("_", " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Status</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-accent-500" />
                      {program.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
