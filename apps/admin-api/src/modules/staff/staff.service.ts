import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@pharmacy-admin/db";
import { StaffInviteInput } from "@pharmacy-admin/shared";
import { sendEmailWithTemplate } from "../../lib/mailer";

export class StaffService {
  async listStaff() {
    const staff = await prisma.adminUser.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return staff.map((s) => ({
      ...s,
      role: { id: "admin", name: "Administrator", slug: "ADMIN" },
    }));
  }

  async listRoles() {
    return [
      {
        id: "admin",
        name: "Administrator",
        slug: "ADMIN",
        description: "Full administrative access across all store management tools.",
        isSystem: true,
        permissions: [],
        _count: { users: 1 },
      },
    ];
  }

  async listPermissions() {
    return [];
  }

  async inviteStaff(input: StaffInviteInput) {
    const existing = await prisma.adminUser.findUnique({ where: { email: input.email } });
    if (existing) throw new Error("A staff member with this email already exists");

    const tempPassword = crypto.randomBytes(6).toString("hex") + "A1!";
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    const user = await prisma.adminUser.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: "ADMIN",
        passwordHash,
      },
    });

    sendEmailWithTemplate({
      slug: "STAFF_INVITE",
      to: user.email,
      variables: {
        name: user.firstName,
        roleName: "Administrator",
        temporaryPassword: tempPassword,
        inviteLink: "http://localhost:3002/login",
      },
    });

    return { user: { ...user, role: { id: "admin", name: "Administrator", slug: "ADMIN" } }, tempPassword };
  }
}

export const staffService = new StaffService();
