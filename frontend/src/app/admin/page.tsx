"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import type { Program } from "@/lib/types";

export default function AdminPage() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [url, setUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; program_id?: string; confidence?: number; issues?: string[] } | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [reviews, setReviews] = useState<{ id: string; program_id: string; issue_type: string; note: string; severity: string; resolved: boolean }[]>([]);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_URL || "https://scholarmap-agent.onrender.com"}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.NEXT_PUBLIC_AGENT_SECRET || "sm_agent_secret_2026_xK9mP3nQ7vL"}` },
        body: JSON.stringify({ url }),
      });
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
    await (supabase.from("agent_reviews") as ReturnType<typeof supabase.from>).update({ resolved: true }).eq("id", id);
    loadData();
  };

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-12">Loading...</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-20">
        <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
          {authError && <p className="text-red-500 text-sm">{authError}</p>}
          <button type="submit" className="w-full px-6 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Agent Copilot</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{user.email}</span>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600">Logout</button>
        </div>
      </div>

      <section className="mb-12 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h2 className="text-lg font-semibold mb-4">Ingest Scholarship URL</h2>
        <form onSubmit={handleIngest} className="flex gap-3">
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.chevening.org/scholarship/..." className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" required />
          <button type="submit" disabled={ingesting} className="px-6 py-2.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 disabled:opacity-50">
            {ingesting ? "Processing..." : "Ingest"}
          </button>
        </form>
        {result && (
          <div className={`mt-4 p-4 rounded-lg ${result.success ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700" : "bg-red-50 dark:bg-red-900/20 text-red-700"}`}>
            {result.success ? (
              <div>
                <p className="font-medium">Success! Confidence: {((result.confidence ?? 0) * 100).toFixed(0)}%</p>
                {result.issues && result.issues.length > 0 && <p className="text-sm mt-1">Notes: {result.issues.join(", ")}</p>}
              </div>
            ) : (
              <p>Error: {result.issues?.join(", ")}</p>
            )}
          </div>
        )}
      </section>

      {reviews.length > 0 && (
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Issues to Review ({reviews.length})</h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded ${r.severity === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{r.severity}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 ml-2">{r.issue_type}</span>
                  <p className="mt-1 text-sm">{r.note}</p>
                </div>
                <button onClick={() => resolveReview(r.id)} className="text-sm text-emerald-600 hover:text-emerald-700">Resolve</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">Programs ({programs.length})</h2>
        <div className="space-y-3">
          {programs.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-medium">{p.name}</h3>
                <p className="text-sm text-slate-500">{p.provider} · {p.level}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${p.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
            </div>
          ))}
          {programs.length === 0 && <p className="text-slate-500 text-center py-8">No programs yet. Ingest a URL to get started.</p>}
        </div>
      </section>
    </div>
  );
}
