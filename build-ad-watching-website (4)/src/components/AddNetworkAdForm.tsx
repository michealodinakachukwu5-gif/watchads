"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NETWORK_REGISTRY, type AdType } from "@/lib/adNetworks";
import { formatCents } from "@/lib/format";

const CATEGORIES = ["General","Finance","Entertainment","Shopping","Travel","Health","Education","Food","Tech","Gaming","Beauty","Sports"];

export function AddNetworkAdForm() {
  const router = useRouter();
  const [selectedNetwork, setSelectedNetwork] = useState<AdType>("monetag");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    videoUrl: "",
    networkZoneId: "",
    durationSeconds: 30,
    rewardCents: 50,
    maxViewsPerUser: 1,
    totalBudgetCents: 10000,
  });

  const net = NETWORK_REGISTRY.find(n => n.key === selectedNetwork)!;
  const s = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.type === "number" ? Number(e.target.value) || 0 : e.target.value }));
  const estViews = form.rewardCents > 0 ? Math.floor(form.totalBudgetCents / form.rewardCents) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null); setSubmitting(true);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          advertiser: net.label,
          category: form.category,
          adType: selectedNetwork,
          videoUrl: form.videoUrl,
          durationSeconds: form.durationSeconds,
          rewardCents: form.rewardCents,
          requiredWatchPercent: 95,
          maxViewsPerUser: form.maxViewsPerUser,
          totalBudgetCents: form.totalBudgetCents,
          networkName: net.label,
          networkZoneId: form.networkZoneId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); setSubmitting(false); return; }
      setSuccess(`✓ "${form.title}" ad added successfully and is now live!`);
      setForm({ title: "", description: "", category: "General", videoUrl: "", networkZoneId: "", durationSeconds: 30, rewardCents: 50, maxViewsPerUser: 1, totalBudgetCents: 10000 });
      setSubmitting(false);
      router.refresh();
    } catch { setError("Network error."); setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
      {/* Network picker */}
      <div>
        <label className="label mb-2">Select ad network</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {NETWORK_REGISTRY.map(n => (
            <button type="button" key={n.key} onClick={() => setSelectedNetwork(n.key)}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left transition ${selectedNetwork === n.key ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]/40"}`}>
              <span className="text-2xl">{n.icon}</span>
              <div>
                <div className={`text-sm font-bold ${selectedNetwork === n.key ? "text-[#c0aaff]" : "text-white"}`}>{n.label}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{n.cpmRange}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected network info */}
      <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{net.icon}</span>
            <div>
              <div className="font-extrabold text-white">{net.label}</div>
              <div className="text-xs text-[var(--text-secondary)]">{net.desc}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="tag tag-green">CPM {net.cpmRange}</span>
            <span className="tag tag-muted">Min payout {net.minPayout}</span>
            {net.signupUrl && (
              <a href={net.signupUrl} target="_blank" rel="noopener noreferrer"
                className="tag hover:opacity-80 transition">Sign up ↗</a>
            )}
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-black/20 p-3 text-xs text-[var(--text-secondary)]">
          <strong className="text-white">📋 How to get your embed URL:</strong><br />
          {net.embedHint}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs text-[var(--text-muted)]">Formats:</span>
          {net.formats.map(f => (
            <span key={f} className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] text-[var(--text-muted)]">{f}</span>
          ))}
        </div>
      </div>

      {/* Form fields */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{net.urlLabel}</label>
          <input required className="input" value={form.videoUrl} onChange={s("videoUrl")} placeholder={net.urlPlaceholder} />
        </div>
        <div>
          <label className="label">Zone / Publisher ID <span className="text-[var(--text-muted)] font-normal">(optional)</span></label>
          <input className="input" value={form.networkZoneId} onChange={s("networkZoneId")} placeholder="Your zone or publisher ID" />
        </div>
        <div>
          <label className="label">Ad title (shown to viewers)</label>
          <input required className="input" value={form.title} onChange={s("title")} placeholder={`${net.label} — Your campaign name`} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={s("category")}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description (shown to viewers)</label>
          <textarea rows={2} className="input resize-none" value={form.description} onChange={s("description")} placeholder="Briefly describe what this ad is about…" />
        </div>
        <div>
          <label className="label">Viewer watch duration (seconds)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {[15, 30, 45, 60, 90].map(v => (
              <button type="button" key={v} onClick={() => setForm(f => ({ ...f, durationSeconds: v }))}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${form.durationSeconds === v ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[#c0aaff]" : "border-[var(--border-subtle)] text-[var(--text-muted)]"}`}>
                {v}s
              </button>
            ))}
          </div>
          <input type="number" min={5} max={1800} className="input w-24" value={form.durationSeconds} onChange={s("durationSeconds")} />
        </div>
        <div>
          <label className="label">Reward per completed view (cents)</label>
          <input type="number" min={1} required className="input" value={form.rewardCents} onChange={s("rewardCents")} />
          <p className="mt-1 text-xs text-[var(--text-muted)]">= {formatCents(form.rewardCents)} per viewer who watches {form.durationSeconds}s</p>
        </div>
        <div>
          <label className="label">Max views per user</label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 0].map(v => (
              <button type="button" key={v} onClick={() => setForm(f => ({ ...f, maxViewsPerUser: v }))}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${form.maxViewsPerUser === v ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[#c0aaff]" : "border-[var(--border-subtle)] text-[var(--text-muted)]"}`}>
                {v === 0 ? "Unlimited" : v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Total budget (cents)</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {[5000, 10000, 25000, 50000].map(v => (
              <button type="button" key={v} onClick={() => setForm(f => ({ ...f, totalBudgetCents: v }))}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${form.totalBudgetCents === v ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[#c0aaff]" : "border-[var(--border-subtle)] text-[var(--text-muted)]"}`}>
                ${(v / 100).toFixed(0)}
              </button>
            ))}
          </div>
          <input type="number" min={100} className="input w-28" value={form.totalBudgetCents} onChange={s("totalBudgetCents")} />
          <p className="mt-1 text-xs text-[var(--text-muted)]">{formatCents(form.totalBudgetCents)} total · ~{estViews.toLocaleString()} views</p>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-sm">
        <div className="font-semibold text-white mb-2">Summary</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Network</span><span>{net.label}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Reward/view</span><span className="text-[var(--success)] font-bold">{formatCents(form.rewardCents)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Duration</span><span>{form.durationSeconds}s</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Est. views</span><span className="font-bold">~{estViews.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Total budget</span><span className="font-bold">{formatCents(form.totalBudgetCents)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-muted)]">Network CPM</span><span>{net.cpmRange}</span></div>
        </div>
      </div>

      {error && <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">{error}</div>}
      {success && <div className="rounded-lg border border-[var(--success)]/30 bg-[var(--success)]/10 px-3 py-2 text-sm text-[var(--success)]">{success}</div>}

      <button type="submit" disabled={submitting || !form.videoUrl || !form.title} className="btn btn-primary w-full">
        {submitting ? <span className="spinner" /> : `Add ${net.label} ad →`}
      </button>
    </form>
  );
}
