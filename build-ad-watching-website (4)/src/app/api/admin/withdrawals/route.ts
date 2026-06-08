import { NextRequest } from "next/server";
import { db } from "@/db";
import { withdrawals, users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { requireAdmin, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  const rows = await db
    .select({
      id: withdrawals.id,
      amountCents: withdrawals.amountCents,
      method: withdrawals.method,
      accountDetails: withdrawals.accountDetails,
      status: withdrawals.status,
      note: withdrawals.note,
      createdAt: withdrawals.createdAt,
      processedAt: withdrawals.processedAt,
      userId: users.id,
      userEmail: users.email,
      userName: users.name,
    })
    .from(withdrawals)
    .innerJoin(users, eq(withdrawals.userId, users.id))
    .orderBy(desc(withdrawals.createdAt));

  return Response.json({ withdrawals: rows });
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
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

  const { id, status, note } = body as {
    id?: number;
    status?: string;
    note?: string;
  };
  if (!id || !["approved", "rejected", "paid"].includes(status ?? "")) {
    return Response.json(
      { error: "Invalid id or status" },
      { status: 400 },
    );
  }

  // If rejecting, refund the user
  if (status === "rejected") {
    const [w] = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, id))
      .limit(1);
    if (w && w.status === "pending") {
      await db
        .update(users)
        .set({
          balanceCents: sql`${users.balanceCents} + ${w.amountCents}`,
        })
        .where(eq(users.id, w.userId));
    }
  }

  const [updated] = await db
    .update(withdrawals)
    .set({
      status: status as "approved" | "rejected" | "paid",
      note: note ?? null,
      processedAt: new Date(),
    })
    .where(eq(withdrawals.id, id))
    .returning();

  return Response.json({ withdrawal: updated });
}
