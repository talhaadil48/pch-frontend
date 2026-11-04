"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  FileText,
  ShieldCheck,
  Briefcase,
  AlertTriangle,
  Search,
  Plus,
  CarFront,
  ChevronRight,
  Trash2,
  RotateCcw,
  XCircle,
  Loader2,
  Calendar,
  X,
  Hash,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Layers,
  UserCheck,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import api from "@/lib/api";

type ClaimTypeFilter = "all" | "private" | "taxi" | "vehicle damage";

interface Claim {
  claim_id: string;
  claimant_name: string;
  claim_type: string;
  status: string;
  ref_no?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  deleted_at?: string;
  is_deleted?: boolean;
  assigned_vehicle_reg?: string;
  is_existing_customer?: boolean;
  linked_claim_id?: string;
}

export default function ClaimsDashboard() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ClaimTypeFilter>("all");
  const [isDeletedView, setIsDeletedView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({ active_count: 0, deleted_count: 0 });
  const [showModal, setShowModal] = useState(false);

  // New Claim Form State
  const [newClaimId, setNewClaimId] = useState("");
  const [claimantName, setClaimantName] = useState("");
  const [claimType, setClaimType] = useState("taxi");
  const [refNo, setRefNo] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Existing Customer Linking State
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const fetchClaims = async () => {
    if (claims.length === 0) {
      setLoading(true);
    }
    try {
      const claimsRes = await api.get("/claims", {
        params: {
          claim_type: activeFilter === "all" ? undefined : activeFilter,
          search: searchQuery || undefined,
          recently_deleted: isDeletedView,
        },
      });
      setClaims(claimsRes.data);
    } catch (err) {
      console.error("Failed to load claims:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounts = async () => {
    try {
      const countsRes = await api.get("/claims/counts");
      if (countsRes.data) {
        setCounts(countsRes.data);
      }
    } catch (err) {
      console.error("Failed to load counts:", err);
    }
  };

  // Fetch counts on mount and when switching between active & deleted views
  useEffect(() => {
    fetchCounts();
  }, [isDeletedView]);

  // Consolidated single debounced fetch for claims list (prevents duplicate initial requests)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClaims();
    }, 200);
    return () => clearTimeout(timer);
  }, [activeFilter, isDeletedView, searchQuery]);

  const handleOpenNewClaimModal = async () => {
    setShowModal(true);
    setModalError(null);
    setIsExistingCustomer(false);
    setSelectedCustomerId("");
    setSelectedCustomer(null);
    setClaimantName("");
    setRefNo("");
    setPhone("");
    setEmail("");

    try {
      const [idRes, custRes] = await Promise.all([
        api.get("/claims/next-id"),
        api.get("/claims/existing-customers"),
      ]);
      setNewClaimId(idRes.data.next_id);
      setExistingCustomers(custRes.data);
    } catch {
      setNewClaimId("101");
    }
  };

  const handleToggleExistingCustomer = (checked: boolean) => {
    setIsExistingCustomer(checked);
    if (!checked) {
      setSelectedCustomerId("");
      setSelectedCustomer(null);
    }
  };

  const handleSelectExistingCustomer = (claimId: string) => {
    setSelectedCustomerId(claimId);
    if (!claimId) {
      setSelectedCustomer(null);
      return;
    }

    const cust = existingCustomers.find((c) => c.claim_id === claimId);
    if (cust) {
      setSelectedCustomer(cust);
      setClaimantName(cust.claimant_name || "");
      setPhone(cust.contact_phone || cust.phone || "");
      setEmail(cust.contact_email || cust.email || "");
      if (cust.claim_type) setClaimType(cust.claim_type);
      if (cust.ref_no) setRefNo(`Prev: ${cust.ref_no}`);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      const res = await api.post("/claims", {
        claim_id: newClaimId.trim(),
        claimant_name: claimantName.trim(),
        claim_type: claimType,
        ref_no: refNo.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        is_existing_customer: isExistingCustomer,
        linked_claim_id: isExistingCustomer && selectedCustomerId ? selectedCustomerId : undefined,
      });

      setShowModal(false);
      setClaimantName("");
      setRefNo("");
      setPhone("");
      setEmail("");
      setIsExistingCustomer(false);
      setSelectedCustomerId("");
      setSelectedCustomer(null);

      router.push(`/claims/${res.data.claim_id}`);
    } catch (err: any) {
      setModalError(err?.response?.data?.detail || "Failed to create claim");
    } finally {
      setModalLoading(false);
    }
  };

  // Soft Delete Claim
  const handleDeleteClaim = async (claimId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Move Claim ${claimId} to Recently Deleted? (Any assigned fleet vehicle will be released back to Available)`)) return;

    try {
      await api.delete(`/claims/${claimId}`);
      fetchClaims();
      fetchCounts();
    } catch (err) {
      alert("Failed to delete claim");
    }
  };

  // Restore Claim
  const handleRestoreClaim = async (claimId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/claims/${claimId}/restore`);
      fetchClaims();
      fetchCounts();
    } catch (err) {
      alert("Failed to restore claim");
    }
  };

  // Permanently Delete Claim
  const handlePermanentDelete = async (claimId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to PERMANENTLY delete Claim ${claimId}? This action cannot be undone.`)) return;

    try {
      await api.delete(`/claims/${claimId}/permanent`);
      fetchClaims();
      fetchCounts();
    } catch (err) {
      alert("Failed to permanently delete claim");
    }
  };

  const filterTabs: { id: ClaimTypeFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "all", label: "All Claims", icon: FileText },
    { id: "private", label: "Private Claims", icon: ShieldCheck },
    { id: "taxi", label: "Taxi Claims", icon: Briefcase },
    { id: "vehicle damage", label: "Vehicle Damage", icon: AlertTriangle },
  ];

  return (
    <main className="flex-1 flex flex-col min-w-0">
      <Header
        title="Claims Dashboard"
        subtitle="Unified claim registry and management"
        onNewClaim={handleOpenNewClaimModal}
      />

        <div className="p-6 max-w-7xl w-full mx-auto space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: View & Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Active / Deleted Segmented Pill */}
              <div className="inline-flex bg-white p-1 rounded-xl border border-[#E5E7EB] shadow-xs">
                {filterTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = !isDeletedView && activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setIsDeletedView(false);
                        setActiveFilter(tab.id);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        active
                          ? "bg-[#D71920] text-white shadow-xs"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Recently Deleted Option Button */}
              <button
                onClick={() => setIsDeletedView(!isDeletedView)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isDeletedView
                    ? "bg-[#151515] text-white border-[#151515] shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Trash2 className={`w-3.5 h-3.5 ${isDeletedView ? "text-red-400" : "text-gray-500"}`} />
                <span>Recently Deleted</span>
                {counts.deleted_count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isDeletedView
                        ? "bg-[#D71920] text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {counts.deleted_count}
                  </span>
                )}
              </button>
            </div>

            {/* Right: Search Input */}
            <div className="relative w-full lg:w-72">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ID, claimant, car reg..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#D71920] shadow-xs"
              />
            </div>
          </div>

          {/* Banner for Deleted View */}
          {isDeletedView && (
            <div className="p-3 bg-neutral-900 text-white rounded-xl text-xs flex items-center justify-between border border-neutral-800">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Viewing <strong>Recently Deleted Claims</strong>. Items here can be restored or permanently removed.</span>
              </div>
              <button
                onClick={() => setIsDeletedView(false)}
                className="text-xs text-gray-300 hover:text-white underline font-semibold"
              >
                Return to Active Claims
              </button>
            </div>
          )}

          {/* Claims Table Card (Compact Row Layout) */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-7 h-7 animate-spin text-[#D71920] mb-2" />
                <span className="text-xs font-medium">Loading claims...</span>
              </div>
            ) : claims.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-gray-800">
                  {isDeletedView ? "No recently deleted claims" : "No claims found"}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isDeletedView
                    ? "Deleted claims will appear here."
                    : searchQuery
                    ? "Try adjusting your search criteria."
                    : "Create a claim to get started."}
                </p>
                {!isDeletedView && (
                  <button
                    onClick={handleOpenNewClaimModal}
                    className="mt-3 inline-flex items-center gap-1.5 bg-[#D71920] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-xs hover:bg-[#B5141A]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Claim</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-gray-50 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-24">Claim ID</th>
                      <th className="py-2.5 px-4">Claimant Name</th>
                      <th className="py-2.5 px-4">Claim Type</th>
                      <th className="py-2.5 px-4">Assigned Vehicle</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">
                        {isDeletedView ? "Deleted Date" : "Date Created"}
                      </th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium">
                    {claims.map((claim) => (
                      <tr
                        key={claim.claim_id}
                        onClick={() => {
                          if (!isDeletedView) router.push(`/claims/${claim.claim_id}`);
                        }}
                        className={`transition-colors ${
                          isDeletedView
                            ? "bg-red-50/20"
                            : "hover:bg-red-50/30 cursor-pointer group"
                        }`}
                      >
                        {/* Compact Claim ID */}
                        <td className="py-2.5 px-4">
                          <span className="font-black text-[#D71920] group-hover:underline text-xs tracking-tight">
                            {claim.claim_id}
                          </span>
                        </td>

                        {/* Claimant */}
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[#151515] leading-snug">{claim.claimant_name}</span>
                            {claim.is_existing_customer && (
                              <span
                                className="inline-flex items-center gap-0.5 bg-red-50 text-[#D71920] border border-red-200 px-1.5 py-0.2 rounded text-[10px] font-bold"
                                title="Existing Customer with prior cases"
                              >
                                <UserCheck className="w-2.5 h-2.5" />
                                <span>Existing</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                            {claim.ref_no && <span>Ref: {claim.ref_no}</span>}
                            {claim.linked_claim_id && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/claims/${claim.linked_claim_id}`);
                                }}
                                className="text-gray-500 hover:text-[#D71920] hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                                title="Jump to previous linked case"
                              >
                                <LinkIcon className="w-2.5 h-2.5 text-gray-400" />
                                <span>Prev {claim.linked_claim_id}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Claim Type */}
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                              claim.claim_type.toLowerCase() === "taxi"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : claim.claim_type.toLowerCase() === "private"
                                ? "bg-sky-100 text-sky-900 border border-sky-300"
                                : "bg-purple-100 text-purple-900 border border-purple-300"
                            }`}
                          >
                            {claim.claim_type}
                          </span>
                        </td>

                        {/* Highly Legible Number Plate */}
                        <td className="py-2.5 px-4">
                          {claim.assigned_vehicle_reg ? (
                            <span className="inline-block bg-[#FFD500] text-black font-black px-2.5 py-0.5 rounded border border-black/80 uk-plate text-xs tracking-wider shadow-2xs">
                              {claim.assigned_vehicle_reg}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px] italic">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{claim.status || "Active"}</span>
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-2.5 px-4 text-gray-500 text-[11px]">
                          {isDeletedView && claim.deleted_at
                            ? new Date(claim.deleted_at).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : claim.created_at
                            ? new Date(claim.created_at).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-4 text-right">
                          {isDeletedView ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={(e) => handleRestoreClaim(claim.claim_id, e)}
                                className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[11px] font-bold border border-emerald-200 transition-colors"
                                title="Restore claim"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                              <button
                                onClick={(e) => handlePermanentDelete(claim.claim_id, e)}
                                className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[11px] font-bold border border-red-200 transition-colors"
                                title="Permanently delete"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={(e) => handleDeleteClaim(claim.claim_id, e)}
                                title="Move to Recently Deleted"
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-gray-300">|</span>
                              <span className="text-gray-500 group-hover:text-[#D71920] transition-colors font-bold text-xs flex items-center">
                                Open <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* New Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E5E7EB] shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h2 className="text-xl font-bold text-[#151515]">Create New Claim</h2>
              <p className="text-xs text-gray-500 mt-1">
                Enter claim details. You can type any custom numeric ID or accept the suggested number.
              </p>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Claim ID (Numeric)
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={newClaimId}
                      onChange={(e) => setNewClaimId(e.target.value)}
                      required
                      placeholder="e.g. 101"
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D71920]"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Custom/typeable number</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Claim Type
                  </label>
                  <select
                    value={claimType}
                    onChange={(e) => setClaimType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="taxi">Taxi Claim</option>
                    <option value="private">Private Claim</option>
                    <option value="vehicle damage">Vehicle Damage</option>
                  </select>
                </div>
              </div>

              {/* Existing Customer Checkbox & Selection Card */}
              <div className="p-3.5 bg-gradient-to-r from-red-50/60 to-gray-50 border border-red-200/80 rounded-xl space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isExistingCustomer}
                    onChange={(e) => handleToggleExistingCustomer(e.target.checked)}
                    className="w-4 h-4 text-[#D71920] border-gray-300 rounded focus:ring-[#D71920]"
                  />
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#D71920]" />
                    <span className="text-xs font-black text-gray-900">
                      Existing Customer?
                    </span>
                    <span className="text-[11px] text-gray-500 font-normal">
                      (Link past case & copy basic details)
                    </span>
                  </div>
                </label>

                {isExistingCustomer && (
                  <div className="pt-2 border-t border-red-200/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                        Select Customer / Previous Case
                      </label>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {existingCustomers.length} clients available
                      </span>
                    </div>

                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectExistingCustomer(e.target.value)}
                      className="w-full bg-white border border-red-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D71920] shadow-xs"
                    >
                      <option value="">-- Choose Existing Customer to Link --</option>
                      {existingCustomers.map((cust) => (
                        <option key={cust.claim_id} value={cust.claim_id}>
                          {cust.claimant_name} — (Case {cust.claim_id} • {cust.claim_type}) {cust.phone ? `• ${cust.phone}` : ""}
                        </option>
                      ))}
                    </select>

                    {selectedCustomer && (
                      <div className="p-3 bg-white rounded-lg border border-red-200 text-xs text-gray-700 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between font-bold text-gray-900">
                          <span className="flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Details copied from Case {selectedCustomer.claim_id}
                          </span>
                          <Link
                            href={`/claims/${selectedCustomer.claim_id}`}
                            target="_blank"
                            className="text-[#D71920] hover:underline inline-flex items-center gap-1 text-[11px]"
                          >
                            <span>Open Case {selectedCustomer.claim_id}</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>

                        <div className="text-[11px] text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 border-t border-gray-100">
                          {selectedCustomer.address && (
                            <div className="sm:col-span-2">
                              <span className="font-bold text-gray-700">Address:</span> {selectedCustomer.address}
                            </div>
                          )}
                          {selectedCustomer.contact_phone && (
                            <div>
                              <span className="font-bold text-gray-700">Phone:</span> {selectedCustomer.contact_phone}
                            </div>
                          )}
                          {selectedCustomer.contact_email && (
                            <div>
                              <span className="font-bold text-gray-700">Email:</span> {selectedCustomer.contact_email}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Claimant Full Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={claimantName}
                    onChange={(e) => setClaimantName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Reference No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PCH-2026-08"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Telephone
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      placeholder="e.g. 07700 900123"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="e.g. claimant@example.co.uk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-[#D71920] hover:bg-[#B5141A] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  {modalLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Claim</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
