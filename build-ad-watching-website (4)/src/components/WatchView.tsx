"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatCents, formatDuration } from "@/lib/format";
import { type AdType, getAdTypeInfo, isNetworkAd, buildNetworkEmbedUrl } from "@/lib/adNetworks";

interface AdData {
  id: number;
  title: string;
  advertiser: string;
  category: string;
  description: string;
  adType: AdType;
  videoUrl: string;
  durationSeconds: number;
  rewardCents: number;
  requiredWatchPercent: number;
  maxViewsPerUser: number;
  remainingBudgetCents: number;
  networkName?: string | null;
}
interface UserData { id: number; balanceCents: number; }
interface SessionData { token: string; adId: number; rewardCents: number; durationSeconds: number; startedAt: string; expiresAt: string; }
type Status = "idle"|"starting"|"error"|"in_progress"|"completing"|"completed"|"limit_reached";

const AD_TYPE_ICONS = { mp4: "🎬", youtube: "▶️", network: "📡" };
const AD_TYPE_LABELS = { mp4: "MP4 Video", youtube: "YouTube Embed", network: "Ad Network" };

export function WatchView({ ad, user, userLimitReached }: { ad: AdData; user: UserData; userLimitReached: boolean }) {
  const videoRef = useRef<HTMLVideoElement|null>(null);
  const iframeTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const lastHeartbeatRef = useRef(0);
  const maxWatchedRef = useRef(0);
  const sessionStartRef = useRef(0);

  const [status, setStatus] = useState<Status>(userLimitReached ? "limit_reached" : "idle");
  const [error, setError] = useState<string|null>(null);
  const [session, setSession] = useState<SessionData|null>(null);
  const [watchedSeconds, setWatchedSeconds] = useState(0);
  const [balance, setBalance] = useState(user.balanceCents);
  const [rewardEarned, setRewardEarned] = useState(0);
  const [muted, setMuted] = useState(true);
  const [videoErr, setVideoErr] = useState(false);

  const requiredSeconds = Math.ceil((ad.durationSeconds * ad.requiredWatchPercent) / 100);
  const progressPct = Math.min(100, (watchedSeconds / ad.durationSeconds) * 100);
  const requiredPct = ad.requiredWatchPercent;

  const sendHeartbeat = useCallback(async (token: string, watched: number) => {
    try {
      await fetch(`/api/ads/${ad.id}/heartbeat`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionToken: token, watchedSeconds: watched }),
      });
    } catch { /* best effort */ }
  }, [ad.id]);

  const completeSession = useCallback(async (token: string, watched: number) => {
    setStatus("completing");
    try {
      const res = await fetch(`/api/ads/${ad.id}/complete`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionToken: token, watchedSeconds: watched }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not claim reward"); setStatus("error"); return; }
      setBalance(data.balanceCents);
      setRewardEarned(data.rewardCents);
      setStatus("completed");
    } catch { setError("Network error."); setStatus("error"); }
  }, [ad.id]);

  const startSession = useCallback(async () => {
    setStatus("starting"); setError(null); setVideoErr(false);
    maxWatchedRef.current = 0; setWatchedSeconds(0);
    try {
      const res = await fetch(`/api/ads/${ad.id}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to start"); setStatus("error"); return; }
      setSession(data.session);
      sessionStartRef.current = Date.now();
      setStatus("in_progress");
      // Start MP4 playback
      if (ad.adType === "mp4") {
        setTimeout(() => { videoRef.current?.play().catch(() => {}); }, 100);
      }
      // For iframe ads, drive progress via wall-clock
      if (ad.adType !== "mp4") {
        iframeTimerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000);
          const capped = Math.min(elapsed, ad.durationSeconds);
          maxWatchedRef.current = capped;
          setWatchedSeconds(capped);
        }, 500);
      }
    } catch { setError("Network error."); setStatus("error"); }
  }, [ad.id, ad.adType, ad.durationSeconds]);

  // MP4 time tracking
  useEffect(() => {
    if (ad.adType !== "mp4") return;
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      const cur = Math.floor(video.currentTime);
      if (cur > maxWatchedRef.current) { maxWatchedRef.current = cur; setWatchedSeconds(cur); }
    };
    const onEnded = () => {
      const dur = Math.floor(video.duration || ad.durationSeconds);
      if (dur > maxWatchedRef.current) { maxWatchedRef.current = dur; setWatchedSeconds(dur); }
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", onEnded);
    return () => { video.removeEventListener("timeupdate", onTime); video.removeEventListener("ended", onEnded); };
  }, [ad.adType, ad.durationSeconds]);

  // Heartbeat + auto-complete loop
  useEffect(() => {
    if (status !== "in_progress" || !session) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const watched = maxWatchedRef.current;
      if (now - lastHeartbeatRef.current > 4500) {
        lastHeartbeatRef.current = now;
        sendHeartbeat(session.token, watched);
      }
      if (watched >= requiredSeconds) {
        clearInterval(interval);
        if (iframeTimerRef.current) clearInterval(iframeTimerRef.current);
        completeSession(session.token, watched);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [status, session, requiredSeconds, sendHeartbeat, completeSession]);

  useEffect(() => () => { if (iframeTimerRef.current) clearInterval(iframeTimerRef.current); }, []);

  const ytUrl = ad.adType === "youtube"
    ? `https://www.youtube.com/embed/${ad.videoUrl}?autoplay=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&rel=0&modestbranding=1${muted?"&mute=1":""}`
    : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Main */}
      <div>
        <a href="/dashboard" className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-white transition">← All ads</a>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="tag">{ad.category}</span>
          <span className="tag tag-muted">{ad.advertiser}</span>
          <span className="tag tag-muted">{getAdTypeInfo(ad.adType).icon} {getAdTypeInfo(ad.adType).label}</span>
        </div>
        <h1 className="mt-3 text-xl font-extrabold tracking-tight sm:text-2xl">{ad.title}</h1>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{ad.description}</p>

        {/* Video area */}
        <div className="glass-card mt-5 overflow-hidden">
          <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
            {/* MP4 */}
            {ad.adType === "mp4" && (
              <video ref={videoRef} src={ad.videoUrl}
                className="absolute inset-0 h-full w-full"
                controls={status === "completed"}
                controlsList="nodownload nofullscreen"
                playsInline muted={muted} preload="metadata"
                onError={() => setVideoErr(true)}
                onContextMenu={e => e.preventDefault()} />
            )}
            {/* YouTube */}
            {ad.adType === "youtube" && status === "in_progress" && (
              <iframe src={ytUrl} className="absolute inset-0 h-full w-full border-0"
                allow="autoplay; fullscreen" title={ad.title} />
            )}
            {ad.adType === "youtube" && status === "completed" && (
              <iframe src={`https://www.youtube.com/embed/${ad.videoUrl}?controls=1&rel=0`}
                className="absolute inset-0 h-full w-full border-0" allow="fullscreen" title={ad.title} />
            )}
            {/* Network (all network ad types) */}
            {isNetworkAd(ad.adType) && status === "in_progress" && (
              <iframe
                src={buildNetworkEmbedUrl(ad.adType, ad.videoUrl, ad.networkName)}
                className="absolute inset-0 h-full w-full border-0"
                allow="autoplay; fullscreen" title={ad.title} />
            )}

            {/* Overlays */}
            {(status === "idle" || status === "limit_reached") && (
              <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-black/50 to-black/80 text-center px-4">
                <div>
                  <div className="text-6xl mb-3">{getAdTypeInfo(ad.adType).icon}</div>
                  {status === "idle" ? (
                    <>
                      <div className="text-xl font-extrabold text-white">Earn {formatCents(ad.rewardCents)}</div>
                      <div className="mt-1 text-sm text-white/70">Watch {ad.requiredWatchPercent}% of the {ad.durationSeconds}s ad</div>
                      {isNetworkAd(ad.adType) && ad.networkName && <div className="mt-2 text-xs text-white/40">Powered by {ad.networkName}</div>}
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-bold text-[var(--warning)]">Watch limit reached</div>
                      <div className="mt-1 text-sm text-white/60">You've watched this ad {ad.maxViewsPerUser} time(s). Try another.</div>
                    </>
                  )}
                </div>
              </div>
            )}
            {status === "starting" && (
              <div className="absolute inset-0 grid place-items-center bg-black/70">
                <span className="spinner scale-[2]"/>
              </div>
            )}
            {videoErr && (
              <div className="absolute inset-0 grid place-items-center bg-black/80 text-center px-4">
                <div>
                  <div className="text-3xl">⚠️</div>
                  <p className="mt-2 text-sm text-white/80">Video failed to load. Check the URL or try again.</p>
                </div>
              </div>
            )}
            {status === "completed" && (
              <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-[var(--success)] px-3 py-1 text-xs font-bold text-black">
                ✓ Reward claimed — +{formatCents(rewardEarned)}
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="p-4 border-t border-[var(--border-subtle)]">
            <div className="mb-2 flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Watched {formatDuration(watchedSeconds)} of {formatDuration(ad.durationSeconds)}</span>
              <span>{Math.floor(progressPct)}% · need {requiredPct}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            {/* Required marker */}
            <div className="relative mt-0.5 h-3">
              <div className="absolute text-[9px] text-[var(--text-muted)]" style={{ left: `${requiredPct}%`, transform: "translateX(-50%)" }}>
                ↑ {requiredPct}%
              </div>
            </div>
            {ad.adType !== "mp4" && status === "in_progress" && (
              <p className="mt-2 text-xs text-[var(--warning)]">⚠ Keep this tab open — switching tabs may pause your timer.</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          {status === "idle" && <button onClick={startSession} className="btn btn-primary">▶ Start watching</button>}
          {status === "starting" && <button disabled className="btn btn-primary"><span className="spinner"/> Starting…</button>}
          {status === "in_progress" && ad.adType === "mp4" && (
            <button onClick={() => { const v=videoRef.current; v&&(v.paused?v.play():v.pause()); }} className="btn btn-secondary">⏯ Play / Pause</button>
          )}
          {status === "in_progress" && ad.adType !== "mp4" && (
            <div className="flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-2 text-sm text-[#c0aaff]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--success)]"/>
              Ad playing — keep this tab open
            </div>
          )}
          {status === "completing" && <button disabled className="btn btn-primary"><span className="spinner"/> Verifying…</button>}
          {status === "completed" && <a href="/dashboard" className="btn btn-success">Browse more ads →</a>}
          {status === "limit_reached" && <a href="/dashboard" className="btn btn-secondary">Back to ads</a>}
          {status === "error" && <button onClick={startSession} className="btn btn-primary">Try again</button>}
          {status === "in_progress" && ad.adType === "mp4" && (
            <button onClick={() => setMuted(m=>!m)} className="btn btn-ghost">{muted?"🔇 Unmute":"🔊 Mute"}</button>
          )}
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        {/* Reward card */}
        <div className="glass-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Reward for this ad</div>
          <div className="mt-2 text-4xl font-extrabold text-[var(--success)]">{formatCents(ad.rewardCents)}</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">Credited instantly to your wallet</div>
          <div className="mt-3 flex gap-2">
            {[
              { label: "Duration", value: `${ad.durationSeconds}s` },
              { label: "Rate", value: `$${((ad.rewardCents/100)/(ad.durationSeconds/60)).toFixed(2)}/min` },
            ].map(s => (
              <div key={s.label} className="flex-1 rounded-xl bg-[var(--bg-elevated)] p-3 text-center">
                <div className="text-base font-bold">{s.value}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Balance card */}
        <div className="glass-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Your balance</div>
          <div className="mt-2 text-3xl font-extrabold">{formatCents(balance)}</div>
          {status === "completed" && rewardEarned > 0 && (
            <div className="mt-1 text-sm font-semibold text-[var(--success)] fade-in">+{formatCents(rewardEarned)} added! 🎉</div>
          )}
          <a href="/withdraw" className="btn btn-secondary mt-4 w-full">💸 Withdraw →</a>
        </div>

        {/* Instructions */}
        <div className="glass-card p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">How to earn</div>
          <ul className="space-y-2.5">
            {[
              `Watch at least ${ad.requiredWatchPercent}% (${formatDuration(requiredSeconds)})`,
              "Keep this tab focused and don't navigate away",
              "Reward is verified and credited automatically",
            ].map((tip, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-[var(--text-secondary)]">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--success)]/15 text-[10px] font-bold text-[var(--success)]">{i+1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Ad type note */}
        {ad.adType === "youtube" && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-xs text-[var(--text-muted)]">
            <strong className="text-white">▶️ YouTube Ad</strong><br/>
            The YouTube player is embedded and locked. Your progress timer counts from when you click Start — keep the tab focused.
          </div>
        )}
        {isNetworkAd(ad.adType) && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 text-xs text-[var(--text-muted)]">
            <strong className="text-white">{getAdTypeInfo(ad.adType).icon} {getAdTypeInfo(ad.adType).label}</strong>
            {ad.networkName && ` (${ad.networkName})`}<br/>
            This ad is served by an external ad network. The timer tracks your real watch time in parallel. Keep the tab open until the reward is claimed.
          </div>
        )}
      </aside>
    </div>
  );
}
