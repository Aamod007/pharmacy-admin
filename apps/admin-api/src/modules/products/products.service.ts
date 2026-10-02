import prisma from "@pharmacy-admin/db";
import { FullProductWizardInput } from "@pharmacy-admin/shared";
import { syncMutationToMainSite } from "../../lib/revalidate";
import { resolveAdminUserId } from "../../lib/admin-user";

export class ProductsService {
  async listProducts(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    isActive?: boolean;
    prescriptionRequired?: boolean;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { composition: { contains: query.search, mode: "insensitive" } },
        { variants: { some: { sku: { contains: query.search, mode: "insensitive" } } } },
      ];
    }
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.prescriptionRequired !== undefined) where.prescriptionRequired = query.prescriptionRequired;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          variants: {
            include: {
              batches: {
                where: { isBlocked: false },
                select: { quantity: true, expiryDate: true },
              },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const formatted = products.map((p) => {
      const defaultVariant = p.variants.find((v) => v.isDefault) || p.variants[0];
      const totalStock = p.variants.reduce(
        (sum, v) => sum + v.batches.reduce((bSum, b) => bSum + b.quantity, 0),
        0
      );

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.images[0] || null,
        category: p.category.name,
        brand: p.brand.name,
        sku: defaultVariant?.sku || "N/A",
        price: defaultVariant ? Number(defaultVariant.price) : 0,
        mrp: defaultVariant ? Number(defaultVariant.mrp) : 0,
        totalStock,
        prescriptionRequired: p.prescriptionRequired,
        scheduleType: p.scheduleType || "OTC",
        isActive: p.isActive,
        createdAt: p.createdAt,
      };
    });

    return {
      data: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        variants: {
          include: {
            batches: { orderBy: { expiryDate: "asc" } },
          },
        },
      },
    });

    if (!product || product.deletedAt) {
      throw new Error("Product not found");
    }

    return product;
  }

  async createProductWizard(input: FullProductWizardInput, actor: { adminId: string; email: string }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create base product
      const product = await tx.product.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          composition: input.composition,
          uses: input.uses,
          sideEffects: input.sideEffects,
          dosage: input.dosage,
          storageInstructions: input.storageInstructions,
          manufacturer: input.manufacturer,
          countryOfOrigin: input.countryOfOrigin,
          hsnCode: input.hsnCode,
          gstRate: input.gstRate,
          prescriptionRequired: input.prescriptionRequired,
          scheduleType: input.scheduleType,
          brandId: input.brandId,
          categoryId: input.categoryId,
          images: input.images,
          isFeatured: input.isFeatured,
          isBestSeller: input.isBestSeller,
          isActive: input.status === "PUBLISHED",
        },
      });

      // 2. Create variants & optional initial batches
      for (let i = 0; i < input.variants.length; i++) {
        const v = input.variants[i];
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            sku: v.sku,
            name: v.name,
            packSize: v.packSize,
            price: v.price,
            mrp: v.mrp,
            discountPercent: Math.round(v.discountPercent),
            weightGrams: v.weightGrams,
            isDefault: i === 0 || v.isDefault,
          },
        });

        // Batches for this variant
        const batches = input.initialBatches?.[v.sku] || [];
        for (const b of batches) {
          const batch = await tx.inventoryBatch.create({
            data: {
              variantId: variant.id,
              batchNumber: b.batchNumber,
              mfgDate: new Date(b.mfgDate),
              expiryDate: new Date(b.expiryDate),
              quantity: b.quantity,
              costPrice: b.costPrice,
            },
          });

          const validAdminId = await resolveAdminUserId(actor?.adminId, actor?.email, tx);
          // Stock movement entry
          await tx.adminStockMovement.create({
            data: {
              variantId: variant.id,
              batchId: batch.id,
              type: "PURCHASE",
              quantity: b.quantity,
              previousStock: 0,
              newStock: b.quantity,
              referenceType: "INITIAL_INVENTORY",
              reason: "Initial product stock batch entry",
              createdByAdminId: validAdminId,
            },
          });
        }
      }

      // Revalidate ISR on main storefront
      syncMutationToMainSite({
        type: "product.created",
        entityId: product.id,
        entityName: product.name,
        tags: ["products", `product:${product.slug}`],
        paths: ["/", "/products", `/products/${product.slug}`],
        actor,
      });

      return product;
    });
  }

  async updateProduct(id: string, input: Partial<FullProductWizardInput>, actor: { adminId: string; email: string }) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new Error("Product not found");

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        composition: input.composition,
        uses: input.uses,
        sideEffects: input.sideEffects,
        dosage: input.dosage,
        storageInstructions: input.storageInstructions,
        manufacturer: input.manufacturer,
        countryOfOrigin: input.countryOfOrigin,
        hsnCode: input.hsnCode,
        gstRate: input.gstRate,
        prescriptionRequired: input.prescriptionRequired,
        scheduleType: input.scheduleType,
        brandId: input.brandId,
        categoryId: input.categoryId,
        images: input.images,
        isFeatured: input.isFeatured,
        isBestSeller: input.isBestSeller,
        isActive: input.status ? input.status === "PUBLISHED" : undefined,
      },
    });

    syncMutationToMainSite({
      type: "product.updated",
      entityId: updated.id,
      entityName: updated.name,
      tags: ["products", `product:${updated.slug}`],
      paths: ["/", "/products", `/products/${updated.slug}`],
      actor,
    });

    return updated;
  }

  async deleteProduct(id: string, actor: { adminId: string; email: string }) {
    const product = await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    syncMutationToMainSite({
      type: "product.deleted",
      entityId: product.id,
      entityName: product.name,
      tags: ["products", `product:${product.slug}`],
      paths: ["/", "/products"],
      actor,
    });

    return product;
  }
}

export const productsService = new ProductsService();
