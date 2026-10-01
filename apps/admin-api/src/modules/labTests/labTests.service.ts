import prisma from "@pharmacy-admin/db";
import { syncMutationToMainSite } from "../../lib/revalidate";

export class LabTestsService {
  async listLabTests(query: { search?: string; category?: string }) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.category) {
      where.category = query.category;
    }
    return prisma.labTest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { bookings: true } },
      },
    });
  }

  async getLabTestById(id: string) {
    return prisma.labTest.findUnique({ where: { id } });
  }

  async createLabTest(data: {
    name: string;
    slug: string;
    description: string;
    category: string;
    price: number;
    mrp: number;
    sampleType: string;
    fastingRequired?: boolean;
    reportTimeHours?: number;
    testParameters?: string[];
  }, actor: { adminId: string; email: string }) {
    const test = await prisma.labTest.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        description: data.description,
        category: data.category,
        price: data.price,
        mrp: data.mrp,
        sampleType: data.sampleType,
        fastingRequired: data.fastingRequired ?? false,
        reportTimeHours: data.reportTimeHours ?? 24,
        testParameters: data.testParameters ?? [],
        isActive: true,
      },
    });

    syncMutationToMainSite({
      type: "lab_test.updated",
      entityId: test.id,
      tags: ["lab-tests"],
      paths: ["/lab-tests"],
      actor,
    });

    return test;
  }

  async updateLabTest(id: string, data: any, actor: { adminId: string; email: string }) {
    const test = await prisma.labTest.update({
      where: { id },
      data,
    });

    syncMutationToMainSite({
      type: "lab_test.updated",
      entityId: test.id,
      tags: ["lab-tests"],
      paths: ["/lab-tests"],
      actor,
    });

    return test;
  }

  async deleteLabTest(id: string, actor: { adminId: string; email: string }) {
    await prisma.labTest.delete({ where: { id } });
    syncMutationToMainSite({
      type: "lab_test.updated",
      entityId: id,
      tags: ["lab-tests"],
      paths: ["/lab-tests"],
      actor,
    });
    return { success: true };
  }

  async listBookings(query: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== "ALL") {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { bookingNumber: { contains: query.search, mode: "insensitive" } },
        { patientName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.labBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          labTest: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
          address: true,
        },
      }),
      prisma.labBooking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateBookingStatus(id: string, status: any, reportUrl?: string) {
    const data: any = { status };
    if (reportUrl) {
      data.reportUrl = reportUrl;
    }
    return prisma.labBooking.update({
      where: { id },
      data,
      include: {
        labTest: true,
        user: true,
      },
    });
  }
}

export const labTestsService = new LabTestsService();
