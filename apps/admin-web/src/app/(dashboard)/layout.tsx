"use client";

import { useEffect, useState } from "react";
import { AppShell } from "../../components/shell/AppShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <AppShell>{children}</AppShell>;
}
