import { NextRequest } from "next/server";
import { db } from "@/db";
import { ads, adViews, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { completeAdSchema } from "@/lib/validation";
import { requireUser, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = completeAdSchema.safeParse(body);
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

  const [view] = await db
    .select()
    .from(adViews)
    .where(
      and(
        eq(adViews.adId, adId),
        eq(adViews.userId, user.id),
        eq(adViews.sessionToken, parsed.data.sessionToken),
      ),
    )
    .limit(1);

  if (!view) {
    return Response.json(
      { error: "No active session for this ad" },
      { status: 404 },
    );
  }

  if (view.status === "completed") {
    return Response.json(
      { error: "This ad view was already completed" },
      { status: 409 },
    );
  }
  if (view.status === "abandoned") {
    return Response.json(
      { error: "This watch session was cancelled. Please start again." },
      { status: 410 },
    );
  }

  // Server-side validation of watch time
  const now = new Date();
  if (now < view.expiresAt) {
    return Response.json(
      {
        error: `Please watch the full ad (${ad.durationSeconds}s) before claiming the reward.`,
      },
      { status: 400 },
    );
  }

  // The required watch time must have actually elapsed since the session
  // started. This makes it impossible to claim the reward early even with
  // fabricated heartbeats.
  const elapsedSeconds =
    (now.getTime() - view.startedAt.getTime()) / 1000;
  const requiredSeconds = Math.ceil(
    (ad.durationSeconds * ad.requiredWatchPercent) / 100,
  );
  if (elapsedSeconds < requiredSeconds) {
    return Response.json(
      {
        error: `You must wait at least ${ad.requiredWatchPercent}% of the ad duration before claiming the reward.`,
      },
      { status: 400 },
    );
  }

  if (view.watchedSeconds < requiredSeconds) {
    return Response.json(
      {
        error: `You must watch at least ${ad.requiredWatchPercent}% of the ad to earn the reward.`,
      },
      { status: 400 },
    );
  }

  // Atomically update the view, deduct budget, and credit the user
  const reward = view.rewardCents;
  if (ad.remainingBudgetCents < reward) {
    return Response.json(
      { error: "This ad no longer has enough budget" },
      { status: 410 },
    );
  }

  const updatedView = await db
    .update(adViews)
    .set({ status: "completed", completedAt: now })
    .where(and(eq(adViews.id, view.id), eq(adViews.status, "in_progress")))
    .returning({ id: adViews.id });

  if (updatedView.length === 0) {
    return Response.json(
      { error: "This watch session was already finalized" },
      { status: 409 },
    );
  }

  await db
    .update(ads)
    .set({ remainingBudgetCents: sql`${ads.remainingBudgetCents} - ${reward}` })
    .where(eq(ads.id, ad.id));

  const [updatedUser] = await db
    .update(users)
    .set({
      balanceCents: sql`${users.balanceCents} + ${reward}`,
      lifetimeEarningsCents: sql`${users.lifetimeEarningsCents} + ${reward}`,
    })
    .where(eq(users.id, user.id))
    .returning({
      balanceCents: users.balanceCents,
      lifetimeEarningsCents: users.lifetimeEarningsCents,
    });

  return Response.json({
    ok: true,
    rewardCents: reward,
    balanceCents: updatedUser?.balanceCents ?? user.balanceCents + reward,
    lifetimeEarningsCents:
      updatedUser?.lifetimeEarningsCents ?? user.lifetimeEarningsCents + reward,
  });
}
