# 💰 WatchAds — Get Paid to Watch Video Ads

A full-stack platform where users earn real cash by watching video ads (MP4, YouTube, and 12+ ad networks like Monetag, Adsterra, PropellerAds). Built with Next.js, Drizzle ORM and PostgreSQL.

---

## ✨ Features

- 🎬 **3 ad formats** — MP4 video, YouTube embed, and 12+ ad networks
- ✅ **Watch verification** — server-verified that users finish the video before paying
- 💸 **4 payout methods** — PayPal, bank transfer, crypto (USDT), gift cards
- 🌍 **190+ countries** supported
- 🏢 **Advertiser portal** — businesses self-serve and create campaigns
- ⚡ **Admin console** — manage ads, users, withdrawals & ad networks
- 📡 **12 ad networks** — Monetag, HilltopAds, PopAds, Adsterra, PropellerAds, MGID, RevContent, Infolinks, TrafficJunky, ExoClick, AdCash & more

---

## 🚀 Deploy to Vercel (Free)

### 1. Push this repo to GitHub
Already done if you're reading this on GitHub! ✅

### 2. Create a Postgres database
Use any of these free options:
- **[Supabase](https://supabase.com)** (recommended — 500MB free, great dashboard)
- **[Neon](https://neon.tech)** (free serverless Postgres)
- **Vercel Postgres** (built into Vercel)

Copy your connection string (starts with `postgresql://`).

### 3. Deploy on Vercel
1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Import this GitHub repository
3. **Before deploying**, add these Environment Variables:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Your Postgres connection string |
   | `AUTH_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |

4. Click **Deploy** ⚡

### 4. Set up the database
After the first deploy finishes, run these locally:

```bash
# Install Vercel CLI
npm install -g vercel

# Link & pull env vars
vercel link
vercel env pull .env.local

# Create the database tables
npx drizzle-kit push

# Seed sample ads + admin account
curl -X POST https://YOUR-APP.vercel.app/api/seed
```

### 5. Done! 🎉
Visit your site and log in as admin.

---

## 🔐 Default Admin Login

```
URL:      https://YOUR-APP.vercel.app/login
Email:    admin@watchads.local
Password: Admin12345!
```

> ⚠️ **Change this password immediately after first login!**
> Run `node -e "require('bcryptjs').hash('YourNewPassword',10).then(console.log)"`
> then update it in your database `users` table.

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your values
cp .env.example .env

# 3. Push database schema
npx drizzle-kit push

# 4. Start dev server
npm run dev

# 5. Seed the database (in another terminal)
curl -X POST http://localhost:3000/api/seed
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📂 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── dashboard/            # Viewer dashboard (browse ads)
│   ├── watch/[id]/           # Watch ad & earn page
│   ├── history/              # Earnings history
│   ├── withdraw/             # Withdraw funds
│   ├── advertiser/           # Advertiser portal
│   ├── admin/                # Admin console + ad networks
│   └── api/                  # All backend routes
├── components/               # React components
├── db/
│   ├── schema.ts             # Database tables (Drizzle)
│   └── index.ts              # DB connection
└── lib/
    ├── auth.ts               # Authentication
    ├── adNetworks.ts         # 12 ad network configs
    └── ...
```

---

## ✅ How Watch Verification Works

Users **cannot** get paid without watching the full ad:

1. **Server timer lock** — session expires at `start + duration + 5s`. Early claims are rejected.
2. **Heartbeat tracking** — client reports watch time every 4s; server keeps the MAX value.
3. **95% requirement** — must watch ≥95% of the video to earn.
4. **Atomic claim** — reward is credited only after all checks pass, in one transaction.
5. **Per-user limits** — prevents farming the same ad repeatedly.

---

## 💰 Business Model

| Revenue source | How it works |
|----------------|--------------|
| **Advertiser fees** | Charge businesses per campaign; pay viewers less; keep the margin |
| **Ad network revenue** | Earn CPM from Monetag, Adsterra, etc.; subsidize viewer rewards |

**Example:** Advertiser pays $200 → viewers earn $150 → you keep **$50 profit** (+ ad network CPM on top).

---

## 🧰 Tech Stack

- **Next.js 16** (App Router)
- **PostgreSQL** + **Drizzle ORM**
- **Tailwind CSS 4**
- **JWT auth** (jose) + **bcrypt**
- **Zod** validation

---

## 📜 License

MIT — free to use and modify.
