"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { ShieldCheck, Lock, Mail, AlertCircle, KeyRound, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error?.message || "Failed to authenticate");
      }

      if (data.data?.requires2FA) {
        setRequires2FA(true);
        setTempToken(data.data.tempToken);
        setIsLoading(false);
        return;
      }

      const { user, accessToken } = data.data;
      setAuth(user, accessToken);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/2fa/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tempToken, token: twoFactorCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error?.message || "Invalid two-factor code");
      }

      const { user, accessToken } = data.data;
      setAuth(user, accessToken);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid 2FA verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] p-4 relative overflow-hidden font-sans">
      {/* Background aesthetics */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#0B4A3A]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-[#D7DEDB]/60 relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#0B4A3A] rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-[#0B4A3A]/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#0F2A22] tracking-tight">Pharmico Admin</h1>
          <p className="text-xs text-[#5B6B65] font-medium">
            Clinical Administration & Inventory Control Center
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in slide-in-from-top-2 duration-150">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1 font-semibold">{errorMessage}</div>
          </div>
        )}

        {/* Login Form or 2FA Form */}
        {!requires2FA ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F2A22] mb-1.5" htmlFor="admin-email">
                Staff Email Address
              </label>
              <div className="relative">
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pharmacy.com"
                  className="w-full pl-10 pr-4 py-3 bg-[#F1F3F4] text-[#0F2A22] placeholder:text-[#5B6B65]/60 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A] border border-transparent focus:border-[#0B4A3A] transition"
                />
                <Mail className="w-4 h-4 text-[#5B6B65] absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F2A22] mb-1.5" htmlFor="admin-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#F1F3F4] text-[#0F2A22] placeholder:text-[#5B6B65]/60 rounded-2xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A] border border-transparent focus:border-[#0B4A3A] transition"
                />
                <Lock className="w-4 h-4 text-[#5B6B65] absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#0B4A3A] hover:bg-[#07362a] active:scale-[0.99] text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-[#0B4A3A]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Control Center</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <KeyRound className="w-8 h-8 text-[#0B4A3A] mx-auto" />
              <h3 className="text-sm font-bold text-[#0F2A22]">Two-Factor Authentication</h3>
              <p className="text-[11px] text-[#5B6B65]">Enter the 6-digit TOTP code from your authenticator app</p>
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg py-3 bg-[#F1F3F4] text-[#0F2A22] rounded-2xl font-mono font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A] border border-transparent focus:border-[#0B4A3A]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || twoFactorCode.length < 6}
              className="w-full py-3.5 px-4 bg-[#0B4A3A] hover:bg-[#07362a] active:scale-[0.99] text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-[#0B4A3A]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating Code...</span>
                </>
              ) : (
                <span>Verify & Complete Login</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setTempToken(null);
                setErrorMessage("");
              }}
              className="w-full py-2 text-xs font-bold text-[#5B6B65] hover:text-[#0F2A22] transition text-center"
            >
              &larr; Back to login
            </button>
          </form>
        )}

        {/* Security Footer Notice */}
        <div className="pt-4 border-t border-[#D7DEDB]/60 text-center">
          <p className="text-[10px] text-[#5B6B65] font-semibold">
            Protected by End-to-End Audit Logging & Statutory Pharmacy Compliance
          </p>
        </div>
      </div>
    </div>
  );
}
