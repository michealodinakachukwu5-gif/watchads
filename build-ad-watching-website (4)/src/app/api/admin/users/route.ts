import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, adViews, withdrawals } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { requireAdmin, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireAdmin(); } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }

  const rows = await db.select({
    id: users.id, email: users.email, name: users.name, role: users.role,
    country: users.country, balanceCents: users.balanceCents,
    lifetimeEarningsCents: users.lifetimeEarningsCents,
    withdrawalActivated: users.withdrawalActivated,
    companyName: users.companyName, advertiserApproved: users.advertiserApproved,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt));

  const [{ userCount }] = await db.select({ userCount: sql<number>`count(*)::int` }).from(users);
  const [{ adCount }] = await db.select({ adCount: sql<number>`count(*)::int` }).from(adViews);
  const [{ totalRewards }] = await db.select({ totalRewards: sql<number>`COALESCE(SUM(${adViews.rewardCents}),0)::int` }).from(adViews).where(eq(adViews.status,"completed"));
  const [{ pendingWithdrawals }] = await db.select({ pendingWithdrawals: sql<number>`COALESCE(SUM(${withdrawals.amountCents}),0)::int` }).from(withdrawals).where(eq(withdrawals.status,"pending"));

  return Response.json({ users: rows, stats: { userCount, adCount, totalRewards, pendingWithdrawals } });
}

export async function PATCH(req: NextRequest) {
  try { await requireAdmin(); } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { id, action } = body as { id?: number; action?: string };
  if (!id || !action) return Response.json({ error: "Missing id or action" }, { status: 400 });

  if (action === "approve_advertiser") {
    const [updated] = await db.update(users).set({ advertiserApproved: true }).where(eq(users.id, id)).returning({ id: users.id });
    return Response.json({ ok: true, user: updated });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
