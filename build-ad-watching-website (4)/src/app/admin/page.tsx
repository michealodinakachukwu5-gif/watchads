import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { ads, users, adViews, withdrawals, advertiserPayments } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AdminDashboard } from "@/components/AdminDashboard";
import { formatCentsPlain } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen">
        <SiteHeader initialUser={{ id: user.id, name: user.name, email: user.email, role: user.role, country: user.country, balanceCents: user.balanceCents, lifetimeEarningsCents: user.lifetimeEarningsCents, withdrawalActivated: user.withdrawalActivated }} />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <div className="glass-card p-8">
            <h1 className="text-2xl font-bold">Admin access only</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">This area is reserved for site administrators.</p>
            <a href="/dashboard" className="btn btn-primary mt-6">Back to dashboard</a>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const allAds = await db.select().from(ads).orderBy(desc(ads.createdAt));
  const allUsers = await db.select({
    id: users.id, email: users.email, name: users.name,
    role: users.role, country: users.country,
    balanceCents: users.balanceCents, lifetimeEarningsCents: users.lifetimeEarningsCents,
    withdrawalActivated: users.withdrawalActivated,
    companyName: users.companyName, advertiserApproved: users.advertiserApproved,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt));

  const allWithdrawals = await db.select({
    id: withdrawals.id, amountCents: withdrawals.amountCents,
    method: withdrawals.method, accountDetails: withdrawals.accountDetails,
    status: withdrawals.status, note: withdrawals.note,
    createdAt: withdrawals.createdAt, processedAt: withdrawals.processedAt,
    userId: users.id, userEmail: users.email, userName: users.name,
  }).from(withdrawals).innerJoin(users, eq(withdrawals.userId, users.id)).orderBy(desc(withdrawals.createdAt));

  const allPayments = await db.select({
    id: advertiserPayments.id, amountCents: advertiserPayments.amountCents,
    status: advertiserPayments.status, paymentRef: advertiserPayments.paymentRef,
    note: advertiserPayments.note, createdAt: advertiserPayments.createdAt,
    adId: advertiserPayments.adId, advertiserId: advertiserPayments.advertiserId,
    userName: users.name, userEmail: users.email,
  }).from(advertiserPayments).innerJoin(users, eq(advertiserPayments.advertiserId, users.id)).orderBy(desc(advertiserPayments.createdAt));

  const [{ userCount }] = await db.select({ userCount: sql<number>`count(*)::int` }).from(users);
  const [{ viewCount }] = await db.select({ viewCount: sql<number>`count(*)::int` }).from(adViews);
  const [{ totalRewards }] = await db.select({ totalRewards: sql<number>`COALESCE(SUM(${adViews.rewardCents}),0)::int` }).from(adViews).where(eq(adViews.status, "completed"));
  const [{ pendingWithdrawals }] = await db.select({ pendingWithdrawals: sql<number>`COALESCE(SUM(${withdrawals.amountCents}),0)::int` }).from(withdrawals).where(eq(withdrawals.status, "pending"));
  const [{ pendingAds }] = await db.select({ pendingAds: sql<number>`count(*)::int` }).from(ads).where(eq(ads.status, "pending_review"));

  const me = { id: user.id, name: user.name, email: user.email, role: user.role as "admin", country: user.country, balanceCents: user.balanceCents, lifetimeEarningsCents: user.lifetimeEarningsCents, withdrawalActivated: user.withdrawalActivated };

  return (
    <div className="min-h-screen">
      <SiteHeader initialUser={me} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin console</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage ads, advertisers, users and withdrawals.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/admin/networks" className="btn btn-primary">📡 Ad Networks (12+)</a>
            <span className="tag self-center">ADMIN</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total users", value: String(userCount) },
            { label: "Ad views", value: String(viewCount) },
            { label: "Rewards paid", value: `$${formatCentsPlain(totalRewards)}` },
            { label: "Pending withdrawals", value: `$${formatCentsPlain(pendingWithdrawals)}`, warn: pendingWithdrawals > 0 },
            { label: "Ads pending review", value: String(pendingAds), warn: pendingAds > 0 },
          ].map((s) => (
            <div key={s.label} className="glass-card p-5">
              <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">{s.label}</div>
              <div className={`mt-2 text-2xl font-extrabold ${s.warn ? "text-[#f5a524]" : "text-white"}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <AdminDashboard
          ads={allAds.map(a => ({ ...a, createdAt: a.createdAt.toISOString() }))}
          users={allUsers.map(u => ({ ...u, createdAt: u.createdAt.toISOString() }))}
          withdrawals={allWithdrawals.map(w => ({ ...w, createdAt: w.createdAt.toISOString(), processedAt: w.processedAt?.toISOString() ?? null }))}
          payments={allPayments.map(p => ({ ...p, createdAt: p.createdAt.toISOString() }))}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
