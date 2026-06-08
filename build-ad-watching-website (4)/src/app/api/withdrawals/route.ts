import { NextRequest } from "next/server";
import { db } from "@/db";
import { withdrawals, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { withdrawalSchema } from "@/lib/validation";
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
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.userId, user.id))
    .orderBy(desc(withdrawals.createdAt));

  return Response.json({ withdrawals: rows });
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    if (e instanceof AuthError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = withdrawalSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { amountCents, method, accountDetails } = parsed.data;

  if (amountCents > user.balanceCents) {
    return Response.json(
      { error: "You do not have enough balance for this withdrawal" },
      { status: 400 },
    );
  }

  // Atomically deduct the balance with a guarded UPDATE so we cannot over-draw
  const deducted = await db
    .update(users)
    .set({
      balanceCents: sql`${users.balanceCents} - ${amountCents}`,
    })
    .where(sql`${users.id} = ${user.id} AND ${users.balanceCents} >= ${amountCents}`)
    .returning({ balanceCents: users.balanceCents });

  if (deducted.length === 0) {
    return Response.json(
      { error: "Insufficient balance" },
      { status: 400 },
    );
  }

  try {
    const [created] = await db
      .insert(withdrawals)
      .values({
        userId: user.id,
        amountCents,
        method,
        accountDetails,
      })
      .returning();

    return Response.json({
      withdrawal: created,
      balanceCents: deducted[0]?.balanceCents,
    });
  } catch (err) {
    // Refund the user if insert fails
    await db
      .update(users)
      .set({
        balanceCents: sql`${users.balanceCents} + ${amountCents}`,
      })
      .where(eq(users.id, user.id));
    console.error("Withdrawal insert failed", err);
    return Response.json(
      { error: "Failed to create withdrawal" },
      { status: 500 },
    );
  }
}
