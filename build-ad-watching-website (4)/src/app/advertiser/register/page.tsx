"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { COUNTRIES } from "@/lib/countries";

export default function AdvertiserRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", country: "United States", companyName: "", companyWebsite: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, role: "advertiser" }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
      router.push("/advertiser");
      router.refresh();
    } catch { setError("Network error."); setLoading(false); }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(f => ({...f, [k]: e.target.value}));

  return (
    <div className="min-h-screen">
      <SiteHeader initialUser={null} />
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <Link href="/advertise" className="text-sm text-[var(--text-secondary)] hover:text-white">← Back to advertiser info</Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Advertiser account</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Create your account to start running campaigns on WatchAds.</p>

        <form onSubmit={handleSubmit} className="glass-card mt-8 space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Your name</label><input required className="input" value={form.name} onChange={set("name")} placeholder="Jane Doe" /></div>
            <div><label className="label">Email</label><input required type="email" className="input" value={form.email} onChange={set("email")} placeholder="you@company.com" /></div>
          </div>
          <div><label className="label">Password</label><input required type="password" minLength={8} className="input" value={form.password} onChange={set("password")} placeholder="8+ characters" /></div>
          <div><label className="label">Company / brand name</label><input required className="input" value={form.companyName} onChange={set("companyName")} placeholder="Acme Corp" /></div>
          <div><label className="label">Company website (optional)</label><input type="url" className="input" value={form.companyWebsite} onChange={set("companyWebsite")} placeholder="https://yourcompany.com" /></div>
          <div><label className="label">Country</label>
            <select required className="input" value={form.country} onChange={set("country")}>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {error && <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">{error}</div>}
          <div className="rounded-lg border border-[#f5a524]/30 bg-[#f5a524]/10 p-3 text-xs text-[#f5a524]">
            ⏳ Your account requires admin approval before you can publish campaigns. We typically review within 24 hours.
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? <span className="spinner" /> : "Create advertiser account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Want to earn money instead?{" "}
          <Link href="/register" className="text-[#c8b8ff] hover:underline">Sign up as a viewer</Link>
        </p>
      </main>
    </div>
  );
}
