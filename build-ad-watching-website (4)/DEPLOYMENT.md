# 🚀 WatchAds — Go Live Guide

## 📋 Pre-Launch Checklist

### 1. ✅ Admin Access
**Default Admin Account (created automatically on first seed):**
- **Email:** `admin@watchads.local`
- **Password:** `Admin12345!`
- **Login URL:** `https://your-domain.com/login`

> **Change this password immediately after first login!**

---

## 🌐 How to Publish & Go Live

### Option A: Deploy to Vercel (Recommended — Free)

#### Step 1 — Push to GitHub
```bash
# Initialize git repo
git init
git add .
git commit -m "Initial WatchAds deployment"

# Create GitHub repo at github.com/new (name: watchads)
git remote add origin https://github.com/YOUR_USERNAME/watchads.git
git push -u origin main
```

#### Step 2 — Deploy to Vercel
1. Go to **[vercel.com](https://vercel.com)** → Sign up with GitHub
2. Click **"Add New Project"** → Import your `watchads` repo
3. Vercel auto-detects Next.js — click **Deploy**
4. **Add PostgreSQL database:**
   - In Vercel dashboard → Storage → Create Database → **Neon Postgres** (free)
   - Copy the `DATABASE_URL` connection string

#### Step 3 — Set Environment Variables
In Vercel → Project Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
AUTH_SECRET=change-this-to-a-random-32-char-string
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

#### Step 4 — Push Schema & Seed
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Pull env vars locally
vercel env pull .env.local

# Push database schema
npx drizzle-kit push

# Seed with sample ads & admin
curl -X POST https://your-app.vercel.app/api/seed
```

✅ **Your site is live!** Visit `https://your-app.vercel.app`

---

### Option B: Deploy to Railway ($5/month — easier DB)

1. Go to **[railway.app](https://railway.app)**
2. New Project → Deploy from GitHub repo
3. Add **PostgreSQL** plugin (one click)
4. Railway auto-sets `DATABASE_URL`
5. Add env var: `AUTH_SECRET=your-random-string`
6. Deploy — Railway runs `npm run build` automatically

---

### Option C: Self-Host (VPS / DigitalOcean)

```bash
# On your server (Ubuntu)
sudo apt update
sudo apt install nodejs npm postgresql nginx

# Clone repo
git clone https://github.com/YOUR_USERNAME/watchads.git
cd watchads
npm install

# Create database
sudo -u postgres psql -c "CREATE DATABASE watchads;"
sudo -u postgres psql -c "CREATE USER watchads WITH PASSWORD 'securepass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE watchads TO watchads;"

# Set env
echo 'DATABASE_URL=postgresql://watchads:securepass@localhost/watchads' > .env
echo 'AUTH_SECRET=your-32-char-random-string' >> .env

# Build & start
npm run build
npm run start
# (use PM2 for production: npm i -g pm2 && pm2 start npm --name watchads -- start)
```

---

## 🔐 Admin Login Details

### Default Credentials (Change Immediately!)
```
URL: https://your-domain.com/login
Email: admin@watchads.local
Password: Admin12345!
```

### After Login → Admin Console
Go to: `https://your-domain.com/admin`

**What you can do:**
- ✅ Create/edit/delete ads (MP4, YouTube, 12+ ad networks)
- ✅ Approve/reject advertiser campaigns
- ✅ Approve/reject user withdrawals
- ✅ View all users, earnings, stats
- ✅ Manage ad network integrations

### Change Admin Password
1. Login as admin
2. There's no UI for password change yet — use this SQL:
```sql
-- Generate new hash (use Node.js or bcrypt online generator)
-- Hash for "YourNewSecurePassword123!"
UPDATE users 
SET password_hash = '$2b$10$YOUR_NEW_BCRYPT_HASH_HERE'
WHERE email = 'admin@watchads.local';
```

Or create a new admin user:
```sql
INSERT INTO users (name, email, password_hash, role, country, withdrawal_activated, advertiser_approved)
VALUES ('Your Name', 'you@yourdomain.com', '$2b$10$...', 'admin', 'United States', true, true);
```

---

## ✅ Video Watch Verification — Already Built In

**Users MUST finish watching before being paid.** Here's how it works:

### Security Layers:

1. **Server-side timer lock**
   - When user clicks "Start watching", server creates a session with `expiresAt = startTime + duration + 5s buffer`
   - User CANNOT claim reward before `expiresAt` is reached (server rejects early requests)

2. **Heartbeat tracking**
   - Client sends `watchedSeconds` every 4 seconds via `/api/ads/[id]/heartbeat`
   - Server stores `MAX(watchedSeconds)` — users can't fake by sending 100 instantly

3. **Watch percentage requirement**
   - Default: **95% of video must be watched** (`requiredWatchPercent`)
   - For a 30s ad, user must watch at least 28.5s
   - Server checks: `watchedSeconds >= requiredSeconds` AND `now >= expiresAt`

4. **Atomic reward claim**
   - `POST /api/ads/[id]/complete` checks:
     - Session exists and is `in_progress`
     - Current time >= `expiresAt`
     - `watchedSeconds >= requiredSeconds`
     - Ad still has budget
   - Only then: deducts budget, credits user, marks session `completed`
   - All in a single atomic transaction — no race conditions

5. **Per-user limits**
   - `maxViewsPerUser` prevents farming (e.g., "max 3 views per user")
   - Server counts completed views before allowing new session

### Try it yourself:
1. Register as a viewer
2. Watch an ad for 5 seconds → try to claim → **rejected**
3. Wait full duration → claim → **reward credited instantly**

---

## 💰 Earning Real Cash — Business Model

### How YOU make money:

#### Revenue Stream 1: Advertiser Campaigns (Primary)
```
Advertiser pays you:     $200 budget
Viewers earn:            $150 total (rewards)
Your profit margin:      $50 (25%)
```

#### Revenue Stream 2: Ad Network Revenue (Secondary)
- Add Monetag, Adsterra, etc. network codes
- Networks pay you **$0.50–$6.00 per 1,000 views** (CPM)
- Use this to subsidize viewer rewards or as extra profit

### Pricing Strategy:
- **Charge advertisers:** $2.00–$3.00 per completed view (CPM $2,000–$3,000)
- **Pay viewers:** $0.50–$2.60 per view
- **Keep margin:** 20–40%

### Getting First Advertisers:
1. **Local businesses** — restaurants, gyms, salons (they pay $50–$200)
2. **Fiverr/Upwork** — offer "video ad promotion" gigs
3. **Facebook groups** — "Small business owners" groups
4. **Your own products** — promote your own services first

### Getting Viewers:
1. **TikTok/YouTube Shorts** — "Get paid to watch ads" videos
2. **Reddit** — r/beermoney, r/slavelabour
3. **WhatsApp/Telegram** — viral sharing
4. **Referral program** — pay $0.10 per referral (easy to add)

---

## 🔧 Post-Launch Setup

### 1. Change Admin Password
```bash
# Generate bcrypt hash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('YourNewPassword123!',10).then(console.log)"

# Update in DB
psql $DATABASE_URL -c "UPDATE users SET password_hash='\$2b\$10\$...' WHERE email='admin@watchads.local';"
```

### 2. Add Real Ads
- Go to `/admin` → **Ads tab** → **+ New ad**
- Or go to `/admin/networks` → add Monetag/Adsterra codes
- Or wait for advertisers to sign up at `/advertiser/register`

### 3. Configure Payout Methods
Edit `src/app/withdraw/page.tsx` to add your real PayPal email, crypto wallet, etc.

### 4. Add Terms & Privacy
Create pages at `/terms` and `/privacy` — required by PayPal and ad networks.

### 5. Monitor & Moderate
- Check `/admin` daily for withdrawal requests
- Approve advertiser accounts
- Review ad submissions
- Ban fraud users (set role to 'banned' in DB)

---

## 📊 Monitoring

### Key Metrics to Track:
- **Daily active users** (how many watch ads)
- **Completion rate** (should be >90%)
- **Avg reward per user** (keep it sustainable)
- **Advertiser ROI** (are they getting views?)
- **Withdrawal requests** (cash flow)

### Fraud Prevention:
- Watch time verification already built in
- Add: IP rate limiting, device fingerprinting
- Add: Minimum account age before withdrawal
- Add: Manual review for large withdrawals

---

## 🆘 Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` is set correctly
- For Neon/Supabase: add `?sslmode=require` to URL
- Run `npx drizzle-kit push` to create tables

### "No ads showing"
- Seed database: `POST /api/seed`
- Check ads have `status='active'` and `remaining_budget_cents > 0`
- Admin → Ads tab → check filters

### "Can't withdraw"
- Users must earn $1+ and activate withdrawals ($5 fee)
- Admin must approve withdrawal in `/admin` → Withdrawals tab

### "Ad video won't play"
- Check video URL is direct `.mp4` link (not a webpage)
- For YouTube: use video ID only (e.g. `dQw4w9WgXcQ`)
- For networks: test embed URL in browser first

---

## 📞 Support

Need help? The codebase is fully documented. Key files:
- `src/db/schema.ts` — database structure
- `src/lib/auth.ts` — authentication logic
- `src/app/api/ads/[id]/complete/route.ts` — reward verification logic
- `src/components/WatchView.tsx` — video player & timer

---

## 🎉 You're Ready to Launch!

1. ✅ Deploy to Vercel/Railway
2. ✅ Login as admin (`admin@watchads.local` / `Admin12345!`)
3. ✅ Change admin password
4. ✅ Seed ads or add your own
5. ✅ Share your link and start earning!

**Your preview is live at:** https://3000-iy0mksp00tv1gnsabpja8.e2b.app
