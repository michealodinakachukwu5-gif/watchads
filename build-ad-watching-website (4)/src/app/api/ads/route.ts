import { NextRequest } from "next/server";
import { db } from "@/db";
import { ads, adViews } from "@/db/schema";
import { and, eq, gt, sql, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category")?.trim();
  const search = searchParams.get("q")?.trim();

  const conditions = [eq(ads.status, "active"), gt(ads.remainingBudgetCents, 0)];
  if (category && category.toLowerCase() !== "all") conditions.push(eq(ads.category, category));
  if (search) conditions.push(sql`(${ads.title} ILIKE ${`%${search}%`} OR ${ads.advertiser} ILIKE ${`%${search}%`})`);

  const rows = await db.select({
    id: ads.id, title: ads.title, description: ads.description,
    advertiser: ads.advertiser, category: ads.category,
    adType: ads.adType, durationSeconds: ads.durationSeconds,
    rewardCents: ads.rewardCents, videoUrl: ads.videoUrl,
    thumbnailUrl: ads.thumbnailUrl, maxViewsPerUser: ads.maxViewsPerUser,
    requiredWatchPercent: ads.requiredWatchPercent,
    remainingBudgetCents: ads.remainingBudgetCents,
    networkName: ads.networkName,
  }).from(ads).where(and(...conditions)).orderBy(desc(ads.rewardCents));

  let userViewCounts = new Map<number, number>();
  if (user) {
    const counts = await db.select({ adId: adViews.adId, completedCount: sql<number>`count(*)::int` })
      .from(adViews).where(and(eq(adViews.userId, user.id), eq(adViews.status, "completed"))).groupBy(adViews.adId);
    for (const row of counts) userViewCounts.set(row.adId, row.completedCount);
  }

  const enriched = rows.map(ad => {
    const completedByUser = userViewCounts.get(ad.id) ?? 0;
    const remainingForUser = ad.maxViewsPerUser > 0 ? Math.max(0, ad.maxViewsPerUser - completedByUser) : null;
    return { ...ad, completedByUser, remainingForUser };
  }).filter(ad => ad.remainingForUser === null || ad.remainingForUser > 0);

  return Response.json({ ads: enriched });
}
