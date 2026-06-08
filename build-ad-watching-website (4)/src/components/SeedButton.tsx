"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SeedButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to seed");
        return;
      }
      setDone(true);
      setTimeout(() => router.refresh(), 800);
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="text-sm text-[#2bd99f]">
        ✓ Sample data loaded. Reload the page to see ads.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleSeed}
        disabled={busy}
        className="btn btn-secondary text-sm"
      >
        {busy ? <span className="spinner" /> : "🌱 Load sample ads & admin account"}
      </button>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
