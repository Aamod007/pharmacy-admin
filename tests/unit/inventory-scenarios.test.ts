import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "@pharmacy-admin/db";
import { inventoryService } from "../../apps/admin-api/src/modules/inventory/inventory.service";
import { ordersService } from "../../apps/admin-api/src/modules/orders/orders.service";
import { assertStockInvariants } from "../invariants";
import { OrderStatus } from "@pharmacy-admin/shared";

describe("Phase 2: Inventory Core & Statutory Invariants (S1 - S12, I1 - I6)", () => {
  let adminUser: any;
  let testSupplier: any;
  let testCategory: any;
  let testBrand: any;
  let testProduct: any;
  let testVariant: any;
  let testCustomer: any;
  let testAddress: any;

  beforeAll(async () => {
    // 1. Get or create test admin user
    adminUser = await prisma.adminUser.findFirst({
      where: { email: "inventory@pharmacy.com" },
    });
    if (!adminUser) {
      adminUser = await prisma.adminUser.findFirst();
    }

    // 2. Get or create test supplier
    testSupplier = await prisma.adminSupplier.findFirst();
    if (!testSupplier) {
      testSupplier = await prisma.adminSupplier.create({
        data: {
          name: `Test Supplier ${Date.now()}`,
          code: `SUP-${Date.now()}`,
          phone: "9876543210",
        },
      });
    }

    // 3. Find or create base catalog data
    testCategory = await prisma.category.findFirst();
    testBrand = await prisma.brand.findFirst();

    testProduct = await prisma.product.create({
      data: {
        name: `Test Medicine S2-S12 ${Date.now()}`,
        slug: `test-med-s2-s12-${Date.now()}`,
        description: "Test pharmaceutical product description for inventory scenarios",
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
        name: "500mg - 10 Tablets Strip",
        sku: `SKU-MED-${Date.now()}`,
        price: 150.0,
        mrp: 180.0,
        packSize: "10 Tablets",
      },
    });

    // 4. Create customer & address for order interplay
    testCustomer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
    if (!testCustomer) {
      testCustomer = await prisma.user.create({
        data: {
          name: "Test Patient",
          email: `patient-${Date.now()}@example.com`,
          phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
        },
      });
    }

    testAddress = await prisma.address.findFirst({ where: { userId: testCustomer.id } });
    if (!testAddress) {
      testAddress = await prisma.address.create({
        data: {
          userId: testCustomer.id,
          fullName: "Test Patient",
          phone: testCustomer.phone,
          addressLine1: "123 Medical Enclave",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
        },
      });
    }
  }, 30000);

  afterAll(async () => {
    // Assert all invariants hold across entire DB after suite
    await assertStockInvariants(prisma);
    await prisma.$disconnect();
  });

  // --------------------------------------------------------------------------
  // S2: BATCH MANAGEMENT
  // --------------------------------------------------------------------------
  describe("S2: Batch Management & Intake Validation", () => {
    const actor = { adminId: "", email: "inventory@pharmacy.com" };

    beforeAll(() => {
      actor.adminId = adminUser.id;
    });

    it("creates a new batch and writes initial stock movement", async () => {
      const mfgDate = new Date("2025-01-01");
      const expiryDate = new Date("2027-01-01");

      const batch = await inventoryService.createBatch(
        {
          variantId: testVariant.id,
          batchNumber: `BAT-S2-${Date.now()}`,
          mfgDate,
          expiryDate,
          quantity: 100,
          costPrice: 85.0,
          isBlocked: false,
        },
        actor
      );

      expect(batch).toBeDefined();
      expect(batch.quantity).toBe(100);

      // Verify stock movement
      const movement = await prisma.adminStockMovement.findFirst({
        where: { batchId: batch.id, type: "PURCHASE" },
      });
      expect(movement).toBeDefined();
      expect(movement?.quantity).toBe(100);
      expect(movement?.newStock).toBe(100);
      expect(movement?.reason).toBeTruthy();

      await assertStockInvariants(prisma);
    });

    it("rejects batch creation when expiry date is before or equal to mfg date", async () => {
      const mfgDate = new Date("2026-06-01");
      const expiryDate = new Date("2026-05-01"); // Before MFG

      await expect(
        inventoryService.createBatch(
          {
            variantId: testVariant.id,
            batchNumber: `INVALID-EXP-${Date.now()}`,
            mfgDate,
            expiryDate,
            quantity: 50,
            costPrice: 80.0,
          },
          actor
        )
      ).rejects.toThrow("Batch expiry date must be strictly after manufacturing date");
    });

    it("rejects intake of an already expired batch into active inventory", async () => {
      const mfgDate = new Date("2023-01-01");
      const expiryDate = new Date("2024-01-01"); // Expired in past

      await expect(
        inventoryService.createBatch(
          {
            variantId: testVariant.id,
            batchNumber: `EXPIRED-${Date.now()}`,
            mfgDate,
            expiryDate,
            quantity: 20,
            costPrice: 70.0,
          },
          actor
        )
      ).rejects.toThrow("Cannot receive already expired batch into active inventory");
    });

    it("rejects duplicate batch number for the same product variant", async () => {
      const batchNo = `DUP-${Date.now()}`;
      await inventoryService.createBatch(
        {
          variantId: testVariant.id,
          batchNumber: batchNo,
          mfgDate: new Date("2025-01-01"),
          expiryDate: new Date("2028-01-01"),
          quantity: 30,
          costPrice: 90.0,
        },
        actor
      );

      // Attempt duplicate creation
      await expect(
        inventoryService.createBatch(
          {
            variantId: testVariant.id,
            batchNumber: batchNo,
            mfgDate: new Date("2025-01-01"),
            expiryDate: new Date("2028-01-01"),
            quantity: 15,
            costPrice: 90.0,
          },
          actor
        )
      ).rejects.toThrow(`Batch number '${batchNo}' already exists for this medicine variant`);
    });

    it("updates batch metadata with mandatory statutory reason", async () => {
      const batch = await inventoryService.createBatch(
        {
          variantId: testVariant.id,
          batchNumber: `UPDT-${Date.now()}`,
          mfgDate: new Date("2025-01-01"),
          expiryDate: new Date("2028-01-01"),
          quantity: 25,
          costPrice: 80.0,
        },
        actor
      );

      const updated = await inventoryService.updateBatch(
        batch.id,
        {
          costPrice: 82.5,
          reason: "Supplier price revision notified via amendment note",
        },
        actor
      );

      expect(Number(updated.costPrice)).toBe(82.5);

      // Audit correction ledger created
      const correctionLog = await prisma.adminStockMovement.findFirst({
        where: { batchId: batch.id, type: "CORRECTION" },
      });
      expect(correctionLog).toBeDefined();
      expect(correctionLog?.reason).toContain("Supplier price revision");

      await assertStockInvariants(prisma);
    });

    it("blocks deletion of a batch with statutory sales history", async () => {
      // 1. Create a batch
      const batch = await inventoryService.createBatch(
        {
          variantId: testVariant.id,
          batchNumber: `SOLD-${Date.now()}`,
          mfgDate: new Date("2025-01-01"),
          expiryDate: new Date("2028-01-01"),
          quantity: 50,
          costPrice: 75.0,
        },
        actor
      );

      // 2. Record a simulated sale movement
      await prisma.adminStockMovement.create({
        data: {
          variantId: testVariant.id,
          batchId: batch.id,
          type: "SALE",
          quantity: 5,
          previousStock: 50,
          newStock: 45,
          reason: "Simulated Dispensation",
          createdByAdminId: actor.adminId,
        },
      });

      // Update quantity
      await prisma.inventoryBatch.update({
        where: { id: batch.id },
        data: { quantity: 45 },
      });

      // 3. Attempt deletion
      await expect(inventoryService.deleteBatch(batch.id, actor)).rejects.toThrow(
        "statutory sales history"
      );
    });
  });

  // --------------------------------------------------------------------------
  // S3: FEFO ALLOCATION (First-Expired, First-Out)
  // --------------------------------------------------------------------------
  describe("S3: Strict FEFO Order Allocation & Batch Splitting", () => {
    let fefoVariant: any;
    let bEarly: any;
    let bMid: any;
    let bLate: any;
    const actor = { adminId: "", email: "inventory@pharmacy.com" };

    beforeAll(async () => {
      actor.adminId = adminUser.id;

      fefoVariant = await prisma.productVariant.create({
        data: {
          productId: testProduct.id,
          name: "FEFO Strict Test Variant",
          sku: `SKU-FEFO-${Date.now()}`,
          price: 200.0,
          mrp: 250.0,
          packSize: "1 Bottle",
        },
      });

      // Batch 1: Expires in 30 days, qty = 10
      bEarly = await inventoryService.createBatch(
        {
          variantId: fefoVariant.id,
          batchNumber: `FEFO-EARLY-${Date.now()}`,
          mfgDate: new Date("2025-01-01"),
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          quantity: 10,
          costPrice: 100.0,
        },
        actor
      );

      // Batch 2: Expires in 90 days, qty = 20
      bMid = await inventoryService.createBatch(
        {
          variantId: fefoVariant.id,
          batchNumber: `FEFO-MID-${Date.now()}`,
          mfgDate: new Date("2025-01-01"),
          expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          quantity: 20,
          costPrice: 100.0,
        },
        actor
      );

      // Batch 3: Expires in 180 days, qty = 50
      bLate = await inventoryService.createBatch(
        {
          variantId: fefoVariant.id,
          batchNumber: `FEFO-LATE-${Date.now()}`,
          mfgDate: new Date("2025-01-01"),
          expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          quantity: 50,
          costPrice: 100.0,
        },
        actor
      );
    });

    it("splits an order across earliest-expiring batches in strict chronological sequence", async () => {
      // Order asks for 15 units.
      // Expected: 10 units from bEarly (all), 5 units from bMid, 0 units from bLate.
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-FEFO-${Date.now()}`,
          userId: testCustomer.id,
          addressId: testAddress.id,
          status: "PLACED",
          paymentStatus: "PAID",
          isPaid: true,
          subtotal: 3000.0,
          totalAmount: 3000.0,
          items: {
            create: [
              {
                variantId: fefoVariant.id,
                productName: testProduct.name,
                packSize: "1 Bottle",
                sku: fefoVariant.sku,
                price: 200.0,
                mrp: 250.0,
                gstRate: 12.0,
                gstAmount: 360.0,
                quantity: 15,
                subtotal: 3000.0,
              },
            ],
          },
        },
      });

      const allocations = await inventoryService.allocateFefoOrder(order.id, actor);

      expect(allocations).toHaveLength(2);
      expect(allocations[0].batchId).toBe(bEarly.id);
      expect(allocations[0].allocatedQty).toBe(10);

      expect(allocations[1].batchId).toBe(bMid.id);
      expect(allocations[1].allocatedQty).toBe(5);

      // Verify DB batch quantities after allocation
      const freshEarly = await prisma.inventoryBatch.findUnique({ where: { id: bEarly.id } });
      const freshMid = await prisma.inventoryBatch.findUnique({ where: { id: bMid.id } });
      const freshLate = await prisma.inventoryBatch.findUnique({ where: { id: bLate.id } });

      expect(freshEarly?.quantity).toBe(0); // 10 - 10 = 0
      expect(freshMid?.quantity).toBe(15);  // 20 - 5 = 15
      expect(freshLate?.quantity).toBe(50); // Unchanged 50

      await assertStockInvariants(prisma);
    });
  });

  // --------------------------------------------------------------------------
  // S4: PURCHASE ENTRY
  // --------------------------------------------------------------------------
  describe("S4: Purchase Entry & Supplier Invoicing", () => {
    const actor = { adminId: "", email: "inventory@pharmacy.com" };

    beforeAll(() => {
      actor.adminId = adminUser.id;
    });

    it("records supplier purchase entry, updates batch quantity, and computes GST correctly", async () => {
      const invNo = `INV-TEST-${Date.now()}`;
      const batchNo = `PUR-BAT-${Date.now()}`;

      const entry = await inventoryService.createPurchaseEntry(
        {
          supplierId: testSupplier.id,
          invoiceNumber: invNo,
          invoiceDate: new Date(),
          notes: "Regular monthly pharmaceutical stock replenishment",
          items: [
            {
              variantId: testVariant.id,
              batchNumber: batchNo,
              mfgDate: new Date("2025-01-01"),
              expiryDate: new Date("2027-12-31"),
              quantity: 200,
              costPrice: 75.0,
            },
          ],
        },
        actor
      );

      expect(entry).toBeDefined();
      expect(entry.invoiceNumber).toBe(invNo);
      expect(Number(entry.subtotal)).toBe(200 * 75.0); // 15000
      expect(Number(entry.taxAmount)).toBe(15000 * 0.12); // 1800
      expect(Number(entry.totalAmount)).toBe(16800);

      // Verify batch created with 200 units
      const batch = await prisma.inventoryBatch.findFirst({
        where: { variantId: testVariant.id, batchNumber: batchNo },
      });
      expect(batch).toBeDefined();
      expect(batch?.quantity).toBe(200);

      // Verify stock movement
      const movement = await prisma.adminStockMovement.findFirst({
        where: { batchId: batch?.id, referenceId: entry.id, type: "PURCHASE" },
      });
      expect(movement).toBeDefined();
      expect(movement?.quantity).toBe(200);

      await assertStockInvariants(prisma);
    });

    it("rejects duplicate supplier invoice number for the same supplier", async () => {
      const dupInv = `DUP-INV-${Date.now()}`;

      await inventoryService.createPurchaseEntry(
        {
          supplierId: testSupplier.id,
          invoiceNumber: dupInv,
          invoiceDate: new Date(),
          items: [
            {
              variantId: testVariant.id,
              batchNumber: `DUP-B1-${Date.now()}`,
              mfgDate: new Date("2025-01-01"),
              expiryDate: new Date("2028-01-01"),
              quantity: 10,
              costPrice: 50.0,
            },
          ],
        },
        actor
      );

      // Attempt duplicate invoice submission
      await expect(
        inventoryService.createPurchaseEntry(
          {
            supplierId: testSupplier.id,
            invoiceNumber: dupInv,
            invoiceDate: new Date(),
            items: [
              {
                variantId: testVariant.id,
                batchNumber: `DUP-B2-${Date.now()}`,
                mfgDate: new Date("2025-01-01"),
                expiryDate: new Date("2028-01-01"),
                quantity: 10,
                costPrice: 50.0,
              },
            ],
          },
          actor
        )
      ).rejects.toThrow(`Supplier invoice '${dupInv}' has already been processed`);
    });
  });

  // --------------------------------------------------------------------------
  // S5: STOCK ADJUSTMENT
  // --------------------------------------------------------------------------
  describe("S5: Statutory Stock Adjustment (Damage, Return, Correction)", () => {
    let adjBatch: any;
    const actor = { adminId: "", email: "inventory@pharmacy.com" };

    beforeAll(async () => {
      actor.adminId = adminUser.id;

      adjBatch = await inventoryService.createBatch(
        {
          variantId: testVariant.id,
          batchNumber: `ADJ-BAT-${Date.now()}`,
          mfgDate: new Date("2025-01-01"),
          expiryDate: new Date("2028-01-01"),
          quantity: 50,
          costPrice: 80.0,
        },
        actor
      );
    });

    it("adjusts stock downwards for damaged packaging with statutory reason", async () => {
      const result = await inventoryService.adjustStock(
        {
          batchId: adjBatch.id,
          variantId: testVariant.id,
          type: "DAMAGE",
          quantity: -5,
          reason: "Broken glass ampoules discovered during inspection",
        },
        actor
      );

      expect(result.previousStock).toBe(50);
      expect(result.newStock).toBe(45);

      const freshBatch = await prisma.inventoryBatch.findUnique({ where: { id: adjBatch.id } });
      expect(freshBatch?.quantity).toBe(45);

      await assertStockInvariants(prisma);
    });

    it("blocks adjustments that would result in negative stock (Invariant I1)", async () => {
      await expect(
        inventoryService.adjustStock(
          {
            batchId: adjBatch.id,
            variantId: testVariant.id,
            type: "DAMAGE",
            quantity: -100, // Exceeds 45 available
            reason: "Excessive write-off attempt",
          },
          actor
        )
      ).rejects.toThrow("Adjustment would result in negative stock");

      await assertStockInvariants(prisma);
    });
  });

  // --------------------------------------------------------------------------
  // S6: EXPIRY MANAGEMENT & WRITE-OFF
  // --------------------------------------------------------------------------
  describe("S6: Expiry Management & Statutory Write-Off", () => {
    let expBatch: any;
    const actor = { adminId: "", email: "inventory@pharmacy.com" };

    beforeAll(async () => {
      actor.adminId = adminUser.id;

      // Create a batch that has expired or is expiring
      expBatch = await prisma.inventoryBatch.create({
        data: {
          variantId: testVariant.id,
          batchNumber: `EXP-WO-${Date.now()}`,
          mfgDate: new Date("2023-01-01"),
          expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
          quantity: 25,
          costPrice: 60.0,
          isBlocked: false,
        },
      });

      await prisma.adminStockMovement.create({
        data: {
          variantId: testVariant.id,
          batchId: expBatch.id,
          type: "PURCHASE",
          quantity: 25,
          previousStock: 0,
          newStock: 25,
          reason: "Setup expired batch",
          createdByAdminId: actor.adminId,
        },
      });
    });

    it("quarantines and writes off expired stock to zero with EXPIRED ledger movement", async () => {
      const writtenOff = await inventoryService.writeOffBatch(
        expBatch.id,
        "Statutory pharmaceutical disposal under Pharmacist Supervision",
        actor
      );

      expect(writtenOff.quantity).toBe(0);
      expect(writtenOff.isBlocked).toBe(true);

      const movement = await prisma.adminStockMovement.findFirst({
        where: { batchId: expBatch.id, type: "EXPIRED" },
      });
      expect(movement).toBeDefined();
      expect(movement?.quantity).toBe(25);
      expect(movement?.previousStock).toBe(25);
      expect(movement?.newStock).toBe(0);

      await assertStockInvariants(prisma);
    });
  });

  // --------------------------------------------------------------------------
  // S8: ORDER INTERPLAY (Confirmation -> Allocation, Cancellation -> Restock)
  // --------------------------------------------------------------------------
  describe("S8: Order Interplay, Allocation on Confirm, Restock on Cancel", () => {
    let interplayVariant: any;
    let targetBatch: any;
    let testOrder: any;

    beforeAll(async () => {
      interplayVariant = await prisma.productVariant.create({
        data: {
          productId: testProduct.id,
          name: "Order Interplay Variant",
          sku: `SKU-INTERPLAY-${Date.now()}`,
          price: 100.0,
          mrp: 120.0,
          packSize: "1 Strip",
        },
      });

      targetBatch = await inventoryService.createBatch(
        {
          variantId: interplayVariant.id,
          batchNumber: `INTERPLAY-BAT-${Date.now()}`,
          mfgDate: new Date("2025-01-01"),
          expiryDate: new Date("2028-01-01"),
          quantity: 40,
          costPrice: 50.0,
        },
        { adminId: adminUser.id, email: "admin@pharmacy.com" }
      );

      testOrder = await prisma.order.create({
        data: {
          orderNumber: `ORD-RESTOCK-${Date.now()}`,
          userId: testCustomer.id,
          addressId: testAddress.id,
          status: "PLACED",
          paymentStatus: "PAID",
          isPaid: true,
          subtotal: 500.0,
          totalAmount: 500.0,
          items: {
            create: [
              {
                variantId: interplayVariant.id,
                productName: testProduct.name,
                packSize: "1 Strip",
                sku: interplayVariant.sku,
                price: 100.0,
                mrp: 120.0,
                gstRate: 12.0,
                gstAmount: 60.0,
                quantity: 5,
                subtotal: 500.0,
              },
            ],
          },
        },
      });
    });

    it("allocates stock upon transitioning order to CONFIRMED", async () => {
      const confirmed = await ordersService.updateStatus(
        testOrder.id,
        OrderStatus.CONFIRMED,
        "Doctor prescription verified, proceeding to pack",
        adminUser.id
      );

      expect(confirmed.status).toBe(OrderStatus.CONFIRMED);

      const batchAfterConfirm = await prisma.inventoryBatch.findUnique({
        where: { id: targetBatch.id },
      });
      expect(batchAfterConfirm?.quantity).toBe(35); // 40 - 5 = 35

      const saleMovement = await prisma.adminStockMovement.findFirst({
        where: { referenceId: testOrder.id, type: "SALE" },
      });
      expect(saleMovement).toBeDefined();
      expect(saleMovement?.quantity).toBe(5);

      await assertStockInvariants(prisma);
    });

    it("restores stock to the exact same batch upon transitioning order to CANCELLED", async () => {
      const cancelled = await ordersService.updateStatus(
        testOrder.id,
        OrderStatus.CANCELLED,
        "Customer requested cancellation due to prescription change",
        adminUser.id
      );

      expect(cancelled.status).toBe(OrderStatus.CANCELLED);

      const batchAfterCancel = await prisma.inventoryBatch.findUnique({
        where: { id: targetBatch.id },
      });
      expect(batchAfterCancel?.quantity).toBe(40); // 35 + 5 restored to 40!

      const restockMovement = await prisma.adminStockMovement.findFirst({
        where: { referenceId: testOrder.id, type: "RETURN_RESTOCK" },
      });
      expect(restockMovement).toBeDefined();
      expect(restockMovement?.quantity).toBe(5);
      expect(restockMovement?.newStock).toBe(40);

      await assertStockInvariants(prisma);
    });
  });

  // --------------------------------------------------------------------------
  // S9: CONCURRENCY RACE CONDITION TEST
  // --------------------------------------------------------------------------
  describe("S9: High Concurrency Allocation Under Stock Constraints", () => {
    it("parallel order allocations against 5 units: exactly 5 units sold, 0 negative stock", async () => {
      // 1. Create a variant with only 5 units in batch
      const raceVariant = await prisma.productVariant.create({
        data: {
          productId: testProduct.id,
          name: "Race Condition Variant",
          sku: `SKU-RACE-${Date.now()}`,
          price: 50.0,
          mrp: 60.0,
          packSize: "1 Bottle",
        },
      });

      const raceBatch = await inventoryService.createBatch(
        {
          variantId: raceVariant.id,
          batchNumber: `RACE-BAT-${Date.now()}`,
          mfgDate: new Date("2025-01-01"),
          expiryDate: new Date("2028-01-01"),
          quantity: 5,
          costPrice: 25.0,
        },
        { adminId: adminUser.id, email: "admin@pharmacy.com" }
      );

      // 2. Concurrently create 12 distinct orders of 1 unit each
      const orderPromises = Array.from({ length: 12 }, (_, i) =>
        prisma.order.create({
          data: {
            orderNumber: `ORD-RACE-${Date.now()}-${i}`,
            userId: testCustomer.id,
            addressId: testAddress.id,
            status: "PLACED",
            paymentStatus: "PAID",
            isPaid: true,
            subtotal: 50.0,
            totalAmount: 50.0,
            items: {
              create: [
                {
                  variantId: raceVariant.id,
                  productName: testProduct.name,
                  packSize: "1 Bottle",
                  sku: raceVariant.sku,
                  price: 50.0,
                  mrp: 60.0,
                  gstRate: 12.0,
                  gstAmount: 6.0,
                  quantity: 1,
                  subtotal: 50.0,
                },
              ],
            },
          },
        })
      );
      const createdOrders = await Promise.all(orderPromises);
      const orderIds = createdOrders.map((o) => o.id);

      // 3. Fire all allocations concurrently
      const results = await Promise.allSettled(
        orderIds.map((id) =>
          inventoryService.allocateFefoOrder(id, { adminId: adminUser.id, email: "" })
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(successful.length).toBe(5);
      expect(rejected.length).toBe(7);

      // Verify batch quantity is exactly 0 and NEVER negative
      const freshRaceBatch = await prisma.inventoryBatch.findUnique({
        where: { id: raceBatch.id },
      });
      expect(freshRaceBatch?.quantity).toBe(0);

      // Total SALE movements for this batch is exactly 5
      const totalSales = await prisma.adminStockMovement.aggregate({
        where: { batchId: raceBatch.id, type: "SALE" },
        _sum: { quantity: true },
      });
      expect(totalSales._sum.quantity).toBe(5);

      await assertStockInvariants(prisma);
    });
  });

  // --------------------------------------------------------------------------
  // S10: CSV EXPORT & FORMULA INJECTION DEFENSE
  // --------------------------------------------------------------------------
  describe("S10: CSV Export & Formula Injection Defense", () => {
    it("neutralizes potential spreadsheet command execution injection", async () => {
      // Create a batch with potentially malicious formula name
      const formulaBatchNo = "=cmd|' /C calc'!A0";
      await prisma.inventoryBatch.create({
        data: {
          variantId: testVariant.id,
          batchNumber: formulaBatchNo,
          mfgDate: new Date("2025-01-01"),
          expiryDate: new Date("2028-01-01"),
          quantity: 10,
          costPrice: 50.0,
          isBlocked: true,
        },
      });

      const csv = await inventoryService.exportBatchesCsv();
      expect(csv).toBeDefined();

      // Check that the formula cell has been safely escaped with leading single quote
      expect(csv).toContain(`"'=cmd|' /C calc'!A0"`);
      expect(csv).not.toContain(`"=cmd|' /C calc'!A0"`);
    });
  });

  // --------------------------------------------------------------------------
  // S11: VALUATION & REPORTS
  // --------------------------------------------------------------------------
  describe("S11: Stock Valuation & Analytics", () => {
    it("calculates positive purchase valuation and margin metrics", async () => {
      const valuation = await inventoryService.getValuationReport();

      expect(valuation.totalPurchaseValuation).toBeGreaterThan(0);
      expect(valuation.totalSellingValuation).toBeGreaterThan(0);
      expect(valuation.categoryBreakdown).toBeDefined();
      expect(Object.keys(valuation.categoryBreakdown).length).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    // Delete any test orders created by this test file so the database stays completely clean
    const testOrders = await prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { startsWith: "ORD-" } },
          { orderNumber: { contains: "TEST" } },
          { orderNumber: { contains: "RACE" } },
          { orderNumber: { contains: "SYNC" } },
        ],
      },
      select: { id: true },
    });
    if (testOrders.length > 0) {
      const ids = testOrders.map((o) => o.id);
      await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
      await prisma.orderStatusHistory.deleteMany({ where: { orderId: { in: ids } } });
      await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
      await prisma.order.deleteMany({ where: { id: { in: ids } } });
    }

    // Teardown test product and all associated test inventory batches and movements
    if (testProduct?.id) {
      const variants = await prisma.productVariant.findMany({
        where: { productId: testProduct.id },
        select: { id: true },
      });
      const vIds = variants.map((v) => v.id);
      const batches = await prisma.inventoryBatch.findMany({
        where: { variantId: { in: vIds } },
        select: { id: true },
      });
      const bIds = batches.map((b) => b.id);

      await prisma.adminStockMovement.deleteMany({
        where: { OR: [{ batchId: { in: bIds } }, { variantId: { in: vIds } }] },
      });
      await prisma.adminPurchaseItem.deleteMany({
        where: { variantId: { in: vIds } },
      });
      await prisma.inventoryBatch.deleteMany({
        where: { id: { in: bIds } },
      });
      await prisma.productVariant.deleteMany({
        where: { id: { in: vIds } },
      });
      await prisma.product.deleteMany({
        where: { id: testProduct.id },
      });
    }
  });
});
