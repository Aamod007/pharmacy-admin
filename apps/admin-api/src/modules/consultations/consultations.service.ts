import prisma from "@pharmacy-admin/db";
import { syncMutationToMainSite } from "../../lib/revalidate";

export class ConsultationsService {
  async listDoctors(query: { search?: string; specialization?: string }) {
    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { specialization: { contains: query.search, mode: "insensitive" } },
      ];
    }
    if (query.specialization) {
      where.specialization = query.specialization;
    }
    return prisma.doctor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { appointments: true } },
      },
    });
  }

  async getDoctorById(id: string) {
    return prisma.doctor.findUnique({ where: { id } });
  }

  async createDoctor(data: {
    name: string;
    slug?: string;
    specialization: string;
    qualification: string;
    experienceYears: number;
    registrationNumber: string;
    consultationFee: number;
    bio: string;
    avatar?: string;
    languages?: string[];
  }, actor: { adminId: string; email: string }) {
    const doctor = await prisma.doctor.create({
      data: {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        specialization: data.specialization,
        qualification: data.qualification,
        experienceYears: Number(data.experienceYears) || 5,
        registrationNumber: data.registrationNumber || "MCI-REG-1001",
        consultationFee: data.consultationFee,
        bio: data.bio || "Certified medical specialist.",
        avatar: data.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400",
        languages: data.languages || ["English", "Hindi"],
        isAvailable: true,
      },
    });

    syncMutationToMainSite({
      type: "doctor.updated",
      entityId: doctor.id,
      tags: ["doctors"],
      paths: ["/consultations"],
      actor,
    });

    return doctor;
  }

  async updateDoctor(id: string, data: any, actor: { adminId: string; email: string }) {
    const doctor = await prisma.doctor.update({
      where: { id },
      data,
    });

    syncMutationToMainSite({
      type: "doctor.updated",
      entityId: doctor.id,
      tags: ["doctors"],
      paths: ["/consultations"],
      actor,
    });

    return doctor;
  }

  async deleteDoctor(id: string, actor: { adminId: string; email: string }) {
    await prisma.doctor.delete({ where: { id } });
    syncMutationToMainSite({
      type: "doctor.updated",
      entityId: id,
      tags: ["doctors"],
      paths: ["/consultations"],
      actor,
    });
    return { success: true };
  }

  async listAppointments(query: { status?: string; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== "ALL") {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { appointmentNumber: { contains: query.search, mode: "insensitive" } },
        { patientName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appointmentDate: "desc" },
        include: {
          doctor: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateAppointment(id: string, data: { status?: any; videoRoomUrl?: string; notes?: string; prescriptionNotes?: string }) {
    return prisma.appointment.update({
      where: { id },
      data,
      include: {
        doctor: true,
        user: true,
      },
    });
  }
}

export const consultationsService = new ConsultationsService();
