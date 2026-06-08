import { NextRequest } from "next/server";
import { db } from "@/db";
import { advertiserPayments, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try { await requireAdmin(); } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const rows = await db.select({
    id: advertiserPayments.id, amountCents: advertiserPayments.amountCents,
    status: advertiserPayments.status, paymentRef: advertiserPayments.paymentRef,
    note: advertiserPayments.note, createdAt: advertiserPayments.createdAt,
    adId: advertiserPayments.adId, advertiserId: advertiserPayments.advertiserId,
    userName: users.name, userEmail: users.email,
  }).from(advertiserPayments)
    .innerJoin(users, eq(advertiserPayments.advertiserId, users.id))
    .orderBy(desc(advertiserPayments.createdAt));
  return Response.json({ payments: rows });
}

export async function PATCH(req: NextRequest) {
  try { await requireAdmin(); } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
    throw e;
  }
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { id, status } = body as { id?: number; status?: string };
  if (!id || !["paid","failed","refunded"].includes(status ?? "")) return Response.json({ error: "Invalid" }, { status: 400 });
  const [updated] = await db.update(advertiserPayments)
    .set({ status: status as "paid"|"failed"|"refunded" })
    .where(eq(advertiserPayments.id, id)).returning();
  return Response.json({ payment: updated });
}
