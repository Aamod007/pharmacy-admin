"use client";

import React from "react";
import { MoreVertical } from "lucide-react";

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  actionMenu?: boolean;
}

export function SectionCard({ title, children, actionMenu = true }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E4E7E9] shadow-sm mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-[#0F2A22]">{title}</h2>
        {actionMenu && (
          <button className="p-1 rounded-lg text-[#5B6B65] hover:bg-[#F1F3F4] transition">
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
