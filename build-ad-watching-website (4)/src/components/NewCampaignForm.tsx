"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/format";

type AdType = "mp4" | "youtube" | "network";

const CATEGORIES = ["General","Finance","Entertainment","Shopping","Travel","Health","Education","Food","Tech","Gaming","Beauty","Sports"];

const TYPE_INFO = {
  mp4: { icon: "🎬", label: "MP4 / Hosted", desc: "Direct .mp4 URL from any CDN", urlLabel: "Video URL (.mp4)", placeholder: "https://your-cdn.com/ad.mp4" },
  youtube: { icon: "▶️", label: "YouTube", desc: "YouTube video ID (11 chars)", urlLabel: "YouTube Video ID", placeholder: "e.g. dQw4w9WgXcQ" },
  network: { icon: "📡", label: "Ad Network", desc: "Monetag, HilltopAds, VAST embed", urlLabel: "Network embed URL or zone ID", placeholder: "Paste embed URL or publisher zone ID" },
};

export function NewCampaignForm({ companyName }: { companyName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "General",
    adType: "mp4" as AdType,
    videoUrl: "", thumbnailUrl: "",
    durationSeconds: 30, rewardCents: 75,
    maxViewsPerUser: 1, totalBudgetCents: 10000,
    networkName: "", networkZoneId: "",
  });
  const s = (k: keyof typeof form) => (v: unknown) => setForm(f => ({...f, [k]: v}));

  const info = TYPE_INFO[form.adType];
  const estViews = form.rewardCents > 0 ? Math.floor(form.totalBudgetCents / form.rewardCents) : 0;

  const handleSubmit = async () => {
    setError(null); setSubmitting(true);
    try {
      const res = await fetch("/api/advertiser/campaigns", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          thumbnailUrl: form.thumbnailUrl || undefined,
          networkName: form.networkName || undefined,
          networkZoneId: form.networkZoneId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Submission failed"); setSubmitting(false); return; }
      setDone(true);
      setTimeout(() => router.push("/advertiser"), 3000);
    } catch { setError("Network error."); setSubmitting(false); }
  };

  if (done) return (
    <div className="glass-card mt-8 p-10 text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="mt-4 text-2xl font-extrabold">Campaign submitted!</h2>
      <p className="mt-2 text-[var(--text-secondary)]">Your campaign is pending admin review. Once approved and your budget payment is confirmed, it will go live automatically.</p>
      <p className="mt-4 text-sm text-[var(--text-muted)]">Redirecting to your campaigns…</p>
    </div>
  );

  return (
    <div className="mt-8 space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[1,2,3].map(n => (
          <div key={n} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold transition ${step >= n ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"}`}>{n}</div>
            {n < 3 && <div className={`h-px w-10 ${step > n ? "bg-[var(--accent)]" : "bg-[var(--border-subtle)]"}`}/>}
          </div>
        ))}
        <span className="ml-2 text-sm text-[var(--text-muted)]">{step===1?"Ad content":step===2?"Timing & reward":"Budget & submit"}</span>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="glass-card space-y-4 p-6">
          <h2 className="text-lg font-bold">Step 1 — Ad content</h2>

          <div>
            <label className="label">Ad format</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {(["mp4","youtube","network"] as AdType[]).map(t => {
                const i = TYPE_INFO[t];
                return (
                  <button type="button" key={t} onClick={() => s("adType")(t)}
                    className={`rounded-xl border p-3 text-left transition ${form.adType===t?"border-[var(--accent)] bg-[var(--accent-soft)]":"border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]/40"}`}>
                    <div className="text-2xl">{i.icon}</div>
                    <div className="mt-1 text-sm font-bold">{i.label}</div>
                    <div className="text-xs text-[var(--text-muted)]">{i.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">Campaign title</label>
            <input className="input" value={form.title} onChange={e => s("title")(e.target.value)} placeholder="e.g. Brand X — Summer Sale 2025" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={3} className="input resize-none" value={form.description} onChange={e => s("description")(e.target.value)} placeholder="Describe your ad to viewers…"/>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => s("category")(e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{info.urlLabel}</label>
            <input className="input" value={form.videoUrl} onChange={e => s("videoUrl")(e.target.value)} placeholder={info.placeholder}/>
            {form.adType === "youtube" && <p className="mt-1 text-xs text-[var(--text-muted)]">Find your video ID at youtube.com/watch?v=<strong>THIS_PART</strong></p>}
            {form.adType === "network" && <p className="mt-1 text-xs text-[var(--text-muted)]">Paste the full embed URL or the zone/publisher ID from your ad network dashboard.</p>}
          </div>
          {form.adType !== "network" && (
            <div>
              <label className="label">Thumbnail URL <span className="text-[var(--text-muted)] font-normal">(optional)</span></label>
              <input type="url" className="input" value={form.thumbnailUrl} onChange={e => s("thumbnailUrl")(e.target.value)} placeholder="https://your-cdn.com/thumb.jpg"/>
            </div>
          )}
          {form.adType === "network" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Network name</label>
                <input className="input" value={form.networkName} onChange={e => s("networkName")(e.target.value)} placeholder="Monetag, HilltopAds…"/>
              </div>
              <div>
                <label className="label">Zone / Publisher ID</label>
                <input className="input" value={form.networkZoneId} onChange={e => s("networkZoneId")(e.target.value)}/>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <button onClick={() => setStep(2)} disabled={!form.title || !form.videoUrl} className="btn btn-primary">Next →</button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="glass-card space-y-5 p-6">
          <h2 className="text-lg font-bold">Step 2 — Timing &amp; reward</h2>

          <div>
            <label className="label">Ad duration (seconds)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[15,30,45,60,90,120].map(v => (
                <button type="button" key={v} onClick={() => s("durationSeconds")(v)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${form.durationSeconds===v?"border-[var(--accent)] bg-[var(--accent-soft)] text-[#c0aaff]":"border-[var(--border-subtle)] text-[var(--text-muted)]"}`}>
                  {v}s
                </button>
              ))}
            </div>
            <input type="number" min={5} max={1800} className="input w-28" value={form.durationSeconds} onChange={e => s("durationSeconds")(+e.target.value||30)}/>
          </div>

          <div>
            <label className="label">Reward per completed view (USD cents)</label>
            <div className="flex items-center gap-3">
              <input type="number" min={1} className="input w-32" value={form.rewardCents} onChange={e => s("rewardCents")(+e.target.value||1)}/>
              <span className="text-sm text-[var(--text-secondary)]">= <strong className="text-white">{formatCents(form.rewardCents)}</strong> per view</span>
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Suggested: {formatCents(Math.round(form.durationSeconds * 2.5))} for a {form.durationSeconds}s ad ($2.50/min)</p>
          </div>

          <div>
            <label className="label">Max views per user</label>
            <div className="flex flex-wrap gap-2">
              {[1,2,3,5,0].map(v => (
                <button type="button" key={v} onClick={() => s("maxViewsPerUser")(v)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${form.maxViewsPerUser===v?"border-[var(--accent)] bg-[var(--accent-soft)] text-[#c0aaff]":"border-[var(--border-subtle)] text-[var(--text-muted)]"}`}>
                  {v === 0 ? "Unlimited" : v}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn btn-secondary">← Back</button>
            <button onClick={() => setStep(3)} className="btn btn-primary">Next →</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="glass-card space-y-5 p-6">
          <h2 className="text-lg font-bold">Step 3 — Budget &amp; submit</h2>

          <div>
            <label className="label">Total campaign budget (USD)</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {[50,100,250,500,1000].map(v => (
                <button type="button" key={v} onClick={() => s("totalBudgetCents")(v*100)}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${form.totalBudgetCents===v*100?"border-[var(--accent)] bg-[var(--accent-soft)] text-[#c0aaff]":"border-[var(--border-subtle)] text-[var(--text-muted)]"}`}>
                  ${v}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">Custom: $</span>
              <input type="number" min={50} step={10} className="input w-32" value={form.totalBudgetCents/100} onChange={e => s("totalBudgetCents")(Math.round((+e.target.value||50)*100))}/>
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Minimum $50.00</p>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-2 text-sm">
            <div className="font-semibold text-white mb-2">Campaign summary</div>
            {[
              ["Company", companyName],
              ["Ad format", `${TYPE_INFO[form.adType].icon} ${TYPE_INFO[form.adType].label}`],
              ["Category", form.category],
              ["Duration", `${form.durationSeconds}s`],
              ["Reward/view", formatCents(form.rewardCents)],
              ["Max views/user", form.maxViewsPerUser === 0 ? "Unlimited" : String(form.maxViewsPerUser)],
              ["Total budget", formatCents(form.totalBudgetCents)],
              ["Est. completed views", `~${estViews.toLocaleString()}`],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-[var(--text-muted)]">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/8 p-4 text-sm text-[var(--warning)]">
            <strong>💳 Payment required after submission.</strong> Your campaign goes live once admin approves it and confirms receipt of your budget payment via PayPal, Crypto, or Bank Transfer.
          </div>

          {error && <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">{error}</div>}

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn btn-secondary">← Back</button>
            <button onClick={handleSubmit} disabled={submitting || form.totalBudgetCents < 5000} className="btn btn-primary">
              {submitting ? <span className="spinner"/> : "Submit campaign →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
