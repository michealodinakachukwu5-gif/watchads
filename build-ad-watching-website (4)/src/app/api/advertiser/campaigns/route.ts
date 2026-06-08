import { NextRequest } from "next/server";
import { db } from "@/db";
import { ads, advertiserPayments } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { requireUser, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  let user;
  try { user = await requireUser(); } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
  if (user.role !== "advertiser" && user.role !== "admin") {
    return Response.json({ error: "Advertiser access required" }, { status: 403 });
  }

  const myCampaigns = await db.select().from(ads)
    .where(eq(ads.advertiserId, user.id)).orderBy(desc(ads.createdAt));

  const myPayments = await db.select().from(advertiserPayments)
    .where(eq(advertiserPayments.advertiserId, user.id)).orderBy(desc(advertiserPayments.createdAt));

  // Per-campaign view counts
  const viewCounts = await db.select({
    adId: sql<number>`ad_id`,
    completedViews: sql<number>`count(*)::int`,
    totalSpentCents: sql<number>`COALESCE(SUM(reward_cents),0)::int`,
  }).from(sql`ad_views`).where(sql`status = 'completed'`).groupBy(sql`ad_id`);

  const viewMap = new Map(viewCounts.map(v => [v.adId, v]));

  const campaigns = myCampaigns.map(c => ({
    ...c,
    completedViews: viewMap.get(c.id)?.completedViews ?? 0,
    totalSpentCents: viewMap.get(c.id)?.totalSpentCents ?? 0,
  }));

  return Response.json({ campaigns, payments: myPayments });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
  if (user.role !== "advertiser" && user.role !== "admin") {
    return Response.json({ error: "Advertiser access required" }, { status: 403 });
  }
  if (!user.advertiserApproved && user.role !== "admin") {
    return Response.json({ error: "Your advertiser account is pending approval. We will notify you within 24 hours." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { title, description, category, adType, videoUrl, thumbnailUrl,
    durationSeconds, rewardCents, maxViewsPerUser, totalBudgetCents,
    networkName, networkZoneId } = body as Record<string, unknown>;

  if (!title || !description || !videoUrl || !durationSeconds || !rewardCents) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (Number(totalBudgetCents) < 5000) {
    return Response.json({ error: "Minimum budget is $50.00" }, { status: 400 });
  }

  const budget = Number(totalBudgetCents);
  const [created] = await db.insert(ads).values({
    advertiserId: user.id,
    title: String(title), description: String(description),
    advertiser: user.companyName ?? user.name,
    category: String(category || "General"),
    adType: (adType as "mp4"|"youtube"|"network") || "mp4",
    videoUrl: String(videoUrl),
    thumbnailUrl: thumbnailUrl ? String(thumbnailUrl) : null,
    durationSeconds: Number(durationSeconds),
    rewardCents: Number(rewardCents),
    requiredWatchPercent: 95,
    maxViewsPerUser: Number(maxViewsPerUser) || 1,
    totalBudgetCents: budget, remainingBudgetCents: 0, // 0 until payment confirmed
    networkName: networkName ? String(networkName) : null,
    networkZoneId: networkZoneId ? String(networkZoneId) : null,
    status: "pending_review", source: "advertiser",
  }).returning();

  // Create a pending payment record
  const [payment] = await db.insert(advertiserPayments).values({
    advertiserId: user.id,
    adId: created?.id,
    amountCents: budget,
    status: "pending",
    note: `Budget for campaign: ${title}`,
  }).returning();

  return Response.json({ campaign: created, payment });
}
