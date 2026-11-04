"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  CarFront,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Cookies from "js-cookie";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Claims", href: "/claims", icon: FileText },
  { name: "Fleet", href: "/fleet", icon: CarFront },
];

// Persistent state across client-side page transitions
let memoryCollapsed = false;
if (typeof window !== "undefined") {
  try {
    memoryCollapsed =
      Cookies.get("pch_sidebar_collapsed") === "true" ||
      localStorage.getItem("pch_sidebar_collapsed") === "true";
  } catch {}
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(memoryCollapsed);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    try {
      const saved =
        Cookies.get("pch_sidebar_collapsed") === "true" ||
        localStorage.getItem("pch_sidebar_collapsed") === "true";
      if (saved !== collapsed) {
        setCollapsed(saved);
        memoryCollapsed = saved;
      }
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleSidebar = () => {
    setHasInteracted(true);
    const next = !collapsed;
    memoryCollapsed = next;
    setCollapsed(next);
    try {
      Cookies.set("pch_sidebar_collapsed", String(next), { expires: 365 });
      localStorage.setItem("pch_sidebar_collapsed", String(next));
    } catch {}
  };

  const handleLogout = () => {
    Cookies.remove("pch_token");
    Cookies.remove("pch_user");
    router.push("/");
  };

  return (
    <aside
      className={`bg-[#121212] text-white flex flex-col justify-between shrink-0 h-screen sticky top-0 border-r border-[#262626] z-40 select-none relative ${
        hasInteracted ? "transition-all duration-250 ease-in-out" : ""
      } ${collapsed ? "w-20" : "w-64"}`}
    >
      {/* Floating Modern Toggle Button on Border Edge */}
      <button
        onClick={toggleSidebar}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3.5 top-7 w-7 h-7 bg-[#1E1E1E] hover:bg-[#D71920] text-gray-300 hover:text-white border border-[#333] hover:border-[#D71920] rounded-full flex items-center justify-center shadow-md shadow-black/50 transition-all duration-200 z-50 group hover:scale-110 active:scale-95"
        title={collapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        )}
      </button>

      {/* Brand Header */}
      <div>
        <div className={`border-b border-[#242424] ${collapsed ? "p-4" : "p-6"}`}>
          <Link
            href="/claims"
            className={`flex items-center gap-3 group ${collapsed ? "justify-center" : ""}`}
            title="PCH Hire Management Portal"
          >
            {/* Logo Icon */}
            <div className="w-10 h-10 rounded-xl bg-[#D71920] flex items-center justify-center font-black text-xl text-white shadow-lg shadow-red-950/60 group-hover:scale-105 group-hover:shadow-red-600/30 transition-all shrink-0">
              P
            </div>

            {/* Logo Text (Hidden when collapsed) */}
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="font-extrabold text-lg tracking-wider flex items-center gap-1.5 leading-tight">
                  <span className="text-white">PCH</span>
                  <span className="text-[#D71920]">HIRE</span>
                </div>
                <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                  Management Portal
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className={`space-y-1.5 ${collapsed ? "p-2" : "p-4"}`}>
          {!collapsed && (
            <div className="px-3 py-2 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">
              Main Menu
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  className={`flex items-center rounded-xl text-sm font-bold transition-all duration-150 relative ${
                    collapsed
                      ? "justify-center w-12 h-12 mx-auto"
                      : "gap-3.5 px-4 py-3"
                  } ${
                    isActive
                      ? "bg-[#D71920] text-white shadow-md shadow-red-950/50"
                      : "text-gray-300 hover:text-white hover:bg-[#1C1C1C]"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate tracking-wide">{item.name}</span>
                  )}

                  {/* Active Indicator Bar when collapsed */}
                  {collapsed && isActive && (
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-full" />
                  )}
                </Link>

                {/* Floating Smexy Tooltip for Collapsed Mode */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1E1E1E] text-white text-xs font-bold rounded-lg shadow-2xl border border-[#333] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center gap-2">
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D71920] animate-pulse" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Logout */}
      <div className={`border-t border-[#242424] ${collapsed ? "p-2" : "p-4"}`}>
        {collapsed ? (
          /* Collapsed User & Logout */
          <div className="flex flex-col items-center gap-2">
            {/* User Avatar with Tooltip */}
            <div className="relative group">
              <div className="w-10 h-10 rounded-xl bg-[#1C1C1C] border border-[#2B2B2B] flex items-center justify-center text-gray-200 cursor-default">
                <User className="w-4 h-4" />
                <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#121212]"></span>
              </div>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1E1E1E] text-white text-xs font-bold rounded-lg shadow-2xl border border-[#333] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
                <div>Administrator</div>
                <div className="text-[10px] text-emerald-400 font-normal">Active Session</div>
              </div>
            </div>

            {/* Logout Button with Tooltip */}
            <div className="relative group">
              <button
                onClick={handleLogout}
                aria-label="Sign Out"
                className="w-10 h-10 rounded-xl text-gray-400 hover:text-red-400 hover:bg-[#1E1E1E] flex items-center justify-center transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1E1E1E] text-red-400 text-xs font-bold rounded-lg shadow-2xl border border-[#333] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
                Sign Out
              </div>
            </div>
          </div>
        ) : (
          /* Expanded User Profile Card */
          <div className="bg-[#181818] rounded-xl p-3 flex items-center justify-between border border-[#2B2B2B] shadow-inner">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-neutral-800 text-gray-200 flex items-center justify-center shrink-0 border border-neutral-700">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">Administrator</div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Active Session
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#252525] rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
