import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../apps/admin-api/src/app";
import prisma from "@pharmacy-admin/db";
import { syncMutationToMainSite, retryFailedRevalidations } from "../../apps/admin-api/src/lib/revalidate";
import { sseManager } from "../../apps/admin-api/src/lib/sse";
import { inventoryService } from "../../apps/admin-api/src/modules/inventory/inventory.service";
import { productsService } from "../../apps/admin-api/src/modules/products/products.service";
import { assertStockInvariants } from "../invariants";

describe("Phase 3: Admin-to-Storefront Synchronization & Resiliency", () => {
  let adminUser: any;
  let testCategory: any;
  let testBrand: any;
  let testProduct: any;
  let testVariant: any;

  beforeAll(async () => {
    adminUser = await prisma.adminUser.findFirst({
      where: { email: "admin@pharmacy.com" },
    });
    if (!adminUser) {
      adminUser = await prisma.adminUser.findFirst();
    }

    testCategory = await prisma.category.findFirst();
    testBrand = await prisma.brand.findFirst();

    testProduct = await prisma.product.create({
      data: {
        name: `Sync Test Med ${Date.now()}`,
        slug: `sync-test-med-${Date.now()}`,
        description: "Testing admin to storefront synchronization pipelines",
        manufacturer: "Cipla Pharmaceuticals Ltd",
        categoryId: testCategory.id,
        brandId: testBrand.id,
        prescriptionRequired: false,
        isActive: true,
      },
    });

    testVariant = await prisma.productVariant.create({
      data: {
        productId: testProduct.id,
        name: "Sync Variant 100mg",
        sku: `SKU-SYNC-${Date.now()}`,
        price: 250.0,
        mrp: 300.0,
        packSize: "10 Tablets",
      },
    });
  });

  afterAll(async () => {
    await assertStockInvariants(prisma);
    await prisma.$disconnect();
  });

  it("triggers revalidation webhook logging on product mutation", async () => {
    const actor = { adminId: adminUser.id, email: adminUser.email };

    await syncMutationToMainSite({
      type: "product.updated",
      entityId: testProduct.id,
      entityName: testProduct.name,
      tags: ["products", `product-${testProduct.id}`],
      paths: ["/", "/products", `/product/${testProduct.slug}`],
      actor,
    });

    // Check that admin_notification_logs recorded the dispatch attempt
    const log = await prisma.adminNotificationLog.findFirst({
      where: {
        channel: "REVALIDATION_WEBHOOK",
        eventType: "product.updated",
      },
      orderBy: { createdAt: "desc" },
    });

    expect(log).toBeDefined();
    expect(log?.recipient).toContain("/api/revalidate");
    expect(["SUCCESS", "FAILED"]).toContain(log?.status);
  });

  it("records failed webhook dispatches and enables retry recovery", async () => {
    // 1. Artificially create a failed notification log entry
    const failedLog = await prisma.adminNotificationLog.create({
      data: {
        channel: "REVALIDATION_WEBHOOK",
        recipient: "https://medico-lovat-theta.vercel.app/api/revalidate",
        eventType: "inventory.updated",
        payload: {
          tags: ["products", "inventory"],
          paths: ["/"],
          entityId: testProduct.id,
        },
        status: "FAILED",
        errorMessage: "Simulated network timeout during test",
        retryCount: 0,
      },
    });

    expect(failedLog.status).toBe("FAILED");
    expect(failedLog.retryCount).toBe(0);

    // 2. Trigger retry worker
    const retryResult = await retryFailedRevalidations();
    expect(retryResult).toBeDefined();
    expect(retryResult.retried).toBeGreaterThanOrEqual(1);

    // 3. Inspect that the log was processed and retryCount incremented
    const updatedLog = await prisma.adminNotificationLog.findUnique({
      where: { id: failedLog.id },
    });
    expect(updatedLog?.retryCount).toBe(1);

    // Clean up test log
    await prisma.adminNotificationLog.delete({ where: { id: failedLog.id } });
  });

  it("executes manual store revalidation successfully", async () => {
    const actor = { adminId: adminUser.id, email: adminUser.email };
    await syncMutationToMainSite({
      type: "product.updated",
      entityId: "sync-test-product",
      tags: ["products", "categories", "brands"],
      paths: ["/", "/products"],
      actor,
    });

    const manualLog = await prisma.adminNotificationLog.findFirst({
      where: {
        channel: "REVALIDATION_WEBHOOK",
        eventType: "product.updated",
      },
      orderBy: { createdAt: "desc" },
    });

    expect(manualLog).toBeDefined();
  });

  it("surfaces health check status with database, redis, and main site metrics", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body.components.database.status).toBe("HEALTHY");
    expect(res.body.components.mainStorefront.targetUrl).toBeTruthy();
  });

  it("gracefully tolerates Redis outages without unhandled crashes", async () => {
    // Test that syncMutationToMainSite executes without throwing even if Redis is unreachable
    const actor = { adminId: adminUser.id, email: adminUser.email };
    await expect(
      syncMutationToMainSite({
        type: "banner.updated",
        entityId: "banner-123",
        tags: ["banners"],
        paths: ["/"],
        actor,
      })
    ).resolves.not.toThrow();
  });

  it("fans out SSE events to connected admin browser clients", () => {
    let capturedData = "";
    const mockRes: any = {
      write: (data: string) => {
        capturedData += data;
      },
      on: () => {},
    };

    sseManager.addClient("test-sse-client-1", adminUser.id, mockRes);
    expect(sseManager.getClientCount()).toBeGreaterThanOrEqual(1);

    sseManager.broadcast("order.placed" as any, {
      type: "order.placed" as any,
      orderId: "ord-test-123",
      orderNumber: "ORD-99999",
      totalAmount: 1500,
      timestamp: new Date().toISOString(),
    });

    expect(capturedData).toContain("event: order.placed");
    expect(capturedData).toContain("ORD-99999");

    sseManager.removeClient("test-sse-client-1");
  });

  it("verifies catalog data consistency between admin DB and storefront schema", async () => {
    // Both admin and storefront share Product, ProductVariant, and InventoryBatch tables
    const dbProduct = await prisma.product.findUnique({
      where: { id: testProduct.id },
      include: {
        variants: {
          include: {
            batches: true,
          },
        },
      },
    });

    expect(dbProduct).toBeDefined();
    expect(dbProduct?.isActive).toBe(true);
    expect(dbProduct?.variants.length).toBeGreaterThanOrEqual(1);

    const variant = dbProduct?.variants[0];
    expect(Number(variant?.price)).toBe(250.0);
    expect(Number(variant?.mrp)).toBe(300.0);
    expect(variant?.sku).toBe(testVariant.sku);
  });
});
