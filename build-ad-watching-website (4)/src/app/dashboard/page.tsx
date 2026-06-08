import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { ads, adViews } from "@/db/schema";
import { and, eq, gt, sql, desc } from "drizzle-orm";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdGrid } from "@/components/AdGrid";
import { formatCents, formatDuration } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  if (user.role === "advertiser") redirect("/advertiser");

  const rows = await db.select({
    id: ads.id, title: ads.title, description: ads.description,
    advertiser: ads.advertiser, category: ads.category, adType: ads.adType,
    durationSeconds: ads.durationSeconds, rewardCents: ads.rewardCents,
    videoUrl: ads.videoUrl, thumbnailUrl: ads.thumbnailUrl,
    maxViewsPerUser: ads.maxViewsPerUser, requiredWatchPercent: ads.requiredWatchPercent,
    remainingBudgetCents: ads.remainingBudgetCents, networkName: ads.networkName,
  }).from(ads)
    .where(and(eq(ads.status, "active"), gt(ads.remainingBudgetCents, 0)))
    .orderBy(desc(ads.rewardCents));

  const completedCounts = await db.select({ adId: adViews.adId, count: sql<number>`count(*)::int` })
    .from(adViews).where(and(eq(adViews.userId, user.id), eq(adViews.status, "completed"))).groupBy(adViews.adId);
  const countMap = new Map(completedCounts.map(c => [c.adId, c.count]));

  const availableAds = rows.map(ad => {
    const completedByUser = countMap.get(ad.id) ?? 0;
    const remainingForUser = ad.maxViewsPerUser > 0 ? Math.max(0, ad.maxViewsPerUser - completedByUser) : null;
    return { ...ad, completedByUser, remainingForUser };
  }).filter(ad => ad.remainingForUser === null || ad.remainingForUser > 0);

  const [{ totalEarned }] = await db.select({ totalEarned: sql<number>`COALESCE(SUM(${adViews.rewardCents}),0)::int` })
    .from(adViews).where(sql`${adViews.userId}=${user.id} AND ${adViews.status}='completed'`);
  const [{ totalWatched }] = await db.select({ totalWatched: sql<number>`COALESCE(SUM(${adViews.watchedSeconds}),0)::int` })
    .from(adViews).where(eq(adViews.userId, user.id));
  const [{ completedCount }] = await db.select({ completedCount: sql<number>`count(*)::int` })
    .from(adViews).where(sql`${adViews.userId}=${user.id} AND ${adViews.status}='completed'`);

  const me = { id: user.id, name: user.name, email: user.email, role: user.role, country: user.country, balanceCents: user.balanceCents, lifetimeEarningsCents: user.lifetimeEarningsCents, withdrawalActivated: user.withdrawalActivated };

  return (
    <div className="min-h-screen">
      <SiteHeader initialUser={me} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Greeting */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Hey, {user.name.split(" ")[0]} 👋</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Pick an ad below and watch it fully to earn your reward.</p>
          </div>
          <Link href="/withdraw" className="btn btn-success text-sm">💸 Withdraw earnings</Link>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            { label: "Available balance", value: formatCents(user.balanceCents), sub: "Ready to withdraw", green: true },
            { label: "Lifetime earnings", value: formatCents(user.lifetimeEarningsCents), sub: `${completedCount} completed views` },
            { label: "Time watched", value: formatDuration(totalWatched), sub: "Across all ads" },
            { label: "Ads available", value: String(availableAds.length), sub: "Ready to watch now", purple: true },
          ].map(s => (
            <div key={s.label} className="glass-card p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{s.label}</div>
              <div className={`mt-2 text-2xl font-extrabold ${s.green ? "text-[var(--success)]" : s.purple ? "text-[#c0aaff]" : "text-white"}`}>{s.value}</div>
              <div className="mt-0.5 text-xs text-[var(--text-muted)]">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Ad types info strip */}
        <div className="mb-6 flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">🎬 <span>MP4 ads</span></div>
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">▶️ <span>YouTube ads</span></div>
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">📡 <span>Network ads</span></div>
          <div className="ml-auto text-xs text-[var(--text-muted)] self-center">All formats pay equally per completed view</div>
        </div>

        <AdGrid ads={availableAds} emptyMessage="No ads available right now — check back soon! 🎬" />
      </main>
      <SiteFooter />
    </div>
  );
}
