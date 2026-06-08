import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "advertiser"]);
export const adStatusEnum = pgEnum("ad_status", [
  "pending_review", // advertiser submitted, waiting admin approval
  "active",
  "paused",
  "ended",
  "rejected",
]);
export const adTypeEnum = pgEnum("ad_type", [
  "mp4",           // direct MP4 / hosted video URL
  "youtube",       // YouTube video embed
  "network",       // generic third-party ad-network embed
  "monetag",       // Monetag In-Page Push / Video
  "hilltopads",    // HilltopAds
  "popads",        // PopAds
  "adsterra",      // Adsterra
  "propellerads",  // PropellerAds
  "mgid",          // MGID
  "revcontent",    // RevContent
  "infolinks",     // Infolinks
  "trafficjunky",  // TrafficJunky
  "exoclick",      // ExoClick
  "adcash",        // AdCash
]);
export const adViewStatusEnum = pgEnum("ad_view_status", [
  "in_progress",
  "completed",
  "abandoned",
]);
export const withdrawalMethodEnum = pgEnum("withdrawal_method", [
  "paypal",
  "bank",
  "crypto",
  "gift_card",
]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "approved",
  "rejected",
  "paid",
]);
export const advertiserPaymentStatusEnum = pgEnum("advertiser_payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  country: varchar("country", { length: 120 }).notNull().default("United States"),
  balanceCents: integer("balance_cents").notNull().default(0),
  lifetimeEarningsCents: integer("lifetime_earnings_cents").notNull().default(0),
  withdrawalActivated: boolean("withdrawal_activated").notNull().default(false),
  role: userRoleEnum("role").notNull().default("user"),
  // Advertiser-specific fields (used when role = "advertiser")
  companyName: varchar("company_name", { length: 200 }),
  companyWebsite: text("company_website"),
  advertiserApproved: boolean("advertiser_approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Ads ──────────────────────────────────────────────────────────────────────
export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  // Who owns the ad
  advertiserId: integer("advertiser_id").references(() => users.id, {
    onDelete: "set null",
  }),
  // Basic info
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  advertiser: varchar("advertiser", { length: 120 }).notNull(),
  category: varchar("category", { length: 60 }).notNull().default("General"),
  // Video type and content
  adType: adTypeEnum("ad_type").notNull().default("mp4"),
  videoUrl: text("video_url").notNull(),           // mp4 URL or YouTube video ID or network embed code
  thumbnailUrl: text("thumbnail_url"),
  // Timing & rewards
  durationSeconds: integer("duration_seconds").notNull(),
  rewardCents: integer("reward_cents").notNull(),
  requiredWatchPercent: integer("required_watch_percent").notNull().default(95),
  // Limits
  maxViewsPerUser: integer("max_views_per_user").notNull().default(0),
  totalBudgetCents: integer("total_budget_cents").notNull().default(0),
  remainingBudgetCents: integer("remaining_budget_cents").notNull().default(0),
  // Status
  status: adStatusEnum("status").notNull().default("pending_review"),
  adminNote: text("admin_note"),
  // Network ad settings (used when adType = "network")
  networkName: varchar("network_name", { length: 60 }),
  networkZoneId: varchar("network_zone_id", { length: 120 }),
  // Source tag so admin can filter
  source: varchar("source", { length: 40 }).notNull().default("admin"), // "admin" | "advertiser" | "network"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Ad Payment (advertiser deposits budget) ─────────────────────────────────
export const advertiserPayments = pgTable("advertiser_payments", {
  id: serial("id").primaryKey(),
  advertiserId: integer("advertiser_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  adId: integer("ad_id").references(() => ads.id, { onDelete: "set null" }),
  amountCents: integer("amount_cents").notNull(),
  status: advertiserPaymentStatusEnum("status").notNull().default("pending"),
  // Payment reference (Stripe PaymentIntent ID, manual ref, etc.)
  paymentRef: varchar("payment_ref", { length: 255 }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Ad Views ─────────────────────────────────────────────────────────────────
export const adViews = pgTable("ad_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  adId: integer("ad_id")
    .notNull()
    .references(() => ads.id, { onDelete: "cascade" }),
  sessionToken: varchar("session_token", { length: 64 }).notNull(),
  watchedSeconds: integer("watched_seconds").notNull().default(0),
  rewardCents: integer("reward_cents").notNull(),
  status: adViewStatusEnum("status").notNull().default("in_progress"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ─── Withdrawals ──────────────────────────────────────────────────────────────
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  method: withdrawalMethodEnum("method").notNull(),
  accountDetails: text("account_details").notNull(),
  status: withdrawalStatusEnum("status").notNull().default("pending"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

// ─── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  adViews: many(adViews),
  withdrawals: many(withdrawals),
  ownedAds: many(ads),
  payments: many(advertiserPayments),
}));

export const adsRelations = relations(ads, ({ one, many }) => ({
  advertiserUser: one(users, {
    fields: [ads.advertiserId],
    references: [users.id],
  }),
  views: many(adViews),
  payments: many(advertiserPayments),
}));

export const adViewsRelations = relations(adViews, ({ one }) => ({
  user: one(users, { fields: [adViews.userId], references: [users.id] }),
  ad: one(ads, { fields: [adViews.adId], references: [ads.id] }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, { fields: [withdrawals.userId], references: [users.id] }),
}));

export const advertiserPaymentsRelations = relations(advertiserPayments, ({ one }) => ({
  advertiser: one(users, { fields: [advertiserPayments.advertiserId], references: [users.id] }),
  ad: one(ads, { fields: [advertiserPayments.adId], references: [ads.id] }),
}));

// ─── Type exports ─────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Ad = typeof ads.$inferSelect;
export type NewAd = typeof ads.$inferInsert;
export type AdView = typeof adViews.$inferSelect;
export type NewAdView = typeof adViews.$inferInsert;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type NewWithdrawal = typeof withdrawals.$inferInsert;
export type AdvertiserPayment = typeof advertiserPayments.$inferSelect;

export { sql };
