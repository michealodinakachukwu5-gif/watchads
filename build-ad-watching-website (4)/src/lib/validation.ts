import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password is too long");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const startAdSchema = z.object({
  adId: z.number().int().positive(),
});

export const heartbeatSchema = z.object({
  sessionToken: z.string().min(8).max(64),
  watchedSeconds: z.number().int().min(0),
});

export const completeAdSchema = z.object({
  sessionToken: z.string().min(8).max(64),
  watchedSeconds: z.number().int().min(0),
});

export const createAdSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(2000),
  advertiser: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(60).default("General"),
  durationSeconds: z.number().int().min(5).max(60 * 30),
  rewardCents: z.number().int().min(1).max(100000),
  videoUrl: z.string().url("Video URL must be a valid URL"),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  requiredWatchPercent: z.number().int().min(50).max(100).default(95),
  maxViewsPerUser: z.number().int().min(0).max(1000).default(0),
  totalBudgetCents: z.number().int().min(0).max(100000000).default(0),
});

export const withdrawalSchema = z.object({
  amountCents: z.number().int().min(100, "Minimum withdrawal is $1.00"),
  method: z.enum(["paypal", "bank", "crypto", "gift_card"]),
  accountDetails: z.string().trim().min(4).max(500),
});
