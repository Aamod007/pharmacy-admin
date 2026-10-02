import prisma from "@pharmacy-admin/db";

export class CustomersService {
  async list(query: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { role: "CUSTOMER" };
    if (query.isActive !== undefined) where.isActive = query.isActive;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { data: customers, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const customer = await prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: { take: 10, orderBy: { createdAt: "desc" } },
        supportTickets: { take: 5, orderBy: { createdAt: "desc" } },
      },
    });
    if (!customer) throw new Error("Customer not found");
    return customer;
  }

  async toggleActive(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }
}

export const customersService = new CustomersService();
