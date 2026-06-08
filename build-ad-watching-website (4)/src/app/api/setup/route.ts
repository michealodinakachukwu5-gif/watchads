import { db } from "@/db";
import { sql } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: string[] = [];

  try {
    // 1. Create enums (safe if they already exist)
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('user','admin','advertiser');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    results.push("✅ user_role enum ready");

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE ad_status AS ENUM ('pending_review','active','paused','ended','rejected');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    results.push("✅ ad_status enum ready");

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE ad_type AS ENUM ('mp4','youtube','network','monetag','hilltopads','popads','adsterra','propellerads','mgid','revcontent','infolinks','trafficjunky','exoclick','adcash');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    results.push("✅ ad_type enum ready");

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE ad_view_status AS ENUM ('in_progress','completed','abandoned');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    results.push("✅ ad_view_status enum ready");

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE withdrawal_method AS ENUM ('paypal','bank','crypto','gift_card');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    results.push("✅ withdrawal_method enum ready");

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE withdrawal_status AS ENUM ('pending','approved','rejected','paid');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    results.push("✅ withdrawal_status enum ready");

    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE advertiser_payment_status AS ENUM ('pending','paid','failed','refunded');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
    results.push("✅ advertiser_payment_status enum ready");

    // 2. Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name VARCHAR(120) NOT NULL,
        country VARCHAR(120) NOT NULL DEFAULT 'United States',
        balance_cents INTEGER NOT NULL DEFAULT 0,
        lifetime_earnings_cents INTEGER NOT NULL DEFAULT 0,
        withdrawal_activated BOOLEAN NOT NULL DEFAULT false,
        role user_role NOT NULL DEFAULT 'user',
        company_name VARCHAR(200),
        company_website TEXT,
        advertiser_approved BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    results.push("✅ users table ready");

    // 3. Create ads table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ads (
        id SERIAL PRIMARY KEY,
        advertiser_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        advertiser VARCHAR(120) NOT NULL,
        category VARCHAR(60) NOT NULL DEFAULT 'General',
        ad_type ad_type NOT NULL DEFAULT 'mp4',
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration_seconds INTEGER NOT NULL,
        reward_cents INTEGER NOT NULL,
        required_watch_percent INTEGER NOT NULL DEFAULT 95,
        max_views_per_user INTEGER NOT NULL DEFAULT 0,
        total_budget_cents INTEGER NOT NULL DEFAULT 0,
        remaining_budget_cents INTEGER NOT NULL DEFAULT 0,
        status ad_status NOT NULL DEFAULT 'pending_review',
        admin_note TEXT,
        network_name VARCHAR(60),
        network_zone_id VARCHAR(120),
        source VARCHAR(40) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    results.push("✅ ads table ready");

    // 4. Create ad_views table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ad_views (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
        session_token VARCHAR(64) NOT NULL,
        watched_seconds INTEGER NOT NULL DEFAULT 0,
        reward_cents INTEGER NOT NULL,
        status ad_view_status NOT NULL DEFAULT 'in_progress',
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ
      );
    `);
    results.push("✅ ad_views table ready");

    // 5. Create withdrawals table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount_cents INTEGER NOT NULL,
        method withdrawal_method NOT NULL,
        account_details TEXT NOT NULL,
        status withdrawal_status NOT NULL DEFAULT 'pending',
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ
      );
    `);
    results.push("✅ withdrawals table ready");

    // 6. Create advertiser_payments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS advertiser_payments (
        id SERIAL PRIMARY KEY,
        advertiser_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ad_id INTEGER REFERENCES ads(id) ON DELETE SET NULL,
        amount_cents INTEGER NOT NULL,
        status advertiser_payment_status NOT NULL DEFAULT 'pending',
        payment_ref VARCHAR(255),
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    results.push("✅ advertiser_payments table ready");

    // 7. Seed admin account (if no users exist)
    const userResult = await db.execute<{ count: number }>(
      sql`SELECT count(*)::int as count FROM users`
    );
    const userCount = userResult.rows[0]?.count ?? 0;
    if (userCount === 0) {
      const passwordHash = await hashPassword("Admin12345!");
      await db.execute(sql`
        INSERT INTO users (name, email, password_hash, role, country, withdrawal_activated, advertiser_approved)
        VALUES ('Site Admin', 'admin@watchads.local', ${passwordHash}, 'admin', 'United States', true, true)
      `);
      results.push("✅ Admin account created (admin@watchads.local / Admin12345!)");
    } else {
      results.push("ℹ️ Users already exist — skipped admin creation");
    }

    // 8. Seed sample ads (if no ads exist)
    const adResult = await db.execute<{ adCount: number }>(
      sql`SELECT count(*)::int as ad_count FROM ads`
    );
    const adCountNum = adResult.rows[0]?.adCount ?? 0;
    if (adCountNum === 0) {
      const sampleAds = [
        { title: "NovaBank — Banking that fits your life", advertiser: "NovaBank", category: "Finance", description: "All-in-one banking app with 4.8% APY savings and instant transfers.", at: "mp4", dur: 30, reward: 75, maxPerUser: 3, budget: 100000, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", thumb: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg" },
        { title: "StreamVerse — Watch anywhere, on any device", advertiser: "StreamVerse", category: "Entertainment", description: "Binge-worthy series and award-winning films. Free 30-day trial.", at: "mp4", dur: 45, reward: 120, maxPerUser: 2, budget: 80000, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", thumb: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg" },
        { title: "EcoWear — Sustainable fashion", advertiser: "EcoWear", category: "Shopping", description: "Organic cotton, recycled denim, carbon-neutral shipping.", at: "mp4", dur: 60, reward: 180, maxPerUser: 1, budget: 60000, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", thumb: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg" },
        { title: "TrekMate — Plan the perfect adventure", advertiser: "TrekMate", category: "Travel", description: "Curated hiking trails and offline maps across 60+ countries.", at: "mp4", dur: 25, reward: 60, maxPerUser: 5, budget: 120000, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", thumb: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg" },
        { title: "Mindful — Meditation that works", advertiser: "Mindful Labs", category: "Health", description: "10-min daily sessions, sleep stories and focus music.", at: "mp4", dur: 75, reward: 220, maxPerUser: 1, budget: 50000, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", thumb: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg" },
        { title: "LearnHive — Master a skill in 15 min/day", advertiser: "LearnHive", category: "Education", description: "Thousands of courses in coding, design and marketing. 50% off annual.", at: "mp4", dur: 90, reward: 260, maxPerUser: 1, budget: 40000, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", thumb: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg" },
        { title: "FreshBite — Meals in 20 minutes", advertiser: "FreshBite", category: "Food", description: "Chef-crafted salads, bowls and wraps. Free delivery first 3 orders.", at: "mp4", dur: 40, reward: 100, maxPerUser: 2, budget: 70000, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", thumb: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg" },
        { title: "PulseFit — AI home workout coach", advertiser: "PulseFit", category: "Health", description: "Real-time form correction, 2,000+ classes. Try PulseFit Pro for $1.", at: "mp4", dur: 50, reward: 140, maxPerUser: 1, budget: 30000, video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", thumb: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg" },
        { title: "Big Buck Bunny (YouTube Demo)", advertiser: "Blender Foundation", category: "Entertainment", description: "Iconic open-source animated short. Demo of YouTube ad integration.", at: "youtube", dur: 30, reward: 90, maxPerUser: 2, budget: 50000, video: "aqz-KE-bpKQ", thumb: "https://img.youtube.com/vi/aqz-KE-bpKQ/maxresdefault.jpg" },
      ];

      for (const a of sampleAds) {
        await db.execute(sql`
          INSERT INTO ads (title, advertiser, category, description, ad_type, duration_seconds, reward_cents, max_views_per_user, total_budget_cents, remaining_budget_cents, video_url, thumbnail_url, status, source)
          VALUES (${a.title}, ${a.advertiser}, ${a.category}, ${a.description}, ${a.at}::ad_type, ${a.dur}, ${a.reward}, ${a.maxPerUser}, ${a.budget}, ${a.budget}, ${a.video}, ${a.thumb}, 'active', 'admin')
        `);
      }
      results.push(`✅ ${sampleAds.length} sample ads created`);
    } else {
      results.push(`ℹ️ ${adCountNum} ads already exist — skipped seeding`);
    }

    // Build summary
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WatchAds Setup</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#070a12; color:#f0f2fb; font-family:system-ui,-apple-system,sans-serif; display:grid; place-items:center; min-height:100vh; }
  .card { background:#131726; border:1px solid #1f2540; border-radius:16px; padding:40px; max-width:600px; width:100%; }
  h1 { font-size:1.8rem; margin-bottom:8px; }
  .ok { color:#22d4a0; }
  .log { margin-top:20px; background:#0e1120; border-radius:10px; padding:16px; font-family:monospace; font-size:0.85rem; line-height:1.8; }
  .next { margin-top:24px; display:flex; flex-direction:column; gap:12px; }
  .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:12px 24px; border-radius:10px; font-weight:700; font-size:0.95rem; text-decoration:none; transition:all .15s; }
  .btn-primary { background:#7c5cff; color:#fff; }
  .btn-primary:hover { background:#6b4cf0; }
  .btn-secondary { background:transparent; color:#f0f2fb; border:1px solid #1f2540; }
  .btn-secondary:hover { background:#181d2e; }
  .warn { background:rgba(245,165,36,0.1); border:1px solid rgba(245,165,36,0.3); border-radius:10px; padding:12px; font-size:0.85rem; color:#f5a524; margin-top:16px; }
  strong { color:#fff; }
</style></head>
<body>
<div class="card">
  <h1>🚀 <span class="ok">Database Setup Complete!</span></h1>
  <p style="color:#9ba3bf;margin-top:4px">Your WatchAds database is ready.</p>
  <div class="log">${results.map(r => `<div>${r}</div>`).join("")}</div>
  <div class="warn">
    ⚠️ <strong>Change your admin password!</strong><br>
    Log in with <strong>admin@watchads.local</strong> / <strong>Admin12345!</strong><br>
    Then change it immediately.
  </div>
  <div class="next">
    <a href="/login" class="btn btn-primary">🔐 Log in as Admin →</a>
    <a href="/" class="btn btn-secondary">🏠 Visit Homepage</a>
  </div>
</div>
</body></html>`;

    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Setup Error</title>
<style>
  body { background:#070a12; color:#f0f2fb; font-family:system-ui; display:grid; place-items:center; min-height:100vh; }
  .card { background:#131726; border:1px solid #1f2540; border-radius:16px; padding:40px; max-width:600px; }
  h1 { color:#f04469; }
  pre { background:#0e1120; padding:16px; border-radius:10px; margin-top:16px; font-size:0.8rem; overflow-x:auto; color:#f04469; }
  .hint { margin-top:16px; padding:16px; background:rgba(245,165,36,0.1); border:1px solid rgba(245,165,36,0.3); border-radius:10px; color:#f5a524; font-size:0.85rem; line-height:1.6; }
</style></head>
<body>
<div class="card">
  <h1>❌ Setup Failed</h1>
  <p style="color:#9ba3bf;margin-top:8px">The database could not be set up. This usually means your DATABASE_URL is missing or incorrect.</p>
  <pre>${message}</pre>
  <div class="hint">
    <strong>🛠️ How to fix:</strong><br>
    1. Go to <strong>Vercel Dashboard → Settings → Environment Variables</strong><br>
    2. Make sure <strong>DATABASE_URL</strong> is set and correct<br>
    3. If you just added it, click <strong>Redeploy</strong> (env vars only take effect after redeploy)<br>
    4. Then visit <strong>/api/setup</strong> again
  </div>
</div>
</body></html>`;

    return new Response(html, {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
}
