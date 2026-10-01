import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import qrcode from "qrcode";
import prisma from "@pharmacy-admin/db";
import { env } from "../../config/env";
import { LoginInput, TwoFactorVerifyInput } from "@pharmacy-admin/shared";
import { sendEmailWithTemplate } from "../../lib/mailer";

export class AuthService {
  async login(input: LoginInput, meta: { ipAddress?: string; userAgent?: string }) {
    const user = await prisma.adminUser.findUnique({
      where: { email: input.email },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new Error("Invalid email or password");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new Error(`Account temporarily locked due to multiple failed logins. Try again in ${waitMinutes} minutes.`);
    }

    if (!user.isActive) {
      throw new Error("Your account has been deactivated. Contact an administrator.");
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      const attempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
      }
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockedUntil },
      });
      throw new Error("Invalid email or password");
    }

    // Reset failed login attempts
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    // Check if 2FA is required
    if (user.isTwoFactorEnabled && user.twoFactorSecret) {
      const tempToken = jwt.sign(
        { adminUserId: user.id, is2FA: true },
        env.JWT_ACCESS_SECRET,
        { expiresIn: "5m" }
      );
      return { requires2FA: true, tempToken };
    }

    return this.createAdminSession(user, meta);
  }

  async verifyTwoFactor(input: TwoFactorVerifyInput, meta: { ipAddress?: string; userAgent?: string }) {
    let decoded: any;
    try {
      decoded = jwt.verify(input.tempToken, env.JWT_ACCESS_SECRET);
    } catch {
      throw new Error("2FA verification session expired. Please log in again.");
    }

    const user = await prisma.adminUser.findUnique({
      where: { id: decoded.adminUserId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user || !user.twoFactorSecret) {
      throw new Error("2FA is not configured for this account");
    }

    const isValid = authenticator.verify({
      token: input.token,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new Error("Invalid 6-digit verification code");
    }

    return this.createAdminSession(user, meta);
  }

  async createAdminSession(user: any, meta: { ipAddress?: string; userAgent?: string }) {
    const permissions = user.role.permissions.map((rp: any) => rp.permission.slug);

    const accessToken = jwt.sign(
      {
        adminUserId: user.id,
        email: user.email,
        roleId: user.roleId,
        roleSlug: user.role.slug,
        permissions,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRY as any }
    );

    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.adminSession.create({
      data: {
        adminUserId: user.id,
        tokenHash,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: {
          id: user.role.id,
          name: user.role.name,
          slug: user.role.slug,
        },
        permissions,
      },
    };
  }

  async refreshTokens(rawRefreshToken: string, meta: { ipAddress?: string; userAgent?: string }) {
    const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex");

    const session = await prisma.adminSession.findUnique({
      where: { tokenHash },
      include: {
        adminUser: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new Error("Session expired or invalid");
    }

    const user = session.adminUser;
    if (!user.isActive || user.deletedAt) {
      throw new Error("User account is inactive");
    }

    // Revoke old session & issue fresh token pair
    await prisma.adminSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    return this.createAdminSession(user, meta);
  }

  async revokeSession(adminUserId: string, sessionId: string) {
    return prisma.adminSession.updateMany({
      where: { id: sessionId, adminUserId },
      data: { isRevoked: true },
    });
  }

  async listActiveSessions(adminUserId: string) {
    return prisma.adminSession.findMany({
      where: { adminUserId, isRevoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async setupTwoFactor(adminUserId: string) {
    const user = await prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!user) throw new Error("User not found");

    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, "Pharmico Admin", secret);
    const qrCodeUrl = await qrcode.toDataURL(otpAuthUrl);

    await prisma.adminUser.update({
      where: { id: adminUserId },
      data: { twoFactorSecret: secret },
    });

    return { secret, qrCodeUrl };
  }

  async enableTwoFactor(adminUserId: string, code: string) {
    const user = await prisma.adminUser.findUnique({ where: { id: adminUserId } });
    if (!user || !user.twoFactorSecret) throw new Error("2FA not initiated");

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) throw new Error("Invalid verification code");

    await prisma.adminUser.update({
      where: { id: adminUserId },
      data: { isTwoFactorEnabled: true },
    });

    return { success: true };
  }

  async requestPasswordReset(email: string) {
    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user) return { success: true }; // Prevent email enumeration

    const resetToken = jwt.sign(
      { adminUserId: user.id, purpose: "reset_password" },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "30m" }
    );

    const resetLink = `${env.MAIN_SITE_URL.replace(/:d+$/, ":3001")}/reset-password?token=${resetToken}`;

    await sendEmailWithTemplate({
      slug: "ADMIN_PASSWORD_RESET",
      to: user.email,
      variables: {
        name: user.firstName,
        resetLink,
        expiresInMinutes: 30,
      },
    });

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      if (decoded.purpose !== "reset_password") throw new Error();
    } catch {
      throw new Error("Invalid or expired password reset link");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.adminUser.update({
      where: { id: decoded.adminUserId },
      data: { passwordHash },
    });

    // Revoke all sessions for security
    await prisma.adminSession.updateMany({
      where: { adminUserId: decoded.adminUserId },
      data: { isRevoked: true },
    });

    return { success: true };
  }
}

export const authService = new AuthService();
