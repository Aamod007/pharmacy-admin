import prisma from "@pharmacy-admin/db";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export class InvoicesService {
  async listInvoices(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          address: true,
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { data: orders, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async listCreditNotes(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notes, total] = await Promise.all([
      prisma.adminCreditNote.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: { include: { user: true } },
          createdBy: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.adminCreditNote.count(),
    ]);

    return { data: notes, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async generateOrderInvoicePdf(orderId: string): Promise<Uint8Array> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        address: true,
        items: true,
      },
    });

    if (!order) throw new Error("Order not found");

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const { width, height } = page.getSize();
    let y = height - 50;

    // Header
    page.drawText("TAX INVOICE / CASH MEMO", { x: 50, y, size: 20, font: fontBold, color: rgb(0.04, 0.29, 0.23) });
    y -= 25;
    page.drawText("Pharmico Healthcare Pvt Ltd | GSTIN: 29AAAAA0000A1Z5 | DL: KA-BLR-2024-00129", { x: 50, y, size: 10, font, color: rgb(0.3, 0.3, 0.3) });
    y -= 30;

    // Order Info
    page.drawText(`Invoice No: INV-${order.orderNumber}`, { x: 50, y, size: 10, font: fontBold });
    page.drawText(`Date: ${order.createdAt.toISOString().split("T")[0]}`, { x: 350, y, size: 10, font });
    y -= 15;
    page.drawText(`Customer: ${order.user.name} (${order.user.phone})`, { x: 50, y, size: 10, font });
    page.drawText(`Payment Method: ${order.paymentMethod} (${order.paymentStatus})`, { x: 350, y, size: 10, font });
    y -= 15;
    page.drawText(`Shipping Address: ${order.address?.addressLine1 || ""}, ${order.address?.city || ""}, ${order.address?.pincode || ""}`, { x: 50, y, size: 9, font });
    y -= 30;

    // Items Table Header
    page.drawText("Item / Description", { x: 50, y, size: 9, font: fontBold });
    page.drawText("Pack", { x: 260, y, size: 9, font: fontBold });
    page.drawText("Qty", { x: 340, y, size: 9, font: fontBold });
    page.drawText("Rate (INR)", { x: 400, y, size: 9, font: fontBold });
    page.drawText("Total (INR)", { x: 480, y, size: 9, font: fontBold });
    y -= 15;

    // Items
    for (const item of order.items) {
      page.drawText(item.productName.slice(0, 32), { x: 50, y, size: 9, font });
      page.drawText(item.packSize, { x: 260, y, size: 9, font });
      page.drawText(String(item.quantity), { x: 340, y, size: 9, font });
      page.drawText(Number(item.price).toFixed(2), { x: 400, y, size: 9, font });
      page.drawText(Number(item.subtotal).toFixed(2), { x: 480, y, size: 9, font });
      y -= 18;
    }

    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: 540, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;

    page.drawText(`Subtotal: INR ${Number(order.subtotal).toFixed(2)}`, { x: 380, y, size: 10, font });
    y -= 15;
    page.drawText(`GST (Included): INR ${Number(order.gstAmount).toFixed(2)}`, { x: 380, y, size: 10, font });
    y -= 15;
    page.drawText(`Delivery: INR ${Number(order.deliveryFee).toFixed(2)}`, { x: 380, y, size: 10, font });
    y -= 15;
    page.drawText(`Total Amount: INR ${Number(order.totalAmount).toFixed(2)}`, { x: 380, y, size: 12, font: fontBold, color: rgb(0.04, 0.29, 0.23) });

    return pdfDoc.save();
  }
}

export const invoicesService = new InvoicesService();
