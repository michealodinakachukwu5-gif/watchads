import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { requireUser, AuthError } from "@/lib/auth";

const ACTIVATION_FEE_CENTS = 500; // $5.00

export const dynamic = "force-dynamic";

export async function POST() {
  let user;
  try { user = await requireUser(); } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }

  if (user.withdrawalActivated) {
    return Response.json({ error: "Your withdrawals are already activated." }, { status: 400 });
  }

  if (user.balanceCents < ACTIVATION_FEE_CENTS) {
    return Response.json({
      error: `You need at least $5.00 to activate withdrawals. Your current balance is $${(user.balanceCents / 100).toFixed(2)}.`,
    }, { status: 400 });
  }

  const [updated] = await db.update(users)
    .set({
      balanceCents: sql`${users.balanceCents} - ${ACTIVATION_FEE_CENTS}`,
      withdrawalActivated: true,
    })
    .where(sql`${users.id} = ${user.id} AND ${users.balanceCents} >= ${ACTIVATION_FEE_CENTS}`)
    .returning({ balanceCents: users.balanceCents, withdrawalActivated: users.withdrawalActivated });

  if (!updated) {
    return Response.json({ error: "Insufficient balance." }, { status: 400 });
  }

  return Response.json({ ok: true, balanceCents: updated.balanceCents, withdrawalActivated: true });
}
