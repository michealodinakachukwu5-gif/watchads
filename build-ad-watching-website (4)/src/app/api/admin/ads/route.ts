import { NextRequest } from "next/server";
import { db } from "@/db";
import { ads } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireAdmin(); } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const rows = await db.select().from(ads).orderBy(desc(ads.createdAt));
  return Response.json({ ads: rows });
}

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { title, description, advertiser, category, adType, durationSeconds, rewardCents,
    videoUrl, thumbnailUrl, requiredWatchPercent, maxViewsPerUser, totalBudgetCents,
    networkName, networkZoneId } = body as Record<string, unknown>;

  if (!title || !description || !advertiser || !videoUrl || !durationSeconds || !rewardCents) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const budget = Number(totalBudgetCents) || 0;
  const [created] = await db.insert(ads).values({
    title: String(title), description: String(description),
    advertiser: String(advertiser), category: String(category || "General"),
    adType: (adType as "mp4" | "youtube" | "network") || "mp4",
    videoUrl: String(videoUrl),
    thumbnailUrl: thumbnailUrl ? String(thumbnailUrl) : null,
    durationSeconds: Number(durationSeconds), rewardCents: Number(rewardCents),
    requiredWatchPercent: Number(requiredWatchPercent) || 95,
    maxViewsPerUser: Number(maxViewsPerUser) || 0,
    totalBudgetCents: budget, remainingBudgetCents: budget,
    networkName: networkName ? String(networkName) : null,
    networkZoneId: networkZoneId ? String(networkZoneId) : null,
    status: "active", source: "admin",
  }).returning();

  return Response.json({ ad: created });
}

export async function PATCH(req: NextRequest) {
  try { await requireAdmin(); } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { id, status, adminNote } = body as { id?: number; status?: string; adminNote?: string };
  const validStatuses = ["active","paused","ended","rejected","pending_review"];
  if (!id || !validStatuses.includes(status ?? "")) return Response.json({ error: "Invalid id or status" }, { status: 400 });

  const [updated] = await db.update(ads)
    .set({ status: status as "active"|"paused"|"ended"|"rejected", adminNote: adminNote ?? null })
    .where(eq(ads.id, id)).returning();

  return Response.json({ ad: updated });
}
