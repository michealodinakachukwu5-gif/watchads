import { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const country = String(body.country ?? "United States").trim();
  const role = body.role === "advertiser" ? "advertiser" : "user";
  const companyName = body.companyName ? String(body.companyName).trim() : null;
  const companyWebsite = body.companyWebsite ? String(body.companyWebsite).trim() : null;

  if (!name || name.length < 2) return Response.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Please enter a valid email address" }, { status: 400 });
  if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  if (!country || country.length < 2) return Response.json({ error: "Please select your country" }, { status: 400 });

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) return Response.json({ error: "An account with that email already exists" }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const [created] = await db.insert(users).values({
    name, email, passwordHash, country, role,
    companyName, companyWebsite,
    advertiserApproved: false,
    withdrawalActivated: role === "advertiser",
  }).returning();

  if (!created) return Response.json({ error: "Failed to create account" }, { status: 500 });

  const token = await createSessionToken({ sub: created.id, email: created.email, role: created.role });
  await setSessionCookie(token);

  return Response.json({
    user: {
      id: created.id, name: created.name, email: created.email,
      role: created.role, country: created.country,
      balanceCents: created.balanceCents, lifetimeEarningsCents: created.lifetimeEarningsCents,
      withdrawalActivated: created.withdrawalActivated,
      companyName: created.companyName, advertiserApproved: created.advertiserApproved,
    },
  });
}
