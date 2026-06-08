"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type AdType, getAdTypeInfo, NETWORK_REGISTRY } from "@/lib/adNetworks";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Ad {
  id: number;
  title: string;
  advertiser: string;
  description: string;
  category: string;
  adType: AdType;
  source: string;
  durationSeconds: number;
  rewardCents: number;
  videoUrl: string;
  thumbnailUrl: string | null;
  requiredWatchPercent: number;
  maxViewsPerUser: number;
  totalBudgetCents: number;
  remainingBudgetCents: number;
  status: "pending_review" | "active" | "paused" | "ended" | "rejected";
  adminNote: string | null;
  advertiserId: number | null;
  networkName: string | null;
  networkZoneId: string | null;
  createdAt: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: "user" | "admin" | "advertiser";
  country: string;
  balanceCents: number;
  lifetimeEarningsCents: number;
  withdrawalActivated: boolean;
  companyName: string | null;
  advertiserApproved: boolean;
  createdAt: string;
}

interface Withdrawal {
  id: number;
  amountCents: number;
  method: "paypal" | "bank" | "crypto" | "gift_card";
  accountDetails: string;
  status: "pending" | "approved" | "rejected" | "paid";
  note: string | null;
  createdAt: string;
  processedAt: string | null;
  userId: number;
  userEmail: string;
  userName: string;
}

interface Payment {
  id: number;
  amountCents: number;
  status: "pending" | "paid" | "failed" | "refunded";
  paymentRef: string | null;
  note: string | null;
  createdAt: string;
  adId: number | null;
  advertiserId: number;
  userName: string;
  userEmail: string;
}

type Tab = "ads" | "users" | "withdrawals" | "payments";

