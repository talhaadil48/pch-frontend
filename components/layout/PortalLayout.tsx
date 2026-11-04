"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Cookies from "js-cookie";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/";
  const [authorized, setAuthorized] = useState(isLoginPage);

  useEffect(() => {
    const token = Cookies.get("pch_token");
    if (!isLoginPage) {
      if (!token) {
        setAuthorized(false);
        router.replace("/");
      } else {
        setAuthorized(true);
      }
    } else {
      if (token) {
        router.replace("/claims");
      }
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#151515] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#D71920] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">{children}</div>
    </div>
  );
}
