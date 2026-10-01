"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { useStoreEvents } from "../../lib/sse-client";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Subscribe to real-time events from main store (order.created, rx, low stock)
  useStoreEvents();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F6F7]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
