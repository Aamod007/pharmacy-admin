"use client";

import React from "react";
import { Activity, Sparkles } from "lucide-react";

interface TopbarProps {
  breadcrumb?: string;
  title: string;
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
}

export function Topbar({ breadcrumb, title, secondaryAction, primaryAction }: TopbarProps) {
  return (
    <header className="h-16 px-8 flex items-center justify-between border-b border-[#D7DEDB] bg-white sticky top-0 z-20 shadow-xs">
      {/* Left: Breadcrumb & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#0B4A3A] text-[#10B981] flex items-center justify-center shadow-xs">
          <Activity className="w-4 h-4" />
        </div>
        {breadcrumb && (
          <>
            <span className="text-xs font-semibold text-[#5B6B65] uppercase tracking-wider">{breadcrumb}</span>
            <span className="text-[#D7DEDB] text-sm font-bold">/</span>
          </>
        )}
        <h1 className="text-lg font-extrabold text-[#0F2A22] tracking-tight">{title}</h1>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-4">

        {secondaryAction && (
          <button
            type="button"
            disabled={secondaryAction.disabled}
            onClick={secondaryAction.onClick}
            className="px-4 py-2 text-xs font-bold text-[#0F2A22] bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl hover:bg-[#E4E7E9] transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {secondaryAction.label}
          </button>
        )}

        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
            className="px-4 py-2 text-xs font-bold text-white bg-[#0B4A3A] hover:bg-[#07362a] active:scale-98 rounded-xl transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
            <span>{primaryAction.label}</span>
          </button>
        )}
      </div>
    </header>
  );
}
