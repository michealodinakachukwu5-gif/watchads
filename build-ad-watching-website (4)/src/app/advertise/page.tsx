import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function AdvertisePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader initialUser={null} />
      <main>
        {/* Hero */}
        <section className="hero-bg">
          <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
            <span className="tag tag-yellow">For brands &amp; businesses</span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl">
              Reach viewers who <span className="gradient-text">actually watch</span> every second.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
              WatchAds users are paid to finish your ad. No skips, no bots, no tab-switching.
              Verified human engagement from a global audience in 190+ countries.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/advertiser/register" className="btn btn-primary">Start advertising →</Link>
              <Link href="/login" className="btn btn-secondary">I already have an account</Link>
            </div>
          </div>
        </section>

        {/* Ad formats — the 4 options */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-10 text-center">
              <span className="tag tag-muted">Ad formats</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">3 ways to run your ad</h2>
              <p className="mt-2 text-[var(--text-secondary)]">Choose the format that fits your workflow. All formats are verified and pay per completed view.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: "🎬", type: "MP4 / Hosted Video", badge: "Most flexible", badgeStyle: "tag",
                  desc: "Upload your video to any CDN (AWS S3, Cloudflare R2, Bunny, Vimeo) and paste the direct .mp4 URL. Full quality, full control.",
                  steps: ["Upload to any CDN", "Paste the .mp4 URL", "Set budget & go live"],
                  ideal: "Brand videos, product demos, TV-style spots",
                },
                {
                  icon: "▶️", type: "YouTube Embed", badge: "Easiest setup", badgeStyle: "tag tag-green",
                  desc: "Already have a YouTube ad? Paste your video ID and we embed it in a locked player that forces full-watch. No re-upload needed.",
                  steps: ["Find your YouTube video ID", "Paste the ID (11 characters)", "Set budget & go live"],
                  ideal: "Repurposing existing YouTube content",
                },
                {
                  icon: "📡", type: "Ad Network", badge: "Advanced", badgeStyle: "tag tag-yellow",
                  desc: "Connect Monetag, HilltopAds, PopAds or any VAST/embed network. Ads are served directly from the network while our reward timer runs in parallel.",
                  steps: ["Create a zone on your network", "Paste the embed URL or zone ID", "Set reward & budget"],
                  ideal: "Publishers earning from Monetag/HilltopAds",
                },
              ].map(f => (
                <div key={f.type} className="glass-card flex flex-col p-6">
                  <div className="text-4xl">{f.icon}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <h3 className="font-bold">{f.type}</h3>
                    <span className={f.badgeStyle}>{f.badge}</span>
                  </div>
                  <p className="mt-2 flex-1 text-sm text-[var(--text-secondary)]">{f.desc}</p>
                  <div className="mt-4 space-y-1.5">
                    {f.steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[10px] font-bold text-[#c0aaff]">{i+1}</span>
                        <span className="text-[var(--text-secondary)]">{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl bg-[var(--bg-elevated)] p-3 text-xs text-[var(--text-muted)]">
                    <strong className="text-[var(--text-secondary)]">Ideal for:</strong> {f.ideal}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why */}
        <section className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight">Why advertise on WatchAds?</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: "👁️", title: "100% view-through rate", body: "Users only earn when they watch the entire ad. No half-watches, no background tabs." },
                { icon: "🌍", title: "190+ countries", body: "Reach a truly global audience from North America to Southeast Asia to West Africa." },
                { icon: "🎯", title: "Category targeting", body: "Finance, Health, Tech, Food, Entertainment — target your ad to the right audience." },
                { icon: "💰", title: "Pay only per completion", body: "Budget depletes only when someone finishes your ad. Full control, zero waste." },
              ].map(f => (
                <div key={f.title} className="glass-card p-5">
                  <div className="text-3xl">{f.icon}</div>
                  <h3 className="mt-3 text-sm font-bold">{f.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight">Simple, transparent pricing</h2>
              <p className="mt-2 text-[var(--text-secondary)]">You set the reward per completed view. We handle everything else.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                { name: "Starter", min: "$50", cpm: "$2.50", views: "~2,000", dur: "30s", highlight: false },
                { name: "Growth", min: "$200", cpm: "$2.00", views: "~10,000", dur: "60s", highlight: true },
                { name: "Scale", min: "$500+", cpm: "$1.50", views: "~33,000+", dur: "90s", highlight: false },
              ].map(p => (
                <div key={p.name} className={`glass-card flex flex-col p-6 ${p.highlight?"border-[var(--accent)]/40 shadow-lg shadow-[var(--accent)]/10":""}`}>
                  {p.highlight && <div className="tag mb-3 self-start">Most popular</div>}
                  <div className="text-xl font-extrabold">{p.name}</div>
                  <div className="mt-1 text-4xl font-extrabold text-[var(--success)]">{p.min}</div>
                  <div className="text-xs text-[var(--text-muted)] mb-4">minimum budget</div>
                  <ul className="flex-1 space-y-2 text-sm text-[var(--text-secondary)]">
                    <li>✓ {p.cpm} per completed view</li>
                    <li>✓ ~{p.views} estimated views</li>
                    <li>✓ Up to {p.dur} ad duration</li>
                    <li>✓ All 3 ad formats supported</li>
                    <li>✓ 190+ countries</li>
                    <li>✓ Real-time view tracking</li>
                  </ul>
                  <Link href="/advertiser/register" className={`btn mt-5 ${p.highlight?"btn-primary":"btn-secondary"}`}>Get started →</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works for advertisers */}
        <section className="border-t border-[var(--border-subtle)]">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight">From signup to live in 4 steps</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { n:"01", title:"Create account", body:"Register as an advertiser. Include your company name. Approval within 24h." },
                { n:"02", title:"Create campaign", body:"Pick ad format (MP4/YouTube/Network), set duration, reward per view and budget." },
                { n:"03", title:"Send payment", body:"Pay your budget via PayPal, crypto or bank. Admin activates your campaign after confirmation." },
                { n:"04", title:"Watch views roll in", body:"Your ad goes live. Users start watching. View count and spend tracked in real time." },
              ].map(s => (
                <div key={s.n} className="glass-card p-5">
                  <div className="text-xs font-bold tracking-[.18em] text-[var(--accent)]">STEP {s.n}</div>
                  <h3 className="mt-2 font-bold">{s.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-page)]">
          <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight">Ready to run your first campaign?</h2>
            <p className="mt-3 text-[var(--text-secondary)]">5 minutes to set up. Live within 24 hours. Pay only for completed views.</p>
            <Link href="/advertiser/register" className="btn btn-primary mt-7">Create advertiser account →</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
