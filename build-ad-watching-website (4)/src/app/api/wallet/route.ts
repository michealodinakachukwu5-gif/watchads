import { db } from "@/db";
import { adViews, users, withdrawals } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
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

  const [{ totalEarnedCents }] = await db
    .select({ totalEarnedCents: sql<number>`COALESCE(SUM(${adViews.rewardCents}), 0)::int` })
    .from(adViews)
    .where(
      sql`${adViews.userId} = ${user.id} AND ${adViews.status} = 'completed'`,
    );

  const [{ totalWithdrawnCents }] = await db
    .select({
      totalWithdrawnCents: sql<number>`COALESCE(SUM(${withdrawals.amountCents}), 0)::int`,
    })
    .from(withdrawals)
    .where(
      sql`${withdrawals.userId} = ${user.id} AND ${withdrawals.status} IN ('pending','approved','paid')`,
    );

  const recentWithdrawals = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.userId, user.id))
    .orderBy(desc(withdrawals.createdAt))
    .limit(5);

  return Response.json({
    wallet: {
      balanceCents: user.balanceCents,
      lifetimeEarningsCents: user.lifetimeEarningsCents,
      totalEarnedCents,
      totalWithdrawnCents,
    },
    recentWithdrawals,
  });
}

// Avoid unused warning
void users;
