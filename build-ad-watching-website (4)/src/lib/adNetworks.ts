// ─── Canonical ad-type union ─────────────────────────────────────────────────
// Keep this in sync with the pgEnum in schema.ts
export type AdType =
  | "mp4"
  | "youtube"
  | "network"
  | "monetag"
  | "hilltopads"
  | "popads"
  | "adsterra"
  | "propellerads"
  | "mgid"
  | "revcontent"
  | "infolinks"
  | "trafficjunky"
  | "exoclick"
  | "adcash";

// ─── Per-network metadata ─────────────────────────────────────────────────────
export interface NetworkInfo {
  key: AdType;
  label: string;
  icon: string;
  color: string; // tailwind bg class
  /** Typical CPM range in USD */
  cpmRange: string;
  /** Short description shown in UI */
  desc: string;
  /** What the user should paste as videoUrl */
  urlLabel: string;
  urlPlaceholder: string;
  /** Optional help URL */
  signupUrl: string;
  /** How to generate embed code */
  embedHint: string;
  /** Does this network support video/pre-roll (true) or only display/push (false)? */
  supportsVideo: boolean;
  /** Minimum payout the publisher earns from this network */
  minPayout: string;
  /** Supported ad formats */
  formats: string[];
}

export const NETWORK_REGISTRY: NetworkInfo[] = [
  {
    key: "monetag",
    label: "Monetag",
    icon: "💰",
    color: "bg-orange-500",
    cpmRange: "$0.50 – $4.00",
    desc: "Formerly PropellerAds publisher network. Offers In-Page Push, Video Pre-roll, and Interstitial. Great global fill rates.",
    urlLabel: "Monetag Zone ID or Embed Script URL",
    urlPlaceholder: "e.g. 1234567 or https://www.effectivegatetechnology.com/...",
    signupUrl: "https://monetag.com",
    embedHint: "Go to Monetag → Sites → Add Site → Create Zone → Copy zone ID",
    supportsVideo: true,
    minPayout: "$5",
    formats: ["In-Page Push", "Video Pre-roll", "Interstitial", "Banner"],
  },
  {
    key: "hilltopads",
    label: "HilltopAds",
    icon: "⛰️",
    color: "bg-green-600",
    cpmRange: "$0.30 – $3.50",
    desc: "High-converting ad network with video, popunder and direct links. Strong CPMs for Asia, LatAm and Africa.",
    urlLabel: "HilltopAds Zone Embed URL",
    urlPlaceholder: "https://go.hilltopads.com/...",
    signupUrl: "https://hilltopads.com",
    embedHint: "HilltopAds → Publisher → Zones → Create Zone → Embed → Copy direct URL",
    supportsVideo: true,
    minPayout: "$10",
    formats: ["In-Page Push", "Video", "Popunder", "Direct Link"],
  },
  {
    key: "popads",
    label: "PopAds",
    icon: "🎯",
    color: "bg-blue-600",
    cpmRange: "$0.20 – $5.00",
    desc: "One of the oldest and highest-paying popunder networks. Instant approval, daily payouts, worldwide coverage.",
    urlLabel: "PopAds Publisher Code / URL",
    urlPlaceholder: "Paste the PopAds embed URL or publisher tag URL",
    signupUrl: "https://popads.net",
    embedHint: "PopAds → My Websites → Add Website → Get Code → Copy URL",
    supportsVideo: false,
    minPayout: "$5",
    formats: ["Popunder", "Pop-up", "Tab-under"],
  },
  {
    key: "adsterra",
    label: "Adsterra",
    icon: "🌐",
    color: "bg-purple-600",
    cpmRange: "$0.50 – $6.00",
    desc: "Premium CPM network with Social Bar, Banner, Video, and Popunder. Excellent eCPM for Tier-1 and Tier-2 countries.",
    urlLabel: "Adsterra Direct Link or Zone URL",
    urlPlaceholder: "https://www.meetupads.com/... or direct link URL",
    signupUrl: "https://adsterra.com",
    embedHint: "Adsterra → Publisher → Website → Add Zone → Direct Link → Copy URL",
    supportsVideo: true,
    minPayout: "$5",
    formats: ["Social Bar", "Banner", "Video", "Popunder", "Direct Link"],
  },
  {
    key: "propellerads",
    label: "PropellerAds",
    icon: "🚀",
    color: "bg-red-500",
    cpmRange: "$0.50 – $4.50",
    desc: "Large self-serve ad platform. SmartLink pays per action. Strong fill rates in 180+ countries. Very fast approval.",
    urlLabel: "PropellerAds SmartLink or Zone URL",
    urlPlaceholder: "https://s.propellerads.com/...",
    signupUrl: "https://propellerads.com",
    embedHint: "PropellerAds → Publisher → Zones → Create Zone → Get Code → Smart URL",
    supportsVideo: true,
    minPayout: "$5",
    formats: ["Push Notifications", "Interstitial", "SmartLink", "Popunder", "Banner"],
  },
  {
    key: "mgid",
    label: "MGID",
    icon: "📰",
    color: "bg-teal-600",
    cpmRange: "$0.30 – $2.50",
    desc: "Native advertising network. High-quality native ad placements that blend with content. Good eCPM for news content.",
    urlLabel: "MGID Widget URL",
    urlPlaceholder: "https://cm.mgid.com/...",
    signupUrl: "https://mgid.com",
    embedHint: "MGID → Publisher → Widgets → Create Widget → Copy widget URL",
    supportsVideo: false,
    minPayout: "$100",
    formats: ["Native Ads", "Content Recommendation", "Widget"],
  },
  {
    key: "revcontent",
    label: "RevContent",
    icon: "📈",
    color: "bg-indigo-600",
    cpmRange: "$0.20 – $2.00",
    desc: "Premium native content recommendation network. Works well for news, entertainment and lifestyle content.",
    urlLabel: "RevContent Widget Embed URL",
    urlPlaceholder: "https://assets.revcontent.com/...",
    signupUrl: "https://revcontent.com",
    embedHint: "RevContent → Publisher Portal → Widgets → Add Widget → Get Script URL",
    supportsVideo: false,
    minPayout: "$50",
    formats: ["Native Content", "Widget", "Recommendation"],
  },
  {
    key: "infolinks",
    label: "Infolinks",
    icon: "🔗",
    color: "bg-yellow-600",
    cpmRange: "$0.10 – $1.50",
    desc: "In-text and in-fold ads. Easy integration, no minimum traffic. Good for text-heavy content pages.",
    urlLabel: "Infolinks Publisher Tag URL",
    urlPlaceholder: "https://resources.infolinks.com/...",
    signupUrl: "https://infolinks.com",
    embedHint: "Infolinks → Integrate → Get Code → Copy script source URL",
    supportsVideo: false,
    minPayout: "$50",
    formats: ["In-Text", "In-Fold", "In-Frame", "In-Tag"],
  },
  {
    key: "trafficjunky",
    label: "TrafficJunky",
    icon: "🐵",
    color: "bg-pink-600",
    cpmRange: "$1.00 – $8.00",
    desc: "Premium adult and mainstream video ad network. Very high CPMs for video pre-roll. Owned by MindGeek.",
    urlLabel: "TrafficJunky Zone URL",
    urlPlaceholder: "https://click.trafficjunky.net/...",
    signupUrl: "https://trafficjunky.com",
    embedHint: "TrafficJunky Publisher → Zones → Create Zone → Copy zone URL",
    supportsVideo: true,
    minPayout: "$20",
    formats: ["Video Pre-roll", "Display", "Native"],
  },
  {
    key: "exoclick",
    label: "ExoClick",
    icon: "⚡",
    color: "bg-cyan-600",
    cpmRange: "$0.50 – $5.00",
    desc: "Large digital ad network with video, banner and in-video ads. Strong global fill rates and fast payments.",
    urlLabel: "ExoClick Zone Embed URL",
    urlPlaceholder: "https://gc.zedo.com/... or ExoClick zone URL",
    signupUrl: "https://exoclick.com",
    embedHint: "ExoClick → Publisher → Create Zone → Embed Code → Copy URL",
    supportsVideo: true,
    minPayout: "$20",
    formats: ["Video Pre-roll", "In-Video", "Banner", "Interstitial", "Push"],
  },
  {
    key: "adcash",
    label: "AdCash",
    icon: "💵",
    color: "bg-emerald-600",
    cpmRange: "$0.40 – $4.00",
    desc: "Global performance ad network with anti-adblock technology. Popunder, interstitial and in-page push.",
    urlLabel: "AdCash Zone URL",
    urlPlaceholder: "https://delivery.adcash.com/...",
    signupUrl: "https://adcash.com",
    embedHint: "AdCash → Publisher → Zones → Get Code → Copy zone direct URL",
    supportsVideo: false,
    minPayout: "$25",
    formats: ["Popunder", "Interstitial", "In-Page Push", "Banner"],
  },
  {
    key: "network",
    label: "Other Network",
    icon: "📡",
    color: "bg-gray-600",
    cpmRange: "Varies",
    desc: "Any other ad network not listed above. Paste any embed URL, iframe src, or direct ad link.",
    urlLabel: "Ad Network Embed URL",
    urlPlaceholder: "Paste embed URL, iframe src, or ad tag URL",
    signupUrl: "",
    embedHint: "Get the embed URL, iframe src, or direct link from your ad network dashboard and paste it here.",
    supportsVideo: true,
    minPayout: "Varies",
    formats: ["Any"],
  },
];

