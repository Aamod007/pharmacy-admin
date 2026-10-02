"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] p-4 font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[#0B4A3A] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Accessing Admin Control Center...</p>
      </div>
    </div>
  );
}
