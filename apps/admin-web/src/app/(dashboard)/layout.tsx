"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppShell } from "../../components/shell/AppShell";
import { useAuthStore } from "../../store/authStore";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    if (!token && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [isAuthenticated, pathname, router]);

  if (!mounted) return null;

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  if (!token && !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#0B4A3A] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Verifying Session...</p>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
