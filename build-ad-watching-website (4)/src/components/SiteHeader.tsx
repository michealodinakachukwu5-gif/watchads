"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export interface MeUser {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin" | "advertiser";
  country?: string;
  balanceCents: number;
  lifetimeEarningsCents: number;
  withdrawalActivated?: boolean;
  companyName?: string | null;
  advertiserApproved?: boolean;
}

export function SiteHeader({ initialUser }: { initialUser: MeUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(initialUser);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setUser(initialUser); }, [initialUser]);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  const viewerLinks = [
    { href: "/dashboard", label: "Browse Ads" },
    { href: "/history", label: "Earnings" },
    { href: "/withdraw", label: "Withdraw" },
  ];
  const advertiserLinks = [
    { href: "/advertiser", label: "Campaigns" },
    { href: "/advertiser/new", label: "New Campaign" },
  ];
  const navLinks = user?.role === "advertiser" ? advertiserLinks : viewerLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[rgba(7,10,18,0.9)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#22d4a0] text-base font-black text-white shadow-lg shadow-[#7c5cff]/30">W</div>
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-extrabold tracking-tight">WatchAds</span>
            <span className="text-[9px] uppercase tracking-[.18em] text-[var(--text-muted)]">Earn while you watch</span>
          </div>
        </Link>

        {/* Desktop nav */}
        {user && (
          <nav className="hidden items-center gap-0.5 md:flex">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive(l.href) ? "bg-[var(--accent-soft)] text-[#c0aaff]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-white"}`}>
                {l.label}
              </Link>
            ))}
            {user.role === "admin" && (
              <Link href="/admin"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive("/admin") ? "bg-[var(--accent-soft)] text-[#c0aaff]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-white"}`}>
                Admin ⚡
              </Link>
            )}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.role === "user" && (
                <div className="hidden items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 sm:flex">
                  <span className="text-xs text-[var(--text-muted)]">Balance</span>
                  <span className="text-sm font-bold text-[var(--success)]">${(user.balanceCents/100).toFixed(2)}</span>
                </div>
              )}
              <div className="relative">
                <button onClick={() => setMenuOpen(v => !v)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7c5cff] to-[#22d4a0] text-sm font-extrabold text-white shadow shadow-[#7c5cff]/20">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl">
                    <div className="border-b border-[var(--border-subtle)] px-4 py-3.5">
                      <div className="text-sm font-bold">{user.name}</div>
                      <div className="truncate text-xs text-[var(--text-muted)]">{user.email}</div>
                      <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${user.role==="admin"?"bg-[#7c5cff]/20 text-[#c0aaff]":user.role==="advertiser"?"bg-[var(--warning)]/15 text-[var(--warning)]":"bg-[var(--success)]/10 text-[var(--success)]"}`}>{user.role}</span>
                    </div>
                    <div className="flex flex-col p-1.5 gap-0.5">
                      {user.role === "advertiser" ? (
                        <>
                          <Link href="/advertiser" className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--bg-card-hover)]">📊 My Campaigns</Link>
                          <Link href="/advertiser/new" className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--bg-card-hover)]">➕ New Campaign</Link>
                        </>
                      ) : (
                        <>
                          <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--bg-card-hover)]">📺 Browse Ads</Link>
                          <Link href="/history" className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--bg-card-hover)]">📈 Earnings History</Link>
                          <Link href="/withdraw" className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--bg-card-hover)]">💸 Withdraw</Link>
                        </>
                      )}
                      {user.role === "admin" && <Link href="/admin" className="rounded-lg px-3 py-2 text-sm hover:bg-[var(--bg-card-hover)]">⚡ Admin Console</Link>}
                      <div className="my-1 border-t border-[var(--border-subtle)]"/>
                      <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[var(--bg-card-hover)]">Sign out</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Log in</Link>
              <Link href="/register" className="btn btn-primary">Get started</Link>
              <Link href="/advertise" className="hidden btn btn-secondary text-sm sm:inline-flex">Advertise</Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav strip */}
      {user && (
        <nav className="flex gap-1 overflow-x-auto border-t border-[var(--border-subtle)] px-4 py-1.5 md:hidden">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive(l.href) ? "bg-[var(--accent-soft)] text-[#c0aaff]" : "text-[var(--text-secondary)] hover:text-white"}`}>
              {l.label}
            </Link>
          ))}
          {user.role === "admin" && <Link href="/admin" className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive("/admin")?"bg-[var(--accent-soft)] text-[#c0aaff]":"text-[var(--text-secondary)] hover:text-white"}`}>Admin</Link>}
        </nav>
      )}
    </header>
  );
}
