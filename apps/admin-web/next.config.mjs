/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents duplicate double-invoking of useEffect and double API calls in dev
  transpilePackages: ["@pharmacy-admin/shared", "@pharmacy-admin/admin-api", "@pharmacy-admin/db"],
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "bcryptjs",
    "ioredis",
    "bullmq",
    "exceljs",
    "pdf-lib",
    "nodemailer",
    "jsonwebtoken",
    "otplib",
    "cloudinary",
    "razorpay",
    "multer",
    "qrcode",
    "swagger-ui-express",
    "helmet",
    "express",
    "express-rate-limit",
    "cookie-parser",
    "cors",
    "dotenv",
  ],
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;
