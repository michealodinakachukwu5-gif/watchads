import { NextRequest } from "next/server";
import { db } from "@/db";
import { adViews } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { heartbeatSchema } from "@/lib/validation";
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

  const parsed = heartbeatSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Heartbeat must be monotonic — keep the maximum watched seconds
  const result = await db
    .update(adViews)
    .set({
      watchedSeconds: sql`GREATEST(${adViews.watchedSeconds}, ${parsed.data.watchedSeconds})`,
    })
    .where(
      and(
        eq(adViews.adId, adId),
        eq(adViews.userId, user.id),
        eq(adViews.sessionToken, parsed.data.sessionToken),
        eq(adViews.status, "in_progress"),
      ),
    )
    .returning({ id: adViews.id, watchedSeconds: adViews.watchedSeconds });

  if (result.length === 0) {
    return Response.json(
      { error: "No active session for this ad" },
      { status: 404 },
    );
  }

  return Response.json({ ok: true, watchedSeconds: result[0]?.watchedSeconds });
}
