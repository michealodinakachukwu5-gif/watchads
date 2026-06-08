import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SeedButton } from "@/components/SeedButton";
import { db } from "@/db";
import { ads, sql } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  let dbOk = true;
  let hasAds = false;
  try {
    await db.execute(sql`select 1`);
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(ads);
    hasAds = count > 0;
  } catch {
    dbOk = false;
  }

  return (
    <div className="min-h-screen">
      <SiteHeader initialUser={null} />
      <main>

        {/* ── HERO ── */}
        <section className="hero-bg overflow-hidden">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-28">
            <div className="flex flex-col justify-center">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tag">🌍 190+ Countries</span>
                <span className="tag tag-green">💰 Real Payouts</span>
              </div>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
                Get paid to{" "}
                <span className="gradient-text">watch ads</span>{" "}
                you actually finish.
              </h1>
              <p className="mt-5 max-w-lg text-base text-[var(--text-secondary)] sm:text-lg">
                Watch full-length video ads from real brands — MP4s, YouTube videos,
                or ad-network placements — and earn cash for every verified view.
                Withdraw to PayPal, crypto, bank or gift card.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/register" className="btn btn-primary">Create free account →</Link>
                <Link href="/login" className="btn btn-secondary">I have an account</Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-secondary)]">
                {["No fees to join","Withdraw from $1","4 payout methods","190+ countries supported"].map(t => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--success)] pulse-dot"/>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero mock dashboard */}
            <div className="relative hidden md:flex items-center">
              <div className="glass-card float w-full max-w-sm mx-auto p-5 shadow-2xl shadow-[#7c5cff]/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Your wallet</div>
                    <div className="text-3xl font-extrabold text-[var(--success)] mt-0.5">$47.25</div>
                  </div>
                  <div className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--success)]">+$2.60 today</div>
                </div>
                <div className="space-y-2">
                  {[
                    { type: "▶️ YouTube", title: "StreamVerse — Watch anywhere", reward: "$1.20", dur: "45s", done: true },
                    { type: "🎬 MP4", title: "Mindful — Meditation that works", reward: "$2.20", dur: "75s", done: false },
                    { type: "📡 Network", title: "LearnHive — New skill in 15 min", reward: "$2.60", dur: "90s", done: false },
                  ].map((a, i) => (
                    <div key={i} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${a.done ? "border-[var(--success)]/20 bg-[var(--success)]/5" : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]"}`}>
                      <div className="min-w-0">
                        <div className="text-[10px] text-[var(--text-muted)]">{a.type} · {a.dur}</div>
                        <div className="truncate text-sm font-medium">{a.title}</div>
                      </div>
                      <div className={`ml-3 shrink-0 text-sm font-bold ${a.done ? "text-[var(--success)]" : "text-[var(--text-secondary)]"}`}>{a.reward}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "Lifetime earned", val: "$243.80" },
                    { label: "Ads watched", val: "187" },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl bg-[var(--bg-elevated)] p-3 text-center">
                      <div className="text-lg font-extrabold">{s.val}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-[#7c5cff]/20 blur-3xl pointer-events-none"/>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-10 text-center">
              <span className="tag tag-muted">How it works</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Three steps to your first payout.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { step: "01", icon: "👤", title: "Create a free account", body: "Sign up in under 60 seconds. Select your country. No payment info needed." },
                { step: "02", icon: "📺", title: "Pick an ad & watch it fully", body: "Browse MP4, YouTube, or ad-network ads. Press start and watch the full duration — our server verifies you actually watched." },
                { step: "03", icon: "💸", title: "Withdraw your earnings", body: "Earnings land instantly in your wallet. Cash out via PayPal, crypto, bank transfer or gift card once you hit $1." },
              ].map(s => (
                <div key={s.step} className="glass-card p-6 fade-in">
                  <div className="text-3xl">{s.icon}</div>
                  <div className="mt-3 text-xs font-bold tracking-[.18em] text-[var(--accent)]">STEP {s.step}</div>
                  <h3 className="mt-2 text-base font-bold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AD FORMATS ── */}
        <section className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-10 text-center">
              <span className="tag tag-muted">Ad formats</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Three ways to watch & earn.</h2>
              <p className="mt-2 text-[var(--text-secondary)]">Every ad type is fully verified — you earn the same way regardless of format.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: "🎬",
                  type: "MP4 / Hosted Video",
                  tag: "Most common",
                  tagStyle: "tag",
                  body: "Direct MP4 video files from any CDN — S3, Cloudflare R2, Bunny, Vimeo. The original ad format. Full browser video controls after completion.",
                  bullets: ["Any video CDN supported","Full HD quality","Autoplay with timer lock"],
                },
                {
                  icon: "▶️",
                  type: "YouTube Video",
                  tag: "Easiest to set up",
                  tagStyle: "tag tag-green",
                  body: "Advertisers paste their YouTube video ID. We embed it in a locked player that tracks wall-clock time. No downloads needed.",
                  bullets: ["Reuse existing YouTube ads","No re-upload needed","Timer tracks via wall clock"],
                },
                {
                  icon: "📡",
                  type: "Ad Network",
                  tag: "Advanced",
                  tagStyle: "tag tag-yellow",
                  body: "Connects to Monetag, HilltopAds, PopAds or any VAST/embed network. Ads are served directly from the network while our timer runs in parallel.",
                  bullets: ["Monetag & HilltopAds ready","VAST / embed URL support","Publisher keeps network revenue"],
                },
              ].map(f => (
                <div key={f.type} className="glass-card p-6 flex flex-col">
                  <div className="text-4xl">{f.icon}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <h3 className="font-bold">{f.type}</h3>
                    <span className={f.tagStyle}>{f.tag}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)] flex-1">{f.body}</p>
                  <ul className="mt-4 space-y-1">
                    {f.bullets.map(b => (
                      <li key={b} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="text-[var(--success)]">✓</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PAYOUT METHODS ── */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <span className="tag tag-muted">Payouts</span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight">4 ways to get your money.</h2>
                <p className="mt-3 text-[var(--text-secondary)]">Withdraw starting from just $1.00. Requests are reviewed within 24 hours. A one-time account verification applies on first withdrawal.</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { icon: "💸", name: "PayPal", detail: "24h · Worldwide" },
                    { icon: "🏦", name: "Bank Transfer", detail: "1–3 days · SWIFT/IBAN" },
                    { icon: "🪙", name: "Crypto (USDT)", detail: "TRC20 network · Fast" },
                    { icon: "🎁", name: "Gift Card", detail: "Amazon, Steam, Apple" },
                  ].map(m => (
                    <div key={m.name} className="glass-card flex items-center gap-3 p-4">
                      <span className="text-2xl">{m.icon}</span>
                      <div>
                        <div className="text-sm font-semibold">{m.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{m.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="glass-card p-5">
                  <div className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Stats at a glance</div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { k: "$0.60", v: "Min reward per ad" },
                      { k: "$2.60", v: "Max reward per ad" },
                      { k: "25s–90s", v: "Typical ad length" },
                      { k: "190+", v: "Countries supported" },
                    ].map(s => (
                      <div key={s.k} className="rounded-xl bg-[var(--bg-elevated)] p-3">
                        <div className="text-xl font-extrabold">{s.k}</div>
                        <div className="text-xs text-[var(--text-muted)]">{s.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {[
                  { name: "Amara O.", country: "🇳🇬 Nigeria", body: "Withdrew $22 to crypto in my first week. Legit and fast." },
                  { name: "Carlos M.", country: "🇧🇷 Brazil", body: "I watch the 90-second ads during breakfast. $2.60 each time is hard to beat." },
                  { name: "Priya N.", country: "🇮🇳 India", body: "Love that YouTube ads count too — I already have them on my channel." },
                ].map(t => (
                  <div key={t.name} className="glass-card p-4">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">"{t.body}"</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-semibold">{t.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">{t.country}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── ADVERTISER CTA ── */}
        <section className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:items-center">
            <div>
              <span className="tag tag-yellow">For advertisers</span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Got a brand to promote?</h2>
              <p className="mt-3 text-[var(--text-secondary)]">
                Every WatchAds viewer is financially motivated to watch your entire ad. No skips. No bots. Upload an MP4, paste a YouTube ID, or connect your ad network — and reach a motivated global audience.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/advertise" className="btn btn-primary">Learn about advertising →</Link>
                <Link href="/advertiser/register" className="btn btn-secondary">Create advertiser account</Link>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "🎬", label: "MP4", sub: "Any CDN" },
                { icon: "▶️", label: "YouTube", sub: "Video ID" },
                { icon: "📡", label: "Ad Network", sub: "Monetag+" },
              ].map(f => (
                <div key={f.label} className="glass-card p-5 text-center">
                  <div className="text-3xl">{f.icon}</div>
                  <div className="mt-2 text-sm font-bold">{f.label}</div>
                  <div className="text-xs text-[var(--text-muted)]">{f.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="border-t border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-page)]">
          <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to start earning?</h2>
            <p className="mt-3 text-[var(--text-secondary)]">Free forever. No credit card. Your first ad is waiting.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="btn btn-primary">Create free account →</Link>
              <Link href="/login" className="btn btn-secondary">Log in</Link>
            </div>
            {dbOk && !hasAds && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <p className="text-sm text-[var(--text-muted)]">Fresh install detected — seed sample ads and admin account:</p>
                <SeedButton />
              </div>
            )}
            {!dbOk && <p className="mt-6 text-xs text-[var(--danger)]">⚠ Database unavailable.</p>}
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
