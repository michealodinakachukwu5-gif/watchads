"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/format";

type Method = "paypal" | "bank" | "crypto" | "gift_card";

const METHODS: { value: Method; label: string; placeholder: string }[] = [
  {
    value: "paypal",
    label: "PayPal",
    placeholder: "your-paypal@example.com",
  },
  {
    value: "bank",
    label: "Bank transfer",
    placeholder: "Account holder, IBAN, SWIFT/BIC",
  },
  {
    value: "crypto",
    label: "Crypto (USDT-TRC20)",
    placeholder: "Your TRC20 wallet address",
  },
  {
    value: "gift_card",
    label: "Gift card",
    placeholder: "Brand (Amazon, Steam…) + email",
  },
];

export function WithdrawForm({ balanceCents }: { balanceCents: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState("5.00");
  const [method, setMethod] = useState<Method>("paypal");
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const amountCents = Math.round((parseFloat(amount) || 0) * 100);
  const valid =
    amountCents >= 100 &&
    amountCents <= balanceCents &&
    account.trim().length >= 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!valid) {
      setError("Please enter a valid amount and account details");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountCents, method, accountDetails: account }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Withdrawal failed");
        setLoading(false);
        return;
      }
      setSuccess(
        `Withdrawal request for ${formatCents(amountCents)} submitted!`,
      );
      setAccount("");
      setLoading(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const placeholder = METHODS.find((m) => m.value === method)?.placeholder ?? "";

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card space-y-4 p-6"
    >
      <h2 className="text-lg font-semibold">Request a withdrawal</h2>

      <div>
        <label className="label" htmlFor="amount">
          Amount (USD)
        </label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="1"
          max={(balanceCents / 100).toFixed(2)}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input"
          required
        />
        <div className="mt-1.5 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Minimum $1.00</span>
          <button
            type="button"
            onClick={() => setAmount((balanceCents / 100).toFixed(2))}
            className="text-[#c8b8ff] hover:underline"
          >
            Withdraw all ({formatCents(balanceCents)})
          </button>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="method">
          Payout method
        </label>
        <select
          id="method"
          value={method}
          onChange={(e) => setMethod(e.target.value as Method)}
          className="input"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="account">
          Account / wallet details
        </label>
        <textarea
          id="account"
          rows={3}
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          placeholder={placeholder}
          className="input resize-none"
          required
          minLength={4}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-[#2bd99f]/30 bg-[#2bd99f]/10 px-3 py-2 text-sm text-[#2bd99f]">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !valid}
        className="btn btn-primary w-full"
      >
        {loading ? <span className="spinner" /> : "Submit withdrawal request"}
      </button>
      <p className="text-center text-xs text-[var(--text-muted)]">
        Funds are debited immediately and held until your request is reviewed.
      </p>
    </form>
  );
}
