import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { ipFilterMiddleware } from "./middlewares/ipFilter";
import { apiRateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import { requestIdMiddleware } from "./middlewares/requestId";
import { sseManager } from "./lib/sse";
import { authenticateAdmin } from "./middlewares/auth";
import { swaggerDocument } from "./modules/docs/swagger";
import prisma from "@pharmacy-admin/db";
import { isRedisConnected, redis } from "./lib/redis";

// Module routes
import authRoutes from "./modules/auth/auth.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import productsRoutes from "./modules/products/products.routes";
import categoriesRoutes from "./modules/categories/categories.routes";
import brandsRoutes from "./modules/brands/brands.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import ordersRoutes from "./modules/orders/orders.routes";
import customersRoutes from "./modules/customers/customers.routes";
import couponsRoutes from "./modules/coupons/coupons.routes";
import bannersRoutes from "./modules/banners/banners.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import invoicesRoutes from "./modules/invoices/invoices.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import staffRoutes from "./modules/staff/staff.routes";
import auditRoutes from "./modules/audit/audit.routes";
import labTestsRoutes from "./modules/labTests/labTests.routes";
import reviewsRoutes from "./modules/reviews/reviews.routes";

const app = express();

// Request ID for distributed tracing (Playbook Layer 13)
app.use(requestIdMiddleware);

// Security & Parsing
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

// Global IP Filter & Rate Limiter
app.use(ipFilterMiddleware);
app.use("/api/v1", apiRateLimiter);

// Prevent caching of administrative and tenant data at shared layers (Pre-launch Checklist Item 11)
app.use("/api/v1", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// OpenAPI Swagger Docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Lightweight liveness probe for load balancers
app.get(["/health", "/api/health/live"], (_req, res) => {
  res.status(200).json({ status: "ok", service: "pharmacy-admin-api", time: new Date().toISOString() });
});

// Deep readiness & component health check (Playbook Layer 14)
app.get(["/api/health", "/api/v1/health"], async (_req, res) => {
  let dbStatus = "HEALTHY";
  let redisStatus = "HEALTHY";
  let dbLatencyMs = 0;

  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbStatus = "DOWN";
  }

  if (isRedisConnected) {
    try {
      await redis.ping();
    } catch {
      redisStatus = "DOWN";
    }
  } else {
    redisStatus = "STANDALONE_OFFLINE";
  }

  const isOperational = dbStatus === "HEALTHY";
  res.status(isOperational ? 200 : 503).json({
    status: isOperational ? "OPERATIONAL" : "DEGRADED",
    service: "pharmacy-admin-api",
    timestamp: new Date().toISOString(),
    components: {
      database: { status: dbStatus, latencyMs: dbLatencyMs },
      redis: { status: redisStatus },
      mainStorefront: { targetUrl: env.MAIN_SITE_URL },
    },
  });
});

// SSE Real-time Events endpoint
app.get("/api/v1/events", authenticateAdmin, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = `sse_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  sseManager.addClient(clientId, req.admin!.adminUserId, res);
});

// Mount Domain Routes under /api/v1/*
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/categories", categoriesRoutes);
app.use("/api/v1/brands", brandsRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/orders", ordersRoutes);
app.use("/api/v1/customers", customersRoutes);
app.use("/api/v1/coupons", couponsRoutes);
app.use("/api/v1/banners", bannersRoutes);
app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/invoices", invoicesRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/staff", staffRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/lab-tests", labTestsRoutes);
app.use("/api/v1/reviews", reviewsRoutes);

// Centralized error handler
app.use(errorHandler);

export default app;
