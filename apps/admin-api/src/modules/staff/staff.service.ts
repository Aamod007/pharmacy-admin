import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@pharmacy-admin/db";
import { StaffInviteInput } from "@pharmacy-admin/shared";
import { sendEmailWithTemplate } from "../../lib/mailer";

export class StaffService {
  async listStaff() {
    return prisma.adminUser.findMany({
      where: { deletedAt: null },
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async listRoles() {
    return prisma.adminRole.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
  }

  async listPermissions() {
    return prisma.adminPermission.findMany({ orderBy: [{ module: "asc" }, { action: "asc" }] });
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
        roleId: input.roleId,
        passwordHash,
      },
      include: { role: true },
    });

    sendEmailWithTemplate({
      slug: "STAFF_INVITE",
      to: user.email,
      variables: {
        name: user.firstName,
        roleName: user.role.name,
        temporaryPassword: tempPassword,
        inviteLink: "http://localhost:3001/login",
      },
    });

    return { user, tempPassword };
  }
}

export const staffService = new StaffService();
