"use client";

import React from "react";
import { Plus } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNewClaim?: () => void;
  showNewClaimButton?: boolean;
}

export default function Header({
  title,
  subtitle,
  onNewClaim,
  showNewClaimButton = true,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-[#E5E7EB] px-8 py-5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div>
        <h1 className="text-2xl font-bold text-[#151515] tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs font-medium text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {showNewClaimButton && onNewClaim && (
          <button
            onClick={onNewClaim}
            className="flex items-center gap-2 bg-[#D71920] hover:bg-[#B5141A] text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all duration-150 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Claim</span>
          </button>
        )}
      </div>
    </header>
  );
}
