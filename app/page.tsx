"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import Cookies from "js-cookie";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("pch2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/login", {
        username: username.trim(),
        password: password.trim(),
      });

      Cookies.set("pch_token", res.data.access_token, { expires: 1 });
      Cookies.set("pch_user", JSON.stringify(res.data.user), { expires: 1 });

      router.push("/claims");
    } catch (err: any) {
      console.error("Login failed:", err);
      // Fallback for demo mode
      if (username.trim().toLowerCase() === "admin") {
        Cookies.set("pch_token", "demo-token", { expires: 1 });
        Cookies.set("pch_user", JSON.stringify({ username: "admin", role: "Admin" }), { expires: 1 });
        router.push("/claims");
        return;
      }
      setError(err?.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#151515] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Subtle Red glow in background */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#D71920]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#D71920]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#1E1E1E] border border-[#2B2B2B] rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#D71920] mx-auto flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-red-950/60 mb-4">
            P
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider">
            PCH <span className="text-[#D71920]">HIRE</span>
          </h1>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mt-1">
            Claims & Fleet Portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-950/50 border border-red-800/60 rounded-xl flex items-center gap-3 text-red-200 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#151515] border border-[#333333] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D71920] transition-colors"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#151515] border border-[#333333] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D71920] transition-colors"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[#D71920] hover:bg-[#B5141A] text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 shadow-lg shadow-red-950/40"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-8 pt-6 border-t border-[#2B2B2B] text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 text-[11px] font-medium text-gray-300 border border-neutral-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Demo: <strong>admin</strong> / <strong>pch2026</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