// All network types (excludes mp4 and youtube)
export const NETWORK_TYPES = NETWORK_REGISTRY.map(n => n.key);

// Quick lookup by key
export const NETWORK_MAP = Object.fromEntries(
  NETWORK_REGISTRY.map(n => [n.key, n])
) as Record<AdType, NetworkInfo | undefined>;

// Is this type a network ad?
export function isNetworkAd(adType: AdType): boolean {
  return adType !== "mp4" && adType !== "youtube";
}

// Get display info for any ad type
export function getAdTypeInfo(adType: AdType): { icon: string; label: string } {
  if (adType === "mp4") return { icon: "🎬", label: "MP4 Video" };
  if (adType === "youtube") return { icon: "▶️", label: "YouTube" };
  const net = NETWORK_MAP[adType];
  return { icon: net?.icon ?? "📡", label: net?.label ?? "Ad Network" };
}

// Build the iframe embed URL for a network ad
export function buildNetworkEmbedUrl(adType: AdType, videoUrl: string, networkZoneId?: string | null): string {
  // For Monetag — they provide zone IDs that map to script URLs
  if (adType === "monetag") {
    // If it's already a URL, use as-is
    if (videoUrl.startsWith("http")) return videoUrl;
    // Otherwise treat as zone ID → use Monetag's in-page push endpoint
    return `https://www.effectivegatetechnology.com/fvkj/${videoUrl}`;
  }
  // All other networks: use videoUrl directly as iframe src
  return videoUrl;
}
