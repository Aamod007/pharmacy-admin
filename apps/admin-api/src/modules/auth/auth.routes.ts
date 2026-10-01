import { Router } from "express";
import { authController } from "./auth.controller";
import { authenticateAdmin } from "../../middlewares/auth";
import { authRateLimiter } from "../../middlewares/rateLimiter";

const router = Router();

router.post("/login", authRateLimiter, (req, res, next) => authController.login(req, res).catch(next));
router.post("/2fa/verify", authRateLimiter, (req, res, next) => authController.verifyTwoFactor(req, res).catch(next));
router.post("/refresh", (req, res, next) => authController.refreshToken(req, res).catch(next));
router.post("/logout", (req, res, next) => authController.logout(req, res).catch(next));
router.post("/forgot-password", authRateLimiter, (req, res, next) => authController.forgotPassword(req, res).catch(next));
router.post("/reset-password", authRateLimiter, (req, res, next) => authController.resetPassword(req, res).catch(next));

// Authenticated routes
router.use(authenticateAdmin);
router.get("/me", (req, res, next) => authController.getMe(req, res).catch(next));
router.get("/sessions", (req, res, next) => authController.getSessions(req, res).catch(next));
router.delete("/sessions/:id", (req, res, next) => authController.revokeSession(req, res).catch(next));
router.post("/2fa/setup", (req, res, next) => authController.setup2FA(req, res).catch(next));
router.post("/2fa/enable", (req, res, next) => authController.enable2FA(req, res).catch(next));

export default router;
