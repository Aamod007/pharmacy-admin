import prisma from "@pharmacy-admin/db";
import { PrescriptionStatus } from "@pharmacy-admin/shared";
import { sendEmailWithTemplate } from "../../lib/mailer";

export class PrescriptionsService {
  async listQueue(status?: PrescriptionStatus, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          reviewedBy: { select: { id: true, name: true } },
          orders: { select: { id: true, orderNumber: true, totalAmount: true, status: true } },
        },
      }),
      prisma.prescription.count({ where }),
    ]);

    return {
      data: prescriptions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const rx = await prisma.prescription.findUnique({
      where: { id },
      include: {
        user: { include: { orders: { take: 5, orderBy: { createdAt: "desc" } } } },
        reviewedBy: true,
        orders: { include: { items: true } },
      },
    });
    if (!rx) throw new Error("Prescription not found");
    return rx;
  }

  async approvePrescription(
    id: string,
    validityDate: Date,
    notes: string | undefined,
    pharmacistAdminId: string
  ) {
    const rx = await prisma.prescription.findUnique({
      where: { id },
      include: { user: true, orders: true },
    });
    if (!rx) throw new Error("Prescription not found");

    const updated = await prisma.prescription.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedByPharmacistId: pharmacistAdminId,
        reviewedAt: new Date(),
        notes: notes ? `Validity: ${validityDate.toISOString().split("T")[0]}\n${notes}` : `Validity: ${validityDate.toISOString().split("T")[0]}`,
      },
    });

    // Notify customer
    sendEmailWithTemplate({
      slug: "PRESCRIPTION_APPROVED",
      to: rx.user.email,
      variables: {
        customerName: rx.user.name,
        orderNumber: rx.orders[0]?.orderNumber || "N/A",
        pharmacistName: "Registered Pharmacist",
        validityDate: validityDate.toDateString(),
      },
    });

    return updated;
  }

  async rejectPrescription(
    id: string,
    reason: string,
    notes: string | undefined,
    pharmacistAdminId: string
  ) {
    const rx = await prisma.prescription.findUnique({
      where: { id },
      include: { user: true, orders: true },
    });
    if (!rx) throw new Error("Prescription not found");

    const updated = await prisma.prescription.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        reviewedByPharmacistId: pharmacistAdminId,
        reviewedAt: new Date(),
        notes,
      },
    });

    sendEmailWithTemplate({
      slug: "PRESCRIPTION_REJECTED",
      to: rx.user.email,
      variables: {
        customerName: rx.user.name,
        orderNumber: rx.orders[0]?.orderNumber || "N/A",
        rejectionReason: reason,
        reuploadUrl: "http://localhost:3000/orders",
      },
    });

    return updated;
  }
}

export const prescriptionsService = new PrescriptionsService();