// ─── Root Component ───────────────────────────────────────────────────────────
export function AdminDashboard({ ads, users, withdrawals, payments }: {
  ads: Ad[];
  users: User[];
  withdrawals: Withdrawal[];
  payments: Payment[];
}) {
  const [tab, setTab] = useState<Tab>("ads");
  const pendingAds = ads.filter(a => a.status === "pending_review").length;
  const pendingW = withdrawals.filter(w => w.status === "pending").length;

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-1">
        {([
          { key: "ads" as Tab, label: `Ads (${ads.length})`, badge: pendingAds },
          { key: "users" as Tab, label: `Users (${users.length})`, badge: 0 },
          { key: "withdrawals" as Tab, label: `Withdrawals`, badge: pendingW },
          { key: "payments" as Tab, label: `Ad Payments (${payments.length})`, badge: 0 },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition min-w-[100px] ${tab === t.key ? "bg-[var(--accent)] text-white shadow" : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-white"}`}
          >
            {t.label}
            {t.badge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f5a524] text-[9px] font-black text-black">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === "ads" && <AdsTab ads={ads} />}
      {tab === "users" && <UsersTab users={users} />}
      {tab === "withdrawals" && <WithdrawalsTab withdrawals={withdrawals} />}
      {tab === "payments" && <PaymentsTab payments={payments} />}
    </div>
  );
}

// ─── Ads Tab ─────────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  pending_review: "bg-[#f5a524]/15 text-[#f5a524]",
  active: "bg-[#2bd99f]/15 text-[#2bd99f]",
  paused: "bg-white/10 text-[var(--text-secondary)]",
  ended: "bg-white/5 text-[var(--text-muted)]",
  rejected: "bg-[var(--danger)]/15 text-[var(--danger)]",
};

function AdsTab({ ads }: { ads: Ad[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({
    title: "", description: "", advertiser: "", category: "General",
    adType: "mp4" as AdType,
    durationSeconds: 30, rewardCents: 75,
    videoUrl: "", thumbnailUrl: "",
    requiredWatchPercent: 95, maxViewsPerUser: 1,
    totalBudgetCents: 10000,
    networkName: "", networkZoneId: "",
  });

  const filtered = filter === "all" ? ads : ads.filter(a => a.status === filter);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSubmitting(true);
    const res = await fetch("/api/admin/ads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, thumbnailUrl: form.thumbnailUrl || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setSubmitting(false); return; }
    setShowForm(false); setSubmitting(false); router.refresh();
  };

  const updateStatus = async (id: number, status: string, note?: string) => {
    await fetch("/api/admin/ads", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status, adminNote: note }),
    });
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["all","pending_review","active","paused","ended","rejected"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${filter === s ? "border-[#7c5cff] bg-[var(--accent-soft)] text-[#c8b8ff]" : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[#7c5cff]/40"}`}
            >
              {s === "all" ? `All (${ads.length})` : s.replace("_"," ")}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn btn-primary">
          {showForm ? "Cancel" : "+ New ad"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="glass-card grid gap-4 p-5 sm:grid-cols-2">
          {/* ── Step 1: Pick ad format ── */}
          <div className="sm:col-span-2">
            <label className="label mb-2">Step 1 — Choose ad format</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(["mp4","youtube"] as const).map(t => (
                <button type="button" key={t} onClick={() => setForm({...form, adType: t})}
                  className={`rounded-xl border p-3 text-left transition ${form.adType === t ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]/40"}`}>
                  <div className="text-xl">{t === "mp4" ? "🎬" : "▶️"}</div>
                  <div className="mt-1 text-sm font-bold">{t === "mp4" ? "MP4 / Hosted" : "YouTube"}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{t === "mp4" ? "Direct .mp4 URL" : "YouTube video ID"}</div>
                </button>
              ))}
              {/* Third card: ad networks grid trigger */}
              <button type="button" onClick={() => { if (form.adType === "mp4" || form.adType === "youtube") setForm({...form, adType: "monetag"}); }}
                className={`rounded-xl border p-3 text-left transition ${form.adType !== "mp4" && form.adType !== "youtube" ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]/40"}`}>
                <div className="text-xl">📡</div>
                <div className="mt-1 text-sm font-bold">Ad Network</div>
                <div className="text-[10px] text-[var(--text-muted)]">12 networks supported</div>
              </button>
            </div>

            {/* Network selector - show when not mp4/youtube */}
            {form.adType !== "mp4" && form.adType !== "youtube" && (
              <div>
                <label className="label">Select ad network</label>
                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 sm:grid-cols-3">
                  {NETWORK_REGISTRY.map(net => (
                    <button type="button" key={net.key} onClick={() => setForm({...form, adType: net.key, networkName: net.label})}
                      className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition ${form.adType === net.key ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[#c0aaff]" : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent)]/40"}`}>
                      <span className="text-base">{net.icon}</span>
                      <div>
                        <div className="font-bold text-white">{net.label}</div>
                        <div className="text-[9px] text-[var(--text-muted)]">{net.cpmRange} CPM</div>
                      </div>
                    </button>
                  ))}
                </div>
                {/* Show hints for selected network */}
                {(() => {
                  const net = NETWORK_REGISTRY.find(n => n.key === form.adType);
                  if (!net) return null;
                  return (
                    <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3 text-xs">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">{net.icon}</span>
                        <span className="font-bold text-white">{net.label}</span>
                        <span className="tag tag-green">{net.cpmRange} CPM</span>
                        {net.signupUrl && <a href={net.signupUrl} target="_blank" rel="noopener" className="ml-auto text-[#c0aaff] hover:underline">Sign up →</a>}
                      </div>
                      <p className="text-[var(--text-secondary)] mb-1.5">{net.desc}</p>
                      <p className="text-[var(--text-muted)]">📋 <strong className="text-white">How to get the URL:</strong> {net.embedHint}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {net.formats.map(f => <span key={f} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px]">{f}</span>)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div><label className="label">Title</label><input required className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div><label className="label">Advertiser name</label><input required className="input" value={form.advertiser} onChange={e => setForm({...form, advertiser: e.target.value})} /></div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea required rows={2} className="input resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div><label className="label">Category</label><input required className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
          <div>
            <label className="label">
              {form.adType === "mp4" ? "Video URL (.mp4)" : form.adType === "youtube" ? "YouTube Video ID" : (() => { const n = NETWORK_REGISTRY.find(x => x.key === form.adType); return n?.urlLabel ?? "Network embed URL"; })()}
            </label>
            <input required className="input" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})}
              placeholder={form.adType === "mp4" ? "https://your-cdn.com/ad.mp4" : form.adType === "youtube" ? "dQw4w9WgXcQ" : (() => { const n = NETWORK_REGISTRY.find(x => x.key === form.adType); return n?.urlPlaceholder ?? "Paste embed URL"; })()} />
          </div>
          {(form.adType === "mp4" || form.adType === "youtube") && (
            <div><label className="label">Thumbnail URL (optional)</label><input type="url" className="input" value={form.thumbnailUrl} onChange={e => setForm({...form, thumbnailUrl: e.target.value})} /></div>
          )}
          {form.adType !== "mp4" && form.adType !== "youtube" && (
            <>
              <div><label className="label">Network name</label><input className="input" value={form.networkName} onChange={e => setForm({...form, networkName: e.target.value})} placeholder="e.g. Monetag, HilltopAds…" /></div>
              <div><label className="label">Zone / Publisher ID (optional)</label><input className="input" value={form.networkZoneId} onChange={e => setForm({...form, networkZoneId: e.target.value})} /></div>
            </>
          )}
          <div><label className="label">Duration (seconds)</label><input required type="number" min={5} max={1800} className="input" value={form.durationSeconds} onChange={e => setForm({...form, durationSeconds: +e.target.value||0})} /></div>
          <div><label className="label">Reward per view (cents)</label>
            <input required type="number" min={1} className="input" value={form.rewardCents} onChange={e => setForm({...form, rewardCents: +e.target.value||0})} />
            <p className="mt-1 text-xs text-[var(--text-muted)]">${(form.rewardCents/100).toFixed(2)} per view</p>
          </div>
          <div><label className="label">Required watch %</label><input required type="number" min={50} max={100} className="input" value={form.requiredWatchPercent} onChange={e => setForm({...form, requiredWatchPercent: +e.target.value||95})} /></div>
          <div><label className="label">Max views per user (0=unlimited)</label><input required type="number" min={0} className="input" value={form.maxViewsPerUser} onChange={e => setForm({...form, maxViewsPerUser: +e.target.value||0})} /></div>
          <div><label className="label">Total budget (cents)</label>
            <input required type="number" min={0} className="input" value={form.totalBudgetCents} onChange={e => setForm({...form, totalBudgetCents: +e.target.value||0})} />
            <p className="mt-1 text-xs text-[var(--text-muted)]">${(form.totalBudgetCents/100).toFixed(2)} total</p>
          </div>
          {error && <div className="sm:col-span-2 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">{error}</div>}
          <div className="sm:col-span-2 flex justify-end"><button type="submit" disabled={submitting} className="btn btn-primary">{submitting ? <span className="spinner"/> : "Create ad"}</button></div>
        </form>
      )}

      <div className="glass-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--text-secondary)]">No ads match this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--bg-elevated)] text-left text-xs uppercase tracking-widest text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3">Ad</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Reward</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const spent = a.totalBudgetCents - a.remainingBudgetCents;
                  const pct = a.totalBudgetCents > 0 ? Math.round((spent/a.totalBudgetCents)*100) : 0;
                  return (
                    <tr key={a.id} className="border-t border-[var(--border-subtle)]">
                      <td className="px-4 py-3 max-w-[200px]">
                        <div className="font-semibold truncate">{a.title}</div>
                        <div className="text-xs text-[var(--text-muted)]">{a.advertiser} · {a.source}</div>
                        {a.adminNote && <div className="text-xs text-[#f5a524] mt-0.5">Note: {a.adminNote}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="tag tag-muted">{a.adType}</span>
                      </td>
                      <td className="px-4 py-3 text-[#2bd99f] font-semibold">${(a.rewardCents/100).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-[var(--text-secondary)]">${(spent/100).toFixed(2)} / ${(a.totalBudgetCents/100).toFixed(2)}</div>
                        <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                          <div className="h-full bg-gradient-to-r from-[#7c5cff] to-[#2bd99f]" style={{width:`${pct}%`}}/>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[a.status]}`}>{a.status.replace("_"," ")}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {a.status === "pending_review" && (
                            <>
                              <button onClick={() => updateStatus(a.id, "active")} className="btn btn-ghost text-xs text-[#2bd99f]">Approve</button>
                              <button onClick={() => { const note = prompt("Rejection reason?"); updateStatus(a.id, "rejected", note ?? ""); }} className="btn btn-ghost text-xs text-[var(--danger)]">Reject</button>
                            </>
                          )}
                          {a.status === "active" && <button onClick={() => updateStatus(a.id, "paused")} className="btn btn-ghost text-xs">Pause</button>}
                          {a.status === "paused" && <button onClick={() => updateStatus(a.id, "active")} className="btn btn-ghost text-xs text-[#2bd99f]">Resume</button>}
                          {a.status !== "ended" && <button onClick={() => updateStatus(a.id, "ended")} className="btn btn-ghost text-xs text-[var(--danger)]">End</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab({ users }: { users: User[] }) {
  const router = useRouter();
  const approveAdvertiser = async (id: number) => {
    await fetch("/api/admin/users", { method: "PATCH", headers: {"content-type":"application/json"}, body: JSON.stringify({ id, action: "approve_advertiser" }) });
    router.refresh();
  };
  return (
    <div className="glass-card overflow-hidden">
      <div className="border-b border-[var(--border-subtle)] px-5 py-3 text-xs uppercase tracking-widest text-[var(--text-muted)]">All users</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-elevated)] text-left text-xs uppercase tracking-widest text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Lifetime</th>
              <th className="px-4 py-3">Withdrawals</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-[var(--border-subtle)]">
                <td className="px-4 py-3">
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{u.email}</div>
                  {u.companyName && <div className="text-xs text-[#f5a524]">{u.companyName}</div>}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{u.country}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role==="admin"?"bg-[#7c5cff]/15 text-[#c8b8ff]":u.role==="advertiser"?"bg-[#f5a524]/15 text-[#f5a524]":"bg-white/5 text-[var(--text-muted)]"}`}>{u.role}</span>
                  {u.role === "advertiser" && !u.advertiserApproved && (
                    <button onClick={() => approveAdvertiser(u.id)} className="ml-1 text-[10px] text-[#2bd99f] underline hover:no-underline">Approve</button>
                  )}
                </td>
                <td className="px-4 py-3 text-[#2bd99f]">${(u.balanceCents/100).toFixed(2)}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">${(u.lifetimeEarningsCents/100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.withdrawalActivated?"bg-[#2bd99f]/15 text-[#2bd99f]":"bg-white/5 text-[var(--text-muted)]"}`}>
                    {u.withdrawalActivated?"Active":"Locked"}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Withdrawals Tab ──────────────────────────────────────────────────────────
function WithdrawalsTab({ withdrawals }: { withdrawals: Withdrawal[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number|null>(null);
  const updateStatus = async (id: number, status: string) => {
    setBusy(id);
    await fetch("/api/admin/withdrawals", { method: "PATCH", headers: {"content-type":"application/json"}, body: JSON.stringify({ id, status }) });
    router.refresh(); setBusy(null);
  };
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-elevated)] text-left text-xs uppercase tracking-widest text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map(w => (
              <tr key={w.id} className="border-t border-[var(--border-subtle)]">
                <td className="px-4 py-3"><div className="font-semibold">{w.userName}</div><div className="text-xs text-[var(--text-muted)]">{w.userEmail}</div></td>
                <td className="px-4 py-3 text-[#2bd99f] font-semibold">${(w.amountCents/100).toFixed(2)}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)] capitalize">{w.method.replace("_"," ")}</td>
                <td className="px-4 py-3 max-w-xs"><div className="truncate text-xs text-[var(--text-muted)]">{w.accountDetails}</div></td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${w.status==="pending"?"bg-[#f5a524]/15 text-[#f5a524]":w.status==="approved"?"bg-[#7c5cff]/15 text-[#c8b8ff]":w.status==="paid"?"bg-[#2bd99f]/15 text-[#2bd99f]":"bg-[var(--danger)]/15 text-[var(--danger)]"}`}>{w.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  {w.status==="pending"&&<div className="flex justify-end gap-1">
                    <button disabled={busy===w.id} onClick={()=>updateStatus(w.id,"approved")} className="btn btn-ghost text-xs text-[#c8b8ff]">Approve</button>
                    <button disabled={busy===w.id} onClick={()=>updateStatus(w.id,"paid")} className="btn btn-ghost text-xs text-[#2bd99f]">Mark paid</button>
                    <button disabled={busy===w.id} onClick={()=>updateStatus(w.id,"rejected")} className="btn btn-ghost text-xs text-[var(--danger)]">Reject</button>
                  </div>}
                  {w.status==="approved"&&<button disabled={busy===w.id} onClick={()=>updateStatus(w.id,"paid")} className="btn btn-ghost text-xs text-[#2bd99f]">Mark paid</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────
function PaymentsTab({ payments }: { payments: Payment[] }) {
  const router = useRouter();
  const markPaid = async (id: number) => {
    await fetch("/api/admin/payments", { method: "PATCH", headers: {"content-type":"application/json"}, body: JSON.stringify({ id, status: "paid" }) });
    router.refresh();
  };
  if (payments.length === 0) return <div className="glass-card p-12 text-center text-sm text-[var(--text-secondary)]">No advertiser payments yet.</div>;
  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-elevated)] text-left text-xs uppercase tracking-widest text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Advertiser</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id} className="border-t border-[var(--border-subtle)]">
                <td className="px-4 py-3"><div className="font-semibold">{p.userName}</div><div className="text-xs text-[var(--text-muted)]">{p.userEmail}</div></td>
                <td className="px-4 py-3 text-[#2bd99f] font-semibold">${(p.amountCents/100).toFixed(2)}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{p.paymentRef ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)] max-w-xs truncate">{p.note ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status==="paid"?"bg-[#2bd99f]/15 text-[#2bd99f]":p.status==="pending"?"bg-[#f5a524]/15 text-[#f5a524]":"bg-[var(--danger)]/15 text-[var(--danger)]"}`}>{p.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {p.status==="pending"&&<button onClick={()=>markPaid(p.id)} className="btn btn-ghost text-xs text-[#2bd99f]">Mark paid</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
