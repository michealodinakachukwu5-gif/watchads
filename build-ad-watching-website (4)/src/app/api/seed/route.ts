import { db } from "@/db";
import { ads, users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

const SAMPLE_ADS = [
  {
    title: "NovaBank — Banking that fits your life",
    advertiser: "NovaBank", category: "Finance",
    description: "Discover the all-in-one banking app with 4.8% APY savings, zero hidden fees, and instant transfers.",
    adType: "mp4" as const, durationSeconds: 30, rewardCents: 75,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
    requiredWatchPercent: 95, maxViewsPerUser: 3, totalBudgetCents: 100000,
  },
  {
    title: "StreamVerse — Watch anywhere, on any device",
    advertiser: "StreamVerse", category: "Entertainment",
    description: "Binge-worthy series, award-winning films, and live sports. Start your free 30-day trial.",
    adType: "mp4" as const, durationSeconds: 45, rewardCents: 120,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg",
    requiredWatchPercent: 95, maxViewsPerUser: 2, totalBudgetCents: 80000,
  },
  {
    title: "EcoWear — Sustainable fashion for everyday life",
    advertiser: "EcoWear", category: "Shopping",
    description: "Organic cotton tees, recycled denim and carbon-neutral shipping. Code WELCOME20.",
    adType: "mp4" as const, durationSeconds: 60, rewardCents: 180,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg",
    requiredWatchPercent: 95, maxViewsPerUser: 1, totalBudgetCents: 60000,
  },
  {
    title: "TrekMate — Plan the perfect adventure",
    advertiser: "TrekMate", category: "Travel",
    description: "Curated hiking trails, offline maps and one-tap booking for campsites across 60+ countries.",
    adType: "mp4" as const, durationSeconds: 25, rewardCents: 60,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg",
    requiredWatchPercent: 95, maxViewsPerUser: 5, totalBudgetCents: 120000,
  },
  {
    title: "Mindful — Meditation that actually works",
    advertiser: "Mindful Labs", category: "Health",
    description: "10-minute daily sessions, sleep stories and focus music. Try Mindful Plus free for 14 days.",
    adType: "mp4" as const, durationSeconds: 75, rewardCents: 220,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnailUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg",
    requiredWatchPercent: 95, maxViewsPerUser: 1, totalBudgetCents: 50000,
  },
  {
    title: "LearnHive — Master a skill in 15 min/day",
    advertiser: "LearnHive", category: "Education",
    description: "Thousands of courses in coding, design and more. 50% off annual plans.",
    adType: "mp4" as const, durationSeconds: 90, rewardCents: 260,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg",
    requiredWatchPercent: 95, maxViewsPerUser: 1, totalBudgetCents: 40000,
  },
  {
    title: "FreshBite — Wholesome meals in 20 minutes",
    advertiser: "FreshBite", category: "Food",
    description: "Chef-crafted salads, bowls and wraps. Free delivery on your first 3 orders.",
    adType: "mp4" as const, durationSeconds: 40, rewardCents: 100,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg",
    requiredWatchPercent: 95, maxViewsPerUser: 2, totalBudgetCents: 70000,
  },
  {
    title: "PulseFit — Your AI-powered home workout coach",
    advertiser: "PulseFit", category: "Health",
    description: "Real-time form correction, 2,000+ on-demand classes. Try PulseFit Pro for $1.",
    adType: "mp4" as const, durationSeconds: 50, rewardCents: 140,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    thumbnailUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg",
    requiredWatchPercent: 95, maxViewsPerUser: 1, totalBudgetCents: 30000,
  },
  // YouTube demo ad
  {
    title: "Big Buck Bunny — Short Film (YouTube Demo)",
    advertiser: "Blender Foundation", category: "Entertainment",
    description: "Watch this iconic open-source animated short. This is a demo of YouTube ad integration.",
    adType: "youtube" as const, durationSeconds: 30, rewardCents: 90,
    videoUrl: "aqz-KE-bpKQ",
    thumbnailUrl: "https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg",
    requiredWatchPercent: 95, maxViewsPerUser: 2, totalBudgetCents: 50000,
  },
];

export const dynamic = "force-dynamic";

export async function POST() {
  const [{ count: userCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  if (userCount === 0) {
    const passwordHash = await hashPassword("Admin12345!");
    await db.insert(users).values({
      name: "Site Admin", email: "admin@watchads.local", passwordHash,
      role: "admin", country: "United States", withdrawalActivated: true, advertiserApproved: true,
    });
  }

  const [{ count: adCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(ads);
  if (adCount === 0) {
    for (const a of SAMPLE_ADS) {
      await db.insert(ads).values({
        ...a, remainingBudgetCents: a.totalBudgetCents, status: "active", source: "admin",
      });
    }
  }

  return Response.json({ ok: true, seeded: adCount === 0, adminEmail: "admin@watchads.local", adminPasswordHint: "Admin12345!" });
}

export async function GET() {
  return Response.json({ info: "POST to seed the database with sample ads and admin account." });
}
