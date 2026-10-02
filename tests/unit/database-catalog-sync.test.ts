import { describe, it, expect, afterAll } from "vitest";
import prisma from "@pharmacy-admin/db";

describe("Database & Storefront Catalog Integration", () => {
  const testSlug = `test-integration-cat-${Date.now()}`;
  let createdCatId: string | null = null;

  afterAll(async () => {
    // Cleanup if test category was created
    if (createdCatId) {
      await prisma.category.deleteMany({ where: { id: createdCatId } });
    }
    await prisma.$disconnect();
  });

  it("should connect to Prisma database without errors", async () => {
    const isHealthy = await prisma.$queryRaw`SELECT 1 as result`;
    expect(isHealthy).toBeDefined();
  }, 30000);

  it("should query core catalog tables without Prisma errors", async () => {
    const [categories, products, brands] = await Promise.all([
      prisma.category.findMany({
        take: 5,
        include: { _count: { select: { products: true } } },
      }),
      prisma.product.findMany({
        take: 5,
        include: { category: true, brand: true, variants: true },
      }),
      prisma.brand.findMany({ take: 5 }),
    ]);

    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
    expect(Array.isArray(products)).toBe(true);
    expect(Array.isArray(brands)).toBe(true);
  }, 30000);

  it("should perform full CRUD on Category with zero Prisma errors", async () => {
    // 1. CREATE
    const newCategory = await prisma.category.create({
      data: {
        name: "Test Sync Category",
        slug: testSlug,
        description: "Integration test category for DB sync",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300",
        sortOrder: 99,
        isActive: true,
      },
    });
    expect(newCategory).toBeDefined();
    expect(newCategory.slug).toBe(testSlug);
    createdCatId = newCategory.id;

    // 2. READ
    const found = await prisma.category.findUnique({
      where: { id: createdCatId },
      include: { _count: { select: { products: true } } },
    });
    expect(found).not.toBeNull();
    expect(found?.name).toBe("Test Sync Category");
    expect(found?._count?.products).toBe(0);

    // 3. UPDATE
    const updated = await prisma.category.update({
      where: { id: createdCatId },
      data: { name: "Updated Test Sync Category", sortOrder: 100 },
    });
    expect(updated.name).toBe("Updated Test Sync Category");
    expect(updated.sortOrder).toBe(100);

    // 4. DELETE
    const deleted = await prisma.category.delete({
      where: { id: createdCatId },
    });
    expect(deleted.id).toBe(createdCatId);
    createdCatId = null;

    const notFound = await prisma.category.findUnique({
      where: { slug: testSlug },
    });
    expect(notFound).toBeNull();
  }, 30000);

  it("should query orders and prescriptions without Prisma schema errors", async () => {
    const orders = await prisma.order.findMany({
      take: 5,
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    expect(Array.isArray(orders)).toBe(true);

    const prescriptions = await prisma.prescription.findMany({
      take: 5,
    });
    expect(Array.isArray(prescriptions)).toBe(true);
  }, 30000);
});
