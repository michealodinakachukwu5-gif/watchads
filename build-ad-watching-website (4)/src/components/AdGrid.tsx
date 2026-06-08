"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatCents, formatDuration } from "@/lib/format";
import { type AdType, getAdTypeInfo } from "@/lib/adNetworks";

export interface AdCardData {
  id: number;
  title: string;
  description: string;
  advertiser: string;
  category: string;
  adType: AdType;
  durationSeconds: number;
  rewardCents: number;
  videoUrl: string;
  thumbnailUrl: string | null;
  maxViewsPerUser: number;
  requiredWatchPercent: number;
  remainingBudgetCents: number;
  networkName?: string | null;
  completedByUser: number;
  remainingForUser: number | null;
}

const CATEGORIES = ["All","Finance","Entertainment","Shopping","Travel","Health","Education","Food","Tech","Gaming","Beauty","Sports","General"];

export function AdGrid({ ads, emptyMessage }: { ads: AdCardData[]; emptyMessage: string }) {
  const [category, setCategory] = useState("All");
  const [typeFilter, setTypeFilter] = useState<"all"|"mp4"|"youtube"|"network">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"reward"|"duration"|"newest">("reward");

  const presentCategories = useMemo(() => {
    const cats = new Set(ads.map(a => a.category));
    return CATEGORIES.filter(c => c === "All" || cats.has(c));
  }, [ads]);

  const filtered = useMemo(() => {
    let list = [...ads];
    if (category !== "All") list = list.filter(a => a.category === category);
    if (typeFilter !== "all") list = list.filter(a => a.adType === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.advertiser.toLowerCase().includes(q));
    }
    if (sort === "reward") list.sort((a,b) => b.rewardCents - a.rewardCents);
    else if (sort === "duration") list.sort((a,b) => b.durationSeconds - a.durationSeconds);
    return list;
  }, [ads, category, typeFilter, search, sort]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 space-y-3">
        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {presentCategories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${category===c?"border-[var(--accent)] bg-[var(--accent-soft)] text-[#c0aaff]":"border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-white"}`}>
              {c}
            </button>
          ))}
        </div>
        {/* Search + type filter + sort */}
        <div className="flex flex-wrap gap-2">
          <input type="search" placeholder="Search ads or brands…" value={search} onChange={e => setSearch(e.target.value)}
            className="input max-w-xs flex-1" />
          <div className="flex gap-1">
            {(["all","mp4","youtube","network"] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${typeFilter===t?"border-[var(--accent)] bg-[var(--accent-soft)] text-[#c0aaff]":"border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent)]/40"}`}>
                {t === "all" ? "All types" : t === "mp4" ? "🎬 MP4" : t === "youtube" ? "▶️ YouTube" : "📡 Network"}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="input w-auto">
            <option value="reward">Sort: Highest reward</option>
            <option value="duration">Sort: Longest ad</option>
          </select>
        </div>
        <div className="text-xs text-[var(--text-muted)]">
          {filtered.length} ad{filtered.length !== 1 ? "s" : ""} available
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card grid place-items-center px-6 py-20 text-center">
          <div className="text-5xl">🎬</div>
          <p className="mt-4 text-[var(--text-secondary)]">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(ad => <AdCard key={ad.id} ad={ad} />)}
        </div>
      )}
    </div>
  );
}

function AdCard({ ad }: { ad: AdCardData }) {
  const rewardPerMin = ((ad.rewardCents / 100) / (ad.durationSeconds / 60)).toFixed(2);
  const budgetPct = Math.max(5, Math.min(100, Math.round((ad.remainingBudgetCents / Math.max(1, ad.remainingBudgetCents + ad.rewardCents * 50)) * 100)));

  return (
    <Link href={`/watch/${ad.id}`}
      className="group glass-card flex flex-col overflow-hidden transition-all duration-200 hover:border-[var(--accent)]/50 hover:shadow-lg hover:shadow-[var(--accent)]/8">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--bg-elevated)]">
        {ad.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.thumbnailUrl} alt={ad.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[var(--accent)]/20 to-[var(--success)]/10 text-4xl">
            {getAdTypeInfo(ad.adType).icon}
          </div>
        )}
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
        {/* Ad type badge */}
        <div className="absolute left-2.5 top-2.5">
          <span className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {getAdTypeInfo(ad.adType).icon} {getAdTypeInfo(ad.adType).label}
          </span>
        </div>
        {/* Category */}
        <div className="absolute right-2.5 top-2.5">
          <span className="tag text-[10px]">{ad.category}</span>
        </div>
        {/* Reward badge */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-[var(--success)] px-2.5 py-1 text-xs font-black text-black">
          +{formatCents(ad.rewardCents)}
        </div>
        {/* Duration */}
        <div className="absolute bottom-2.5 right-2.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
          {formatDuration(ad.durationSeconds)}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-sm font-bold leading-snug">{ad.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">{ad.description}</p>

        <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="truncate font-medium">{ad.advertiser}</span>
          <span className="shrink-0">${rewardPerMin}/min</span>
        </div>

        {/* Budget bar */}
        <div className="mt-3">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${budgetPct}%` }} />
          </div>
          <div className="mt-1 text-[10px] text-[var(--text-muted)]">Budget {budgetPct}% remaining</div>
        </div>

        {/* Per-user limit info */}
        {ad.remainingForUser !== null && ad.maxViewsPerUser > 0 && (
          <div className="mt-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[10px] text-[var(--text-secondary)]">
            {ad.remainingForUser}/{ad.maxViewsPerUser} watches remaining for you
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)]">Watch {ad.requiredWatchPercent}% to earn</span>
          <span className="font-semibold text-[#c0aaff] transition group-hover:underline">Watch now →</span>
        </div>
      </div>
    </Link>
  );
}
