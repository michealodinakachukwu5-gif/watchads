import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { withdrawals } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WithdrawForm } from "@/components/WithdrawForm";
import { formatCents, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const METHOD_LABEL: Record<string, string> = {
  paypal: "PayPal",
  bank: "Bank transfer",
  crypto: "Crypto (USDT-TRC20)",
  gift_card: "Gift card",
};

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-[#f5a524]/15 text-[#f5a524]",
  },
  approved: {
    label: "Approved",
    className: "bg-[#7c5cff]/15 text-[#c8b8ff]",
  },
  paid: {
    label: "Paid",
    className: "bg-[#2bd99f]/15 text-[#2bd99f]",
  },
  rejected: {
    label: "Rejected (refunded)",
    className: "bg-[var(--danger)]/15 text-[var(--danger)]",
  },
};

export default async function WithdrawPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/withdraw");
  }

  const myWithdrawals = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.userId, user.id))
    .orderBy(desc(withdrawals.createdAt));

  const me = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    balanceCents: user.balanceCents,
    lifetimeEarningsCents: user.lifetimeEarningsCents,
  };

  return (
    <div className="min-h-screen">
      <SiteHeader initialUser={me} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Withdraw funds</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Cash out your earnings to your preferred payout method.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <WithdrawForm balanceCents={user.balanceCents} />

          <aside className="space-y-4">
            <div className="glass-card p-5">
              <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
                Available balance
              </div>
              <div className="mt-2 text-3xl font-extrabold text-[#2bd99f]">
                {formatCents(user.balanceCents)}
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Minimum withdrawal is $1.00. Requests are reviewed within 24
                hours.
              </p>
            </div>
            <div className="glass-card p-5 text-sm text-[var(--text-secondary)]">
              <h3 className="text-sm font-semibold text-white">
                Payout methods
              </h3>
              <ul className="mt-3 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-lg">💸</span>
                  <div>
                    <div className="font-semibold text-white">PayPal</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      Paid within 24h
                    </div>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">🏦</span>
                  <div>
                    <div className="font-semibold text-white">Bank transfer</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      1–3 business days
                    </div>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">🪙</span>
                  <div>
                    <div className="font-semibold text-white">Crypto (USDT)</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      TRC20 wallet address
                    </div>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">🎁</span>
                  <div>
                    <div className="font-semibold text-white">Gift card</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      Amazon, Steam, Apple
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="glass-card mt-8 overflow-hidden">
          <div className="border-b border-[var(--border-subtle)] px-5 py-3 text-xs uppercase tracking-widest text-[var(--text-muted)]">
            Withdrawal history
          </div>
          {myWithdrawals.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-[var(--text-secondary)]">
              <div className="text-3xl">💰</div>
              <p className="mt-3">You haven&apos;t made any withdrawals yet.</p>
            </div>
          ) : (
            <ul>
              {myWithdrawals.map((w) => {
                const style = STATUS_STYLE[w.status] ?? {
                  label: w.status,
                  className: "bg-white/5 text-[var(--text-muted)]",
                };
                return (
                  <li
                    key={w.id}
                    className="flex flex-col gap-2 border-b border-[var(--border-subtle)] px-5 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold">
                        {formatCents(w.amountCents)} ·{" "}
                        {METHOD_LABEL[w.method] ?? w.method}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        Requested {formatDate(w.createdAt)}
                        {w.processedAt
                          ? ` · Processed ${formatDate(w.processedAt)}`
                          : ""}
                      </div>
                      {w.note && (
                        <div className="mt-1 text-xs text-[var(--text-muted)]">
                          Note: {w.note}
                        </div>
                      )}
                    </div>
                    <span
                      className={`self-start rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:self-center ${style.className}`}
                    >
                      {style.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
