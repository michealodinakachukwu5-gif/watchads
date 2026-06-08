import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { ads, advertiserPayments, adViews } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import Link from "next/link";
import { formatCents, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  pending_review: { label: "Pending review", cls: "bg-[#f5a524]/15 text-[#f5a524]" },
  active: { label: "Active ✓", cls: "bg-[#2bd99f]/15 text-[#2bd99f]" },
  paused: { label: "Paused", cls: "bg-white/10 text-[var(--text-secondary)]" },
  ended: { label: "Ended", cls: "bg-white/5 text-[var(--text-muted)]" },
  rejected: { label: "Rejected", cls: "bg-[var(--danger)]/15 text-[var(--danger)]" },
};

export default async function AdvertiserDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/advertiser");
  if (user.role !== "advertiser" && user.role !== "admin") redirect("/dashboard");

  const myCampaigns = await db.select().from(ads).where(eq(ads.advertiserId, user.id)).orderBy(desc(ads.createdAt));
  const myPayments = await db.select().from(advertiserPayments).where(eq(advertiserPayments.advertiserId, user.id)).orderBy(desc(advertiserPayments.createdAt));

  // View counts per campaign
  const viewStats = await db.select({
    adId: adViews.adId,
    completedViews: sql<number>`count(*)::int`,
    totalSpentCents: sql<number>`COALESCE(SUM(${adViews.rewardCents}),0)::int`,
  }).from(adViews).where(eq(adViews.status, "completed")).groupBy(adViews.adId);
  const viewMap = new Map(viewStats.map(v => [v.adId, v]));

  const totalBudget = myCampaigns.reduce((s, c) => s + c.totalBudgetCents, 0);
  const totalSpent = myCampaigns.reduce((s, c) => s + (viewMap.get(c.id)?.totalSpentCents ?? 0), 0);
  const totalViews = myCampaigns.reduce((s, c) => s + (viewMap.get(c.id)?.completedViews ?? 0), 0);
  const activeCampaigns = myCampaigns.filter(c => c.status === "active").length;

  const me = { id: user.id, name: user.name, email: user.email, role: user.role, country: user.country, balanceCents: user.balanceCents, lifetimeEarningsCents: user.lifetimeEarningsCents, withdrawalActivated: user.withdrawalActivated, companyName: user.companyName, advertiserApproved: user.advertiserApproved };

  return (
    <div className="min-h-screen">
      <SiteHeader initialUser={me} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">My campaigns</h1>
            {user.companyName && <p className="mt-1 text-sm text-[var(--text-secondary)]">{user.companyName}</p>}
            {!user.advertiserApproved && (
              <div className="mt-3 rounded-xl border border-[#f5a524]/30 bg-[#f5a524]/10 px-4 py-3 text-sm text-[#f5a524]">
                ⏳ Your advertiser account is pending admin approval. You can create campaigns but they won't go live until approved.
              </div>
            )}
          </div>
          <Link href="/advertiser/new" className="btn btn-primary">+ New campaign</Link>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active campaigns", value: String(activeCampaigns) },
            { label: "Total campaigns", value: String(myCampaigns.length) },
            { label: "Completed views", value: String(totalViews) },
            { label: "Total budget", value: formatCents(totalBudget) },
          ].map(s => (
            <div key={s.label} className="glass-card p-5">
              <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{s.label}</div>
              <div className="mt-2 text-2xl font-extrabold text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Campaigns */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold">All campaigns</h2>
          {myCampaigns.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-4xl">📢</div>
              <p className="mt-3 text-[var(--text-secondary)]">No campaigns yet.</p>
              <Link href="/advertiser/new" className="btn btn-primary mt-4">Create your first campaign</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myCampaigns.map(c => {
                const stats = viewMap.get(c.id);
                const views = stats?.completedViews ?? 0;
                const spent = stats?.totalSpentCents ?? 0;
                const pct = c.totalBudgetCents > 0 ? Math.round((c.remainingBudgetCents / c.totalBudgetCents) * 100) : 0;
                const info = STATUS_STYLE[c.status] ?? { label: c.status, cls: "" };
                return (
                  <div key={c.id} className="glass-card flex flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight">{c.title}</h3>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${info.cls}`}>{info.label}</span>
                    </div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">{c.category} · {c.adType.toUpperCase()} · {c.durationSeconds}s</div>
                    {c.adminNote && c.status === "rejected" && (
                      <div className="mt-2 rounded-lg bg-[var(--danger)]/10 px-2 py-1.5 text-xs text-[var(--danger)]">Rejection reason: {c.adminNote}</div>
                    )}
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Reward/view</span><span className="font-semibold text-[#2bd99f]">{formatCents(c.rewardCents)}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Completed views</span><span>{views.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Budget spent</span><span>{formatCents(spent)}</span></div>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs text-[var(--text-muted)]">
                        <span>Budget remaining</span><span>{pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                        <div className="h-full bg-gradient-to-r from-[#7c5cff] to-[#2bd99f]" style={{width:`${pct}%`}}/>
                      </div>
                      <div className="mt-1 text-xs text-[var(--text-muted)]">{formatCents(c.remainingBudgetCents)} of {formatCents(c.totalBudgetCents)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payments */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold">Payment history</h2>
          <div className="glass-card overflow-hidden">
            {myPayments.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[var(--text-secondary)]">No payments yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-elevated)] text-left text-xs uppercase tracking-widest text-[var(--text-muted)]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Note</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myPayments.map(p => (
                      <tr key={p.id} className="border-t border-[var(--border-subtle)]">
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(p.createdAt)}</td>
                        <td className="px-4 py-3 font-semibold text-[#2bd99f]">{formatCents(p.amountCents)}</td>
                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{p.paymentRef ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{p.note ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status==="paid"?"bg-[#2bd99f]/15 text-[#2bd99f]":p.status==="pending"?"bg-[#f5a524]/15 text-[#f5a524]":"bg-[var(--danger)]/15 text-[var(--danger)]"}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Payment instructions */}
        <div className="mt-6 glass-card p-5">
          <h3 className="font-semibold">How to pay for your campaign</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            After creating a campaign, a payment record is generated. Send your payment using one of the methods below
            and include your <strong>campaign ID</strong> as the reference. Admin will activate your campaign once payment is confirmed.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              { icon: "💸", method: "PayPal", detail: "payments@watchads.com" },
              { icon: "🪙", method: "Crypto (USDT TRC20)", detail: "TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
              { icon: "🏦", method: "Bank Transfer", detail: "Contact admin for bank details" },
            ].map(m => (
              <div key={m.method} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
                <div className="text-lg">{m.icon}</div>
                <div className="mt-1 text-sm font-semibold">{m.method}</div>
                <div className="text-xs text-[var(--text-muted)] break-all">{m.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Spent summary */}
        {totalSpent > 0 && (
          <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-secondary)]">
            Total ad spend so far: <strong className="text-white">{formatCents(totalSpent)}</strong>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
