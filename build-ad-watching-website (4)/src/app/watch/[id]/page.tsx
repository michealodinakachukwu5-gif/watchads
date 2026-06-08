import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { ads, adViews } from "@/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WatchView } from "@/components/WatchView";

export const dynamic = "force-dynamic";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adId = Number.parseInt(id, 10);
  if (!Number.isFinite(adId) || adId <= 0) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=/watch/${adId}`);
  }

  const [ad] = await db
    .select()
    .from(ads)
    .where(eq(ads.id, adId))
    .limit(1);

  if (!ad) {
    notFound();
  }

  if (ad.status !== "active") {
    return (
      <div className="min-h-screen">
        <SiteHeader
          initialUser={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            balanceCents: user.balanceCents,
            lifetimeEarningsCents: user.lifetimeEarningsCents,
          }}
        />
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="glass-card p-8 text-center">
            <h1 className="text-2xl font-bold">This ad is no longer available</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              The advertiser paused or ended this campaign. Browse other ads
              from your dashboard.
            </p>
            <a href="/dashboard" className="btn btn-primary mt-6">
              Back to ads
            </a>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Check per-user view limit
  let userLimitReached = false;
  if (ad.maxViewsPerUser > 0) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adViews)
      .where(
        and(
          eq(adViews.userId, user.id),
          eq(adViews.adId, ad.id),
          eq(adViews.status, "completed"),
        ),
      );
    if (count >= ad.maxViewsPerUser) {
      userLimitReached = true;
    }
  }

  const me = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    balanceCents: user.balanceCents,
    lifetimeEarningsCents: user.lifetimeEarningsCents,
  };

  return (
    <div className="min-h-screen">
      <SiteHeader initialUser={me} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <WatchView
          ad={{
            id: ad.id,
            title: ad.title,
            advertiser: ad.advertiser,
            category: ad.category,
            description: ad.description,
            adType: ad.adType,
            videoUrl: ad.videoUrl,
            durationSeconds: ad.durationSeconds,
            rewardCents: ad.rewardCents,
            requiredWatchPercent: ad.requiredWatchPercent,
            maxViewsPerUser: ad.maxViewsPerUser,
            remainingBudgetCents: ad.remainingBudgetCents,
            networkName: ad.networkName,
          }}
          user={{
            id: user.id,
            balanceCents: user.balanceCents,
          }}
          userLimitReached={userLimitReached}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
