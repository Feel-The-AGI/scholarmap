"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Program } from "@/lib/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 15, filter: "blur(6px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { type: "spring" as const, damping: 25, stiffness: 200 }
  }
};

const levelConfig: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  bachelor: { icon: "🎓", label: "Bachelor's", color: "text-blue-700", bg: "bg-blue-100" },
  masters: { icon: "📚", label: "Master's", color: "text-purple-700", bg: "bg-purple-100" },
  phd: { icon: "🔬", label: "PhD", color: "text-rose-700", bg: "bg-rose-100" },
  postdoc: { icon: "🏆", label: "Postdoc", color: "text-teal-700", bg: "bg-teal-100" },
};

export default function ProgramsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-stone-500">Loading programs...</p>
        </div>
      </div>
    }>
      <ProgramsContent />
    </Suspense>
  );
}

function ProgramsContent() {
  const searchParams = useSearchParams();
  const level = searchParams.get("level");
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      const supabase = createClient();
      let query = supabase.from("programs").select("*").eq("status", "active");
      if (level) query = query.eq("level", level);
      const { data } = await query.order("name");
      setPrograms(data ?? []);
      setLoading(false);
    };
    fetchPrograms();
  }, [level]);

  const levels = ["all", "bachelor", "masters", "phd", "postdoc"];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative py-12 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-[20%] w-64 h-64 rounded-full bg-linear-to-tr from-primary-200/40 to-accent-200/20 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto relative">
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
            
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">
              {level ? (
                <>
                  {levelConfig[level]?.icon} {levelConfig[level]?.label || level.charAt(0).toUpperCase() + level.slice(1)} Programs
                </>
              ) : (
                "All Programs"
              )}
            </h1>
            <p className="text-lg text-stone-500 max-w-2xl">
              {loading 
                ? "Loading scholarships..." 
                : `${programs.length} scholarship${programs.length !== 1 ? 's' : ''} available`
              }
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-24 z-40 px-6 py-4 bg-stone-50/80 backdrop-blur-xl border-y border-stone-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
            {levels.map((l) => {
              const isActive = (l === "all" && !level) || l === level;
              const config = levelConfig[l];
              return (
                <Link
                  key={l}
                  href={l === "all" ? "/programs" : `/programs?level=${l}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-stone-900 text-white shadow-lg"
                      : "bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  {config?.icon && <span>{config.icon}</span>}
                  {l === "all" ? "All" : config?.label || l}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white border border-stone-200/80 animate-pulse">
                  <div className="h-6 bg-stone-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-stone-100 rounded w-1/2 mb-4" />
                  <div className="h-16 bg-stone-50 rounded mb-4" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-stone-100 rounded-full" />
                    <div className="h-6 w-24 bg-stone-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : programs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-stone-900 mb-2">No programs found</h3>
              <p className="text-stone-500 mb-6">
                {level ? `No ${level} scholarships available yet.` : "No scholarships available yet."}
              </p>
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
              >
                View all programs
              </Link>
            </motion.div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {programs.map((program) => {
                const config = levelConfig[program.level] || { icon: "📄", color: "text-stone-700", bg: "bg-stone-100" };
                return (
                  <motion.div key={program.id} variants={item}>
                    <Link
                      href={`/programs/${program.id}`}
                      className="group block h-full p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-primary-300 shadow-lg shadow-stone-200/30 hover:shadow-xl hover:shadow-primary-100/50 transition-all hover:-translate-y-1"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="font-semibold text-lg text-stone-900 group-hover:text-primary-600 transition-colors line-clamp-2 flex-1">
                          {program.name}
                        </h3>
                        <span className="text-2xl flex-shrink-0">{config.icon}</span>
                      </div>

                      {/* Provider */}
                      <p className="text-sm text-stone-500 mb-4">{program.provider}</p>

                      {/* Description */}
                      {program.description && (
                        <p className="text-sm text-stone-600 line-clamp-2 mb-4 leading-relaxed">
                          {program.description}
                        </p>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize ${config.bg} ${config.color}`}>
                          {program.level}
                        </span>
                        <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-accent-100 text-accent-700 capitalize">
                          {program.funding_type.replace("_", " ")}
                        </span>
                      </div>

                      {/* Fields */}
                      {program.fields.length > 0 && (
                        <div className="pt-4 border-t border-stone-100">
                          <div className="flex flex-wrap gap-1.5">
                            {program.fields.slice(0, 3).map((field) => (
                              <span key={field} className="text-xs px-2 py-1 rounded-lg bg-stone-100 text-stone-600">
                                {field}
                              </span>
                            ))}
                            {program.fields.length > 3 && (
                              <span className="text-xs px-2 py-1 text-stone-400">
                                +{program.fields.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Hover indicator */}
                      <div className="flex items-center gap-1 mt-4 text-sm font-medium text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        View details
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
