import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AddNetworkAdForm } from "@/components/AddNetworkAdForm";
import { db } from "@/db";
import { ads } from "@/db/schema";
import { desc, not, eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { NETWORK_REGISTRY, type AdType } from "@/lib/adNetworks";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function NetworksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/networks");
  if (user.role !== "admin") redirect("/admin");

  // Fetch all network-type ads (not mp4 or youtube)
  const networkAds = await db.select().from(ads)
    .where(and(not(eq(ads.adType, "mp4")), not(eq(ads.adType, "youtube"))))
    .orderBy(desc(ads.createdAt));

  // Stats per network type
  const stats = await db.select({
    adType: ads.adType,
    count: sql<number>`count(*)::int`,
    totalBudget: sql<number>`COALESCE(SUM(${ads.totalBudgetCents}),0)::int`,
    remaining: sql<number>`COALESCE(SUM(${ads.remainingBudgetCents}),0)::int`,
  }).from(ads)
    .where(and(not(eq(ads.adType, "mp4")), not(eq(ads.adType, "youtube"))))
    .groupBy(ads.adType);

  const me = {
    id: user.id, name: user.name, email: user.email, role: user.role,
    country: user.country, balanceCents: user.balanceCents,
    lifetimeEarningsCents: user.lifetimeEarningsCents, withdrawalActivated: user.withdrawalActivated,
  };

  return (
    <div className="min-h-screen">
      <SiteHeader initialUser={me} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <a href="/admin" className="text-sm text-[var(--text-secondary)] hover:text-white">← Admin console</a>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Ad Networks</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Connect 12+ ad networks to earn revenue per view. Each network runs in an iframe while our reward timer tracks the viewer.
            </p>
          </div>
        </div>

        {/* Network directory */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold">📡 Supported networks ({NETWORK_REGISTRY.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NETWORK_REGISTRY.map(net => {
              const stat = stats.find(s => s.adType === net.key);
              const activeAdsCount = networkAds.filter(a => a.adType === net.key && a.status === "active").length;
              return (
                <div key={net.key} className="glass-card p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{net.icon}</span>
                      <div>
                        <div className="font-bold">{net.label}</div>
                        <div className="text-xs text-[var(--text-muted)]">CPM: {net.cpmRange}</div>
                      </div>
                    </div>
                    {activeAdsCount > 0 && (
                      <span className="tag tag-green shrink-0">{activeAdsCount} active</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{net.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {net.formats.map(f => (
                      <span key={f} className="rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">{f}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Min payout: {net.minPayout}</span>
                    {net.signupUrl && (
                      <a href={net.signupUrl} target="_blank" rel="noopener noreferrer"
                        className="font-semibold text-[#c0aaff] hover:underline">
                        Sign up →
                      </a>
                    )}
                  </div>
                  {stat && (
                    <div className="rounded-xl bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-muted)]">
                      {stat.count} ad{stat.count !== 1 ? "s" : ""} · {formatCents(stat.remaining)} remaining of {formatCents(stat.totalBudget)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* How-to guide */}
        <section className="glass-card mb-10 p-6">
          <h2 className="text-lg font-bold mb-4">📖 How to add a network ad (step-by-step)</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "1", title: "Sign up for the network", body: "Create a publisher account on your chosen network (e.g. monetag.com). Add your site domain." },
              { n: "2", title: "Create an ad zone", body: "In your network dashboard, create a new zone or placement. Choose Video, In-Page Push or Banner format." },
              { n: "3", title: "Copy the embed URL", body: "Get the direct embed URL, iframe src, or zone ID from your network dashboard. This is what you paste below." },
              { n: "4", title: "Add it here & set reward", body: "Paste the URL below. Set how much you pay viewers per completed watch. Set your total budget." },
            ].map(s => (
              <div key={s.n} className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-extrabold text-white">{s.n}</div>
                <div>
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="mt-1 text-xs text-[var(--text-secondary)]">{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add new network ad form */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold">➕ Add a network ad</h2>
          <AddNetworkAdForm />
        </section>

        {/* Existing network ads */}
        <section>
          <h2 className="mb-4 text-xl font-bold">
            Your network ads ({networkAds.length})
          </h2>
          {networkAds.length === 0 ? (
            <div className="glass-card p-12 text-center text-[var(--text-secondary)]">
              <div className="text-4xl mb-3">📡</div>
              <p>No network ads yet. Add your first one above.</p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-elevated)] text-left text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    <tr>
                      <th className="px-4 py-3">Ad / Network</th>
                      <th className="px-4 py-3">Reward</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Budget</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {networkAds.map(ad => {
                      const net = NETWORK_REGISTRY.find(n => n.key === ad.adType);
                      const spent = ad.totalBudgetCents - ad.remainingBudgetCents;
                      const pct = ad.totalBudgetCents > 0 ? Math.round((spent / ad.totalBudgetCents) * 100) : 0;
                      return (
                        <tr key={ad.id} className="border-t border-[var(--border-subtle)]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{net?.icon ?? "📡"}</span>
                              <div>
                                <div className="font-semibold">{ad.title}</div>
                                <div className="text-xs text-[var(--text-muted)]">{net?.label ?? ad.adType} · {ad.networkName}</div>
                                <div className="text-[10px] text-[var(--text-muted)] truncate max-w-xs">{ad.videoUrl}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-[var(--success)]">{formatCents(ad.rewardCents)}</td>
                          <td className="px-4 py-3 text-[var(--text-secondary)]">{ad.durationSeconds}s</td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-[var(--text-secondary)]">{formatCents(spent)} / {formatCents(ad.totalBudgetCents)}</div>
                            <div className="mt-1 progress-bar w-28">
                              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ad.status === "active" ? "bg-[var(--success)]/15 text-[var(--success)]" : ad.status === "paused" ? "bg-white/10 text-[var(--text-secondary)]" : "bg-[var(--danger)]/15 text-[var(--danger)]"}`}>
                              {ad.status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
