import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5001),
  DATABASE_URL: z.string().default(process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/medico_db?schema=public"),
  DIRECT_URL: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  MAIN_SITE_URL: z.string().url().default("http://localhost:3000"),
  REVALIDATE_SECRET: z.string().min(16).default("pharmacy_revalidate_secret_super_secure_token_2026"),
  INTERNAL_API_KEY: z.string().min(16).default("pharmacy_internal_api_key_for_webhook_replay_2026"),
  JWT_ACCESS_SECRET: z.string().min(32).default("pharmacy_admin_jwt_access_secret_min_32_characters_long_key"),
  JWT_REFRESH_SECRET: z.string().min(32).default("pharmacy_admin_jwt_refresh_secret_min_32_characters_long_key"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  COOKIE_DOMAIN: z.string().default("localhost"),
  CORS_ORIGIN: z.string().default("http://localhost:3001"),
  ADMIN_ALLOWED_IPS: z.string().optional().default(""),
  RAZORPAY_KEY_ID: z.string().optional().default("rzp_test_placeholder"),
  RAZORPAY_KEY_SECRET: z.string().optional().default("rzp_secret_placeholder"),
  SMTP_HOST: z.string().optional().default("smtp.mailtrap.io"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("Pharmacy Admin <admin@pharmacy.com>"),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default("rzp_webhook_secret_placeholder"),
  SENTRY_DSN: z.string().optional().default(""),
});

export const env = envSchema.parse(process.env);
