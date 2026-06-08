import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { adViews, ads } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatCents, formatDate, formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  completed: {
    label: "Completed",
    className: "bg-[#2bd99f]/15 text-[#2bd99f]",
  },
  in_progress: {
    label: "In progress",
    className: "bg-[#f5a524]/15 text-[#f5a524]",
  },
  abandoned: {
    label: "Abandoned",
    className: "bg-white/5 text-[var(--text-muted)]",
  },
};

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/history");
  }

  const rows = await db
    .select({
      id: adViews.id,
      adId: adViews.adId,
      adTitle: ads.title,
      advertiser: ads.advertiser,
      category: ads.category,
      rewardCents: adViews.rewardCents,
      watchedSeconds: adViews.watchedSeconds,
      durationSeconds: ads.durationSeconds,
      status: adViews.status,
      startedAt: adViews.startedAt,
      completedAt: adViews.completedAt,
    })
    .from(adViews)
    .innerJoin(ads, eq(adViews.adId, ads.id))
    .where(eq(adViews.userId, user.id))
    .orderBy(desc(adViews.startedAt))
    .limit(200);

  const [{ totalEarnedCents }] = await db
    .select({
      totalEarnedCents: sql<number>`COALESCE(SUM(${adViews.rewardCents}), 0)::int`,
    })
    .from(adViews)
    .where(
      sql`${adViews.userId} = ${user.id} AND ${adViews.status} = 'completed'`,
    );
  const [{ totalWatchedSeconds }] = await db
    .select({
      totalWatchedSeconds: sql<number>`COALESCE(SUM(${adViews.watchedSeconds}), 0)::int`,
    })
    .from(adViews)
    .where(eq(adViews.userId, user.id));
  const [{ completedCount }] = await db
    .select({ completedCount: sql<number>`count(*)::int` })
    .from(adViews)
    .where(
      sql`${adViews.userId} = ${user.id} AND ${adViews.status} = 'completed'`,
    );

  const me = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    balanceCents: user.balanceCents,
    lifetimeEarningsCents: user.lifetimeEarningsCents,
  };

  // Group by date for the timeline
  const grouped = new Map<
    string,
    Array<{
      id: number;
      adTitle: string;
      advertiser: string;
      rewardCents: number;
      watchedSeconds: number;
      durationSeconds: number;
      status: string;
      startedAt: Date;
      completedAt: Date | null;
    }>
  >();
  for (const r of rows) {
    const key = new Date(r.startedAt).toDateString();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader initialUser={me} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Earnings history</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Track every ad you&apos;ve watched and the rewards you&apos;ve earned.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Total earned" value={formatCents(totalEarnedCents)} />
          <Stat
            label="Ads completed"
            value={String(completedCount)}
            sub={`${rows.length - completedCount} in progress or abandoned`}
          />
          <Stat
            label="Time watched"
            value={formatDuration(totalWatchedSeconds)}
            sub="Across all ads"
          />
        </div>

        <div className="glass-card mt-8 overflow-hidden">
          <div className="border-b border-[var(--border-subtle)] px-5 py-3 text-xs uppercase tracking-widest text-[var(--text-muted)]">
            Recent activity
          </div>
          {rows.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--text-secondary)]">
              <div className="text-3xl">📺</div>
              <p className="mt-3">
                You haven&apos;t watched any ads yet.{" "}
                <a
                  href="/dashboard"
                  className="font-semibold text-[#c8b8ff] hover:underline"
                >
                  Browse ads
                </a>{" "}
                to start earning.
              </p>
            </div>
          ) : (
            <div>
              {Array.from(grouped.entries()).map(([date, items]) => (
                <div key={date}>
                  <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <ul>
                    {items.map((r) => {
                      const statusInfo = STATUS_LABEL[r.status] ?? {
                        label: r.status,
                        className: "bg-white/5 text-[var(--text-muted)]",
                      };
                      return (
                        <li
                          key={r.id}
                          className="flex flex-col gap-2 border-b border-[var(--border-subtle)] px-5 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {r.adTitle}
                            </div>
                            <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                              {r.advertiser} ·{" "}
                              {formatDuration(r.watchedSeconds)} watched of{" "}
                              {formatDuration(r.durationSeconds)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.className}`}
                            >
                              {statusInfo.label}
                            </span>
                            <span className="text-sm font-bold text-[#2bd99f]">
                              {r.status === "completed"
                                ? `+${formatCents(r.rewardCents)}`
                                : "—"}
                            </span>
                            <span className="hidden text-xs text-[var(--text-muted)] sm:inline">
                              {formatDate(r.completedAt ?? r.startedAt)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-[var(--text-muted)]">{sub}</div>}
    </div>
  );
}
