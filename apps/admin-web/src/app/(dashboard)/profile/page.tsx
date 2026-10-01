"use client";

import React, { useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { SectionCard } from "../../../components/common/SectionCard";
import { useAuthStore } from "../../../store/authStore";
import { apiRequest } from "../../../lib/api-client";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleSetup2FA = async () => {
    try {
      const res = await apiRequest("/auth/2fa/setup", { method: "POST" });
      setQrCodeUrl(res.data.qrCodeUrl);
      toast.info("Scan the QR code with your Authenticator app");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEnable2FA = async () => {
    try {
      await apiRequest("/auth/2fa/enable", {
        method: "POST",
        body: JSON.stringify({ code: twoFactorCode }),
      });
      toast.success("Two-Factor Authentication Enabled!");
      setQrCodeUrl("");
      setTwoFactorCode("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Account" title="Profile & Security Settings" />

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <SectionCard title="Administrator Details">
          <div className="flex items-center gap-4">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary))] text-white font-bold text-lg flex items-center justify-center border shadow-sm flex-shrink-0">
                {(user?.firstName?.[0] || "A").toUpperCase()}
                {(user?.lastName?.[0] || "").toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg text-[#0F2A22]">{user?.firstName} {user?.lastName}</h3>
              <p className="text-xs text-[#5B6B65]">{user?.email}</p>
              <span className="mt-2 inline-block px-3 py-1 bg-[#F1F3F4] rounded-lg text-xs font-bold text-[hsl(var(--primary))]">
                {user?.role?.name}
              </span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Two-Factor Authentication (TOTP)">
          <div className="space-y-4">
            <p className="text-xs text-[#5B6B65]">
              Enhance control center security by requiring an authenticator code on every sign-in.
            </p>
            {!qrCodeUrl ? (
              <button
                onClick={handleSetup2FA}
                className="px-4 py-2 bg-[hsl(var(--primary))] text-white rounded-xl text-xs font-bold flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" /> Setup 2FA
              </button>
            ) : (
              <div className="p-4 bg-[#F1F3F4] rounded-xl space-y-3">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-44 h-44 bg-white p-2 rounded-xl" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit code..."
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  className="px-4 py-2 bg-white rounded-xl text-xs font-bold"
                />
                <button
                  onClick={handleEnable2FA}
                  className="px-4 py-2 bg-[#16A34A] text-white rounded-xl text-xs font-bold"
                >
                  Confirm & Enable 2FA
                </button>
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
