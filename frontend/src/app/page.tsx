"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { Program } from "@/lib/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.3 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { type: "spring" as const, damping: 25, stiffness: 200 }
  }
};

const levelConfig = {
  bachelor: { icon: "🎓", label: "Bachelor's", color: "from-blue-500 to-indigo-600" },
  masters: { icon: "📚", label: "Master's", color: "from-purple-500 to-violet-600" },
  phd: { icon: "🔬", label: "PhD", color: "from-primary-500 to-rose-600" },
  postdoc: { icon: "🏆", label: "Postdoc", color: "from-accent-500 to-teal-600" },
};

export default function Home() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("programs").select("*").eq("status", "active").order("name");
      setPrograms(data ?? []);
      setLoading(false);
    };
    fetchPrograms();
  }, []);

  const levels = ["bachelor", "masters", "phd", "postdoc"] as const;
  const grouped = levels.reduce(
    (acc, level) => ({ ...acc, [level]: programs.filter((p) => p.level === level) }),
    {} as Record<string, Program[]>
  );

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-[10%] w-96 h-96 rounded-full bg-linear-to-tr from-primary-200/30 to-accent-200/20 blur-3xl" />
          <div className="absolute bottom-1/4 left-[5%] w-64 h-64 rounded-full bg-gradient-to-tr from-accent-200/30 to-primary-200/10 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-100 text-accent-700 text-sm font-medium mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                AI-Powered Scholarship Discovery
              </motion.div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] mb-6">
                Your Path to{" "}
                <span className="text-gradient">Funded</span>
                <br />
                Education
              </h1>

              <p className="text-lg md:text-xl text-stone-300 max-w-lg mb-8 leading-relaxed">
                Discover life-changing scholarships curated by AI, verified by humans. 
                From Bachelor&apos;s to PhD — find your perfect match.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/programs"
                  className="group inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 transition-all active:scale-[0.98]"
                >
                  Browse All Programs
                  <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/qualify"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-stone-700 bg-white border-2 border-stone-200 rounded-2xl hover:border-stone-300 hover:bg-stone-50 transition-all active:scale-[0.98]"
                >
                  Check Eligibility
                </Link>
              </div>
            </motion.div>

            {/* Right: Stats Cards */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="relative"
            >
              {/* Decorative floating element */}
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-3xl bg-linear-to-tr from-primary-400 to-primary-500 opacity-20 blur-2xl" />
              
              <div className="grid grid-cols-2 gap-4">
                {levels.map((level, i) => {
                  const config = levelConfig[level];
                  return (
                    <motion.div key={level} variants={item}>
                      <Link
                        href={`/programs?level=${level}`}
                        className={`group relative block p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-stone-300 shadow-lg shadow-stone-200/50 hover:shadow-xl hover:shadow-stone-200/60 transition-all hover:-translate-y-1 ${i === 0 ? 'col-span-1' : ''}`}
                      >
                        {/* Gradient accent */}
                        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r ${config.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        
                        <span className="text-3xl mb-3 block">{config.icon}</span>
                        <div className="text-4xl font-bold text-stone-900 mb-1">
                          {loading ? (
                            <span className="inline-block w-8 h-8 bg-stone-200 rounded animate-pulse" />
                          ) : (
                            grouped[level]?.length ?? 0
                          )}
                        </div>
                        <div className="text-sm font-medium text-stone-500">{config.label}</div>
                        <div className="text-xs text-stone-400 mt-0.5">scholarships</div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">
                Featured Programs
              </h2>
              <p className="text-stone-500">Recently added and verified opportunities</p>
            </div>
            <Link
              href="/programs"
              className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              View all
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="p-6 rounded-3xl bg-white border border-stone-200/80 animate-pulse">
                  <div className="h-6 bg-stone-200 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-stone-100 rounded w-1/2 mb-4" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-stone-100 rounded-full" />
                    <div className="h-6 w-24 bg-stone-100 rounded-full" />
                  </div>
                </div>
              ))
            ) : (
              programs.slice(0, 6).map((program) => (
                <motion.div key={program.id} variants={item}>
                  <Link
                    href={`/programs/${program.id}`}
                    className="group block p-6 rounded-3xl bg-white border border-stone-200/80 hover:border-primary-300 shadow-lg shadow-stone-200/30 hover:shadow-xl hover:shadow-primary-100/50 transition-all hover:-translate-y-1"
                  >
                    <h3 className="font-semibold text-lg text-stone-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">
                      {program.name}
                    </h3>
                    <p className="text-sm text-stone-500 mb-4">{program.provider}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize ${
                        program.level === 'phd' ? 'bg-rose-100 text-rose-700' :
                        program.level === 'masters' ? 'bg-purple-100 text-purple-700' :
                        program.level === 'bachelor' ? 'bg-blue-100 text-blue-700' :
                        'bg-teal-100 text-teal-700'
                      }`}>
                        {program.level}
                      </span>
                      <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-accent-100 text-accent-700 capitalize">
                        {program.funding_type.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </motion.div>

          {programs.length > 6 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-10 md:hidden"
            >
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                View all {programs.length} programs
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent via-stone-100/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              How ScholarMap Works
            </h2>
            <p className="text-stone-500 max-w-2xl mx-auto">
              We use AI to discover, extract, and verify scholarship information so you can focus on what matters — your application.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { step: "01", title: "Discover", desc: "Our AI scans trusted sources to find scholarships matching your profile", icon: "🔍" },
              { step: "02", title: "Extract", desc: "Key details like eligibility, deadlines, and requirements are automatically extracted", icon: "📋" },
              { step: "03", title: "Match", desc: "Get personalized recommendations based on your background and goals", icon: "🎯" },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20 } }
                }}
                className="relative group"
              >
                <div className="absolute -inset-4 rounded-3xl bg-linear-to-tr from-primary-100/50 to-accent-100/30 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                <div className="relative p-8 rounded-3xl bg-white border border-stone-200/80 shadow-lg shadow-stone-200/30">
                  <span className="text-5xl mb-6 block">{item.icon}</span>
                  <span className="text-xs font-mono text-primary-500 font-semibold">{item.step}</span>
                  <h3 className="text-xl font-bold text-stone-900 mt-1 mb-2">{item.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-tr from-stone-900 to-stone-800 p-12 md:p-16 text-center"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Find Your Perfect Scholarship?
              </h2>
              <p className="text-stone-400 max-w-xl mx-auto mb-8">
                Enter your details and let our AI match you with opportunities you actually qualify for.
              </p>
              <Link
                href="/qualify"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-stone-900 bg-white rounded-2xl shadow-xl hover:bg-stone-50 transition-all active:scale-[0.98]"
              >
                Check Your Eligibility
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
