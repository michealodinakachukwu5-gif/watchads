import { NextRequest } from "next/server";
import { db } from "@/db";
import { ads, adViews } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { startAdSchema } from "@/lib/validation";
import { requireUser, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

function randomToken(): string {
  // 32 random bytes -> hex string
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const { id } = await ctx.params;
  const adId = Number.parseInt(id, 10);
  if (!Number.isFinite(adId) || adId <= 0) {
    return Response.json({ error: "Invalid ad id" }, { status: 400 });
  }

  const parsed = startAdSchema.safeParse({ adId });
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const [ad] = await db
    .select()
    .from(ads)
    .where(eq(ads.id, adId))
    .limit(1);

  if (!ad) {
    return Response.json({ error: "Ad not found" }, { status: 404 });
  }
  if (ad.status !== "active") {
    return Response.json(
      { error: "This ad is no longer available" },
      { status: 410 },
    );
  }
  if (ad.remainingBudgetCents < ad.rewardCents) {
    return Response.json(
      { error: "This ad has run out of budget" },
      { status: 410 },
    );
  }

  // Per-user view limit
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
      return Response.json(
        { error: "You have already watched this ad the maximum number of times" },
        { status: 403 },
      );
    }
  }

  // Abort any previous in_progress sessions for this user/ad to avoid farming
  await db
    .update(adViews)
    .set({ status: "abandoned" })
    .where(
      and(
        eq(adViews.userId, user.id),
        eq(adViews.adId, ad.id),
        eq(adViews.status, "in_progress"),
      ),
    );

  const sessionToken = randomToken();
  const startedAt = new Date();
  // Allow a small grace period for clock skew and network latency
  const expiresAt = new Date(
    startedAt.getTime() + ad.durationSeconds * 1000 + 5 * 1000,
  );

  const [created] = await db
    .insert(adViews)
    .values({
      userId: user.id,
      adId: ad.id,
      sessionToken,
      rewardCents: ad.rewardCents,
      startedAt,
      expiresAt,
      status: "in_progress",
    })
    .returning();

  return Response.json({
    session: {
      token: created?.sessionToken,
      adId: ad.id,
      rewardCents: ad.rewardCents,
      durationSeconds: ad.durationSeconds,
      requiredWatchPercent: ad.requiredWatchPercent,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  });
}

// Suppress unused import warning during dev
void desc;
