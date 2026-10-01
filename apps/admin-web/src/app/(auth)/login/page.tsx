"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../../../store/authStore";
import { apiRequest } from "../../../lib/api-client";
import { toast } from "sonner";
import { ShieldCheck, Lock, Mail, Key, Pill, ArrowRight, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState("admin@pharmacy.com");
  const [password, setPassword] = useState("Admin@123456");
  const [isLoading, setIsLoading] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (res.data?.requires2FA) {
        setRequires2FA(true);
        setTempToken(res.data.tempToken);
        toast.info("Two-Factor Authentication Required", {
          description: "Enter the 6-digit code from your authenticator app",
        });
        setIsLoading(false);
        return;
      }

      setAuth(res.data.user, res.data.accessToken);
      toast.success("Welcome back!", { description: `Signed in as ${res.data.user.email}` });
      router.push("/dashboard");
    } catch (err: any) {
      toast.error("Login Failed", { description: err.message });
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await apiRequest("/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ email, token: twoFactorCode, tempToken }),
      });

      setAuth(res.data.user, res.data.accessToken);
      toast.success("2FA Verified Successfully");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error("Invalid 2FA Code", { description: err.message });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F5] flex flex-col justify-center items-center p-4">
      {/* Background Brand Accent Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#D7DEDB] p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0B4A3A] text-white shadow-md mb-2">
            <span className="text-2xl font-black text-[#10B981]">+</span>
          </div>
          <h2 className="text-2xl font-black text-[#0B4A3A] tracking-tight">Pharmico Admin</h2>
          <p className="text-xs text-[#5B6B65] font-medium">
            Medical E-Commerce & Retail Pharmacy Control Center
          </p>
        </div>

        {/* 1-Click Role Switcher Demo Buttons */}
        <div className="p-3 bg-[#FAF3EA] border border-[#D7DEDB] rounded-2xl space-y-2">
          <span className="text-[11px] font-bold text-[#0B4A3A] block uppercase tracking-wider">
            Quick Auto-Fill Test Account
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@pharmacy.com");
                setPassword("Admin@123456");
              }}
              className="py-1.5 px-2 bg-white hover:bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-bold text-[#0F2A22] transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Super Admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("pharmacist@medico.com");
                setPassword("Pharma@123456");
              }}
              className="py-1.5 px-2 bg-white hover:bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-bold text-[#0F2A22] transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <Pill className="w-3.5 h-3.5 text-[#F5C043]" />
              <span>Pharmacist</span>
            </button>
          </div>
        </div>

        {/* Form */}
        {!requires2FA ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#5B6B65] uppercase tracking-wider mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#5B6B65]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pharmacy.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F4F6F5] border border-[#D7DEDB] focus:border-[#0B4A3A] focus:bg-white rounded-xl text-sm font-semibold text-[#0F2A22] outline-none transition"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">
                  Password
                </label>
                <span className="text-xs font-bold text-[#0B4A3A] hover:underline cursor-pointer">
                  Forgot?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#5B6B65]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F4F6F5] border border-[#D7DEDB] focus:border-[#0B4A3A] focus:bg-white rounded-xl text-sm font-semibold text-[#0F2A22] outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0B4A3A] hover:bg-[#07362a] active:scale-98 text-white rounded-xl font-bold text-sm transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isLoading ? "Authenticating..." : "Sign In to Control Center"}</span>
              <ArrowRight className="w-4 h-4 text-[#10B981]" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="p-3 bg-[#F4F6F5] rounded-xl text-center text-xs text-[#5B6B65] font-medium">
              Enter the 6-digit TOTP verification code from your authenticator app.
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5B6B65] text-center uppercase tracking-wider mb-2">
                6-Digit Security Code
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 w-4 h-4 text-[#5B6B65]" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-xl font-extrabold py-2.5 pl-10 pr-4 bg-[#F4F6F5] border border-[#D7DEDB] focus:border-[#0B4A3A] focus:bg-white rounded-xl text-[#0F2A22] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || twoFactorCode.length !== 6}
              className="w-full py-3 bg-[#0B4A3A] hover:bg-[#07362a] text-white rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div className="pt-4 border-t border-[#D7DEDB] flex flex-col items-center justify-center gap-1.5 text-[11px] font-semibold text-[#5B6B65]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>256-Bit SSL Encrypted • Statutory Pharmacy RBAC</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
            <Link href="/terms" className="hover:text-emerald-700 underline">Terms of Service</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-emerald-700 underline">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
