import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#7c5cff] to-[#22d4a0] text-sm font-black text-white">W</div>
            <span className="text-sm font-extrabold">WatchAds</span>
          </div>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">The fairest way to earn from your attention — and the smartest way for brands to reach engaged viewers worldwide.</p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">For viewers</h4>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li><Link href="/dashboard" className="hover:text-white transition">Browse ads</Link></li>
            <li><Link href="/history" className="hover:text-white transition">Earnings history</Link></li>
            <li><Link href="/withdraw" className="hover:text-white transition">Withdraw funds</Link></li>
            <li><Link href="/register" className="hover:text-white transition">Sign up free</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">For advertisers</h4>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li><Link href="/advertise" className="hover:text-white transition">Why advertise</Link></li>
            <li><Link href="/advertiser/register" className="hover:text-white transition">Create advertiser account</Link></li>
            <li><Link href="/advertiser" className="hover:text-white transition">My campaigns</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Ad formats</h4>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li className="flex items-center gap-2"><span>🎬</span> MP4 / Hosted video</li>
            <li className="flex items-center gap-2"><span>▶️</span> YouTube embed</li>
            <li className="flex items-center gap-2"><span>📡</span> Ad network (Monetag+)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--border-subtle)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-[var(--text-muted)] sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} WatchAds. All rights reserved.</span>
          <span>Built with Next.js · Drizzle ORM · PostgreSQL</span>
        </div>
      </div>
    </footer>
  );
}
