"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-100 max-w-sm w-full">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-800">Redirecting to Dashboard...</h2>
        <p className="text-sm text-gray-500 mt-1">Authentication removed. Loading Control Center.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Enter Dashboard Now
        </button>
      </div>
    </div>
  );
}
