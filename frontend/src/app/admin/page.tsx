"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import type { Program } from "@/lib/types";

const levelConfig: Record<string, { icon: string; color: string; bg: string }> = {
  bachelor: { icon: "🎓", color: "text-blue-700", bg: "bg-blue-100" },
  masters: { icon: "📚", color: "text-purple-700", bg: "bg-purple-100" },
  phd: { icon: "🔬", color: "text-rose-700", bg: "bg-rose-100" },
  postdoc: { icon: "🏆", color: "text-teal-700", bg: "bg-teal-100" },
};

export default function AdminPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [url, setUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    program_id?: string;
    confidence?: number;
    issues?: string[];
  } | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [reviews, setReviews] = useState<
    {
      id: string;
      program_id: string;
      issue_type: string;
      note: string;
      severity: string;
      resolved: boolean;
    }[]
  >([]);

  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ? { email: data.user.email ?? "" } : null);
      setLoading(false);
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const [{ data: progs }, { data: revs }] = await Promise.all([
      supabase.from("programs").select("*").order("created_at", { ascending: false }),
      supabase.from("agent_reviews").select("*").eq("resolved", false).order("created_at", { ascending: false }),
    ]);
    setPrograms((progs ?? []) as Program[]);
    setReviews(revs ?? []);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
    } else {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ? { email: data.user.email ?? "" } : null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIngesting(true);
    setResult(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_AGENT_URL || "https://scholarmap-agent.onrender.com"}/ingest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_AGENT_SECRET || "sm_agent_secret_2026_xK9mP3nQ7vL"}`,
          },
          body: JSON.stringify({ url }),
        }
      );
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setUrl("");
        loadData();
      }
    } catch (err) {
      setResult({ success: false, issues: [(err as Error).message] });
    }
    setIngesting(false);
  };

  const resolveReview = async (id: string) => {
    await (supabase.from("agent_reviews") as ReturnType<typeof supabase.from>)
      .update({ resolved: true })
      .eq("id", id);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-stone-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Login Page
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-linear-to-tr from-primary-200/30 to-accent-200/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-linear-to-tr from-accent-200/30 to-primary-200/10 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-stone-900 to-stone-800 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <span className="text-2xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Admin Portal</h1>
            <p className="text-stone-500 mt-1">Sign in to manage scholarships</p>
          </div>

          <form
            onSubmit={handleLogin}
            className="p-8 rounded-3xl bg-white border border-stone-200/80 shadow-xl shadow-stone-200/30 space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-stone-900 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-stone-200 bg-stone-50 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 outline-none transition-all text-stone-900 placeholder:text-stone-400"
                placeholder="admin@scholarmap.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-900 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-stone-200 bg-stone-50 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-100 outline-none transition-all text-stone-900 placeholder:text-stone-400"
                placeholder="••••••••"
              />
            </div>

            <AnimatePresence>
              {authError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl"
                >
                  {authError}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="w-full px-6 py-4 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors"
            >
              Sign In
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative py-8 px-6 border-b border-stone-200 bg-white/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-stone-900 to-stone-800 flex items-center justify-center shadow-lg">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Agent Copilot</h1>
                <p className="text-sm text-stone-500">Scholarship Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100">
                <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                <span className="text-sm text-stone-600">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Programs", value: programs.length, icon: "📊", color: "from-blue-500 to-indigo-600" },
              { label: "Active", value: programs.filter(p => p.status === "active").length, icon: "✅", color: "from-accent-500 to-teal-600" },
              { label: "Pending Review", value: reviews.length, icon: "⚠️", color: "from-amber-500 to-orange-600" },
              { label: "Paused", value: programs.filter(p => p.status === "paused").length, icon: "⏸️", color: "from-stone-500 to-stone-600" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-white border border-stone-200/80 shadow-lg shadow-stone-200/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className={`w-8 h-1 rounded-full bg-linear-to-r ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-stone-900">{stat.value}</div>
                <div className="text-sm text-stone-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Ingest Section */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-linear-to-tr from-stone-900 to-stone-800 text-white"
              >
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  Ingest Scholarship
                </h2>
                <form onSubmit={handleIngest} className="space-y-4">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/scholarship"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-stone-400 focus:border-white/40 focus:ring-2 focus:ring-white/10 outline-none transition-all"
                    required
                  />
                  <button
                    type="submit"
                    disabled={ingesting}
                    className="w-full px-6 py-3.5 rounded-xl bg-white text-stone-900 font-semibold hover:bg-stone-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {ingesting ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                          <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Ingest URL
                      </>
                    )}
                  </button>
                </form>

                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mt-4 p-4 rounded-xl ${
                        result.success ? "bg-accent-500/20" : "bg-red-500/20"
                      }`}
                    >
                      {result.success ? (
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            <span>✅</span>
                            Success! {((result.confidence ?? 0) * 100).toFixed(0)}% confidence
                          </p>
                          {result.issues && result.issues.length > 0 && (
                            <p className="text-sm mt-1 text-stone-300">Notes: {result.issues.join(", ")}</p>
                          )}
                        </div>
                      ) : (
                        <p className="flex items-center gap-2">
                          <span>❌</span>
                          {result.issues?.join(", ")}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Reviews */}
              {reviews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-6 p-6 rounded-3xl bg-amber-50 border border-amber-200"
                >
                  <h2 className="text-lg font-bold text-amber-800 mb-4 flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    Issues to Review ({reviews.length})
                  </h2>
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl bg-white border border-amber-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-lg font-medium ${
                                  r.severity === "high"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {r.severity}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600">
                                {r.issue_type}
                              </span>
                            </div>
                            <p className="text-sm text-stone-700">{r.note}</p>
                          </div>
                          <button
                            onClick={() => resolveReview(r.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-accent-100 text-accent-700 hover:bg-accent-200 transition-colors font-medium"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Programs List */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 rounded-3xl bg-white border border-stone-200/80 shadow-xl shadow-stone-200/30"
              >
                <h2 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                  <span className="text-xl">📚</span>
                  All Programs ({programs.length})
                </h2>

                {programs.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-4">📭</div>
                    <h3 className="text-lg font-semibold text-stone-900 mb-2">No programs yet</h3>
                    <p className="text-stone-500">Ingest a scholarship URL to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {programs.map((p) => {
                      const config = levelConfig[p.level] || { icon: "📄", color: "text-stone-700", bg: "bg-stone-100" };
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100 hover:bg-stone-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{config.icon}</span>
                            <div>
                              <h3 className="font-semibold text-stone-900">{p.name}</h3>
                              <p className="text-sm text-stone-500">
                                {p.provider} · {p.level}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                              p.status === "active"
                                ? "bg-accent-100 text-accent-700"
                                : p.status === "paused"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-stone-100 text-stone-600"
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
