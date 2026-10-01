import { Request, Response } from "express";
import { authService } from "./auth.service";
import { loginSchema, twoFactorVerifySchema, resetPasswordSchema } from "@pharmacy-admin/shared";
import { env } from "../../config/env";

export class AuthController {
  async login(req: Request, res: Response) {
    const validated = loginSchema.parse(req.body);
    const meta = {
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    };

    const result = await authService.login(validated, meta);

    if ("requires2FA" in result) {
      return res.json({ success: true, data: result });
    }

    res.cookie("admin_refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  }

  async verifyTwoFactor(req: Request, res: Response) {
    const validated = twoFactorVerifySchema.parse(req.body);
    const meta = {
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    };

    const result = await authService.verifyTwoFactor(validated, meta);

    res.cookie("admin_refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = req.cookies?.admin_refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token not provided" });
    }

    const meta = {
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    };

    const result = await authService.refreshTokens(refreshToken, meta);

    res.cookie("admin_refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  }

  async logout(req: Request, res: Response) {
    res.clearCookie("admin_refresh_token");
    return res.json({ success: true, message: "Logged out successfully" });
  }

  async getMe(req: Request, res: Response) {
    return res.json({ success: true, data: req.admin });
  }

  async getSessions(req: Request, res: Response) {
    const sessions = await authService.listActiveSessions(req.admin!.adminUserId);
    return res.json({ success: true, data: sessions });
  }

  async revokeSession(req: Request, res: Response) {
    await authService.revokeSession(req.admin!.adminUserId, req.params.id);
    return res.json({ success: true, message: "Session revoked" });
  }

  async setup2FA(req: Request, res: Response) {
    const result = await authService.setupTwoFactor(req.admin!.adminUserId);
    return res.json({ success: true, data: result });
  }

  async enable2FA(req: Request, res: Response) {
    const { code } = req.body;
    await authService.enableTwoFactor(req.admin!.adminUserId, code);
    return res.json({ success: true, message: "Two-factor authentication enabled successfully" });
  }

  async forgotPassword(req: Request, res: Response) {
    await authService.requestPasswordReset(req.body.email);
    return res.json({ success: true, message: "If an account exists, a reset instructions email has been sent" });
  }

  async resetPassword(req: Request, res: Response) {
    const validated = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(validated.token, validated.newPassword);
    return res.json({ success: true, message: "Password reset successful" });
  }
}

export const authController = new AuthController();
