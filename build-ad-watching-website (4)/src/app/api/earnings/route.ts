import { db } from "@/db";
import { adViews, ads } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireUser, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const rows = await db
    .select({
      id: adViews.id,
      adId: adViews.adId,
      adTitle: ads.title,
      advertiser: ads.advertiser,
      rewardCents: adViews.rewardCents,
      watchedSeconds: adViews.watchedSeconds,
      durationSeconds: ads.durationSeconds,
      status: adViews.status,
      startedAt: adViews.startedAt,
      completedAt: adViews.completedAt,
    })
    .from(adViews)
    .innerJoin(ads, eq(adViews.adId, ads.id))
    .where(eq(adViews.userId, user.id))
    .orderBy(desc(adViews.startedAt))
    .limit(200);

  const [{ totalEarnedCents }] = await db
    .select({
      totalEarnedCents: sql<number>`COALESCE(SUM(${adViews.rewardCents}), 0)::int`,
    })
    .from(adViews)
    .where(
      sql`${adViews.userId} = ${user.id} AND ${adViews.status} = 'completed'`,
    );

  const [{ totalWatchedSeconds }] = await db
    .select({
      totalWatchedSeconds: sql<number>`COALESCE(SUM(${adViews.watchedSeconds}), 0)::int`,
    })
    .from(adViews)
    .where(eq(adViews.userId, user.id));

  return Response.json({
    views: rows,
    stats: {
      totalEarnedCents,
      totalWatchedSeconds,
      viewsCount: rows.length,
    },
  });
}
