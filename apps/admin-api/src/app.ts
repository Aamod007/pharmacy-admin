import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { ipFilterMiddleware } from "./middlewares/ipFilter";
import { apiRateLimiter } from "./middlewares/rateLimiter";
import { errorHandler } from "./middlewares/errorHandler";
import { sseManager } from "./lib/sse";
import { authenticateAdmin } from "./middlewares/auth";
import { swaggerDocument } from "./modules/docs/swagger";

// Module routes
import authRoutes from "./modules/auth/auth.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import productsRoutes from "./modules/products/products.routes";
import categoriesRoutes from "./modules/categories/categories.routes";
import brandsRoutes from "./modules/brands/brands.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import ordersRoutes from "./modules/orders/orders.routes";
import prescriptionsRoutes from "./modules/prescriptions/prescriptions.routes";
import customersRoutes from "./modules/customers/customers.routes";
import couponsRoutes from "./modules/coupons/coupons.routes";
import bannersRoutes from "./modules/banners/banners.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import invoicesRoutes from "./modules/invoices/invoices.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import staffRoutes from "./modules/staff/staff.routes";
import auditRoutes from "./modules/audit/audit.routes";
import labTestsRoutes from "./modules/labTests/labTests.routes";
import consultationsRoutes from "./modules/consultations/consultations.routes";
import reviewsRoutes from "./modules/reviews/reviews.routes";

const app = express();

// Security & Parsing
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || (env.NODE_ENV === "development" && origin.includes("localhost"))) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

// Global IP Filter & Rate Limiter
app.use(ipFilterMiddleware);
app.use("/api/v1", apiRateLimiter);

// OpenAPI Swagger Docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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
app.use("/api/v1/prescriptions", prescriptionsRoutes);
app.use("/api/v1/customers", customersRoutes);
app.use("/api/v1/coupons", couponsRoutes);
app.use("/api/v1/banners", bannersRoutes);
app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/invoices", invoicesRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/staff", staffRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/lab-tests", labTestsRoutes);
app.use("/api/v1/consultations", consultationsRoutes);
app.use("/api/v1/reviews", reviewsRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "pharmacy-admin-api", time: new Date().toISOString() });
});

// Centralized error handler
app.use(errorHandler);

export default app;
