"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  FileText,
  AlertTriangle,
  ClipboardCheck,
  Warehouse,
  FileX,
  FileCheck,
  ArrowLeft,
  Pencil,
  Check,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  CarFront,
  UserCheck,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import api from "@/lib/api";
import RentalAgreementForm from "@/components/forms/RentalAgreementForm";
import AccidentClaimForm from "@/components/forms/AccidentClaimForm";
import PreInspectionForm from "@/components/forms/PreInspectionForm";
import StorageForm from "@/components/forms/StorageForm";
import CancellationForm from "@/components/forms/CancellationForm";
import DocumentManager from "@/components/forms/DocumentManager";

type FormTab =
  | "rental-agreement"
  | "accident-claim"
  | "pre-inspection"
  | "storage-recovery"
  | "cancellation"
  | "documents";

export default function SingleClaimPage() {
  const params = useParams();
  const router = useRouter();
  const initialId = String(params.id);

  const [claimId, setClaimId] = useState(initialId);
  const [claimData, setClaimData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FormTab>("rental-agreement");

  const handleTabChange = (tabId: FormTab) => {
    setActiveTab(tabId);
  };

  // Inline ID Editing State
  const [isEditingId, setIsEditingId] = useState(false);
  const [tempId, setTempId] = useState(initialId);
  const [savingId, setSavingId] = useState(false);
  const [idError, setIdError] = useState<string | null>(null);

  // Link Existing Case Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [availableCases, setAvailableCases] = useState<any[]>([]);
  const [selectedCaseToLink, setSelectedCaseToLink] = useState("");
  const [linkingCase, setLinkingCase] = useState(false);

  const handleOpenLinkModal = async () => {
    setShowLinkModal(true);
    try {
      const res = await api.get("/claims/existing-customers");
      setAvailableCases(res.data.filter((c: any) => String(c.claim_id) !== String(claimId)));
    } catch (err) {
      console.error("Failed to load existing customers:", err);
    }
  };

  const handleConfirmLink = async () => {
    if (!selectedCaseToLink) return;
    setLinkingCase(true);
    try {
      await api.put(`/claims/${claimId}`, {
        is_existing_customer: true,
        linked_claim_id: selectedCaseToLink,
      });
      setShowLinkModal(false);
      fetchClaim();
    } catch (err) {
      alert("Failed to link case");
    } finally {
      setLinkingCase(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Are you sure you want to remove the link to this case?")) return;
    try {
      await api.put(`/claims/${claimId}`, {
        is_existing_customer: false,
        linked_claim_id: "",
      });
      fetchClaim();
    } catch (err) {
      alert("Failed to unlink case");
    }
  };

  const fetchClaim = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/claims/${claimId}`);
      setClaimData(res.data);
      setTempId(res.data.claim_id);
    } catch (err) {
      console.error("Failed to fetch claim:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaim();
  }, [claimId]);

  const handleUpdateClaimId = async () => {
    if (!tempId.trim() || tempId.trim() === claimId) {
      setIsEditingId(false);
      return;
    }

    setSavingId(true);
    setIdError(null);

    try {
      const res = await api.put(`/claims/${claimId}`, {
        new_claim_id: tempId.trim(),
      });

      const newId = res.data.claim_id;
      setClaimId(newId);
      setIsEditingId(false);
      router.replace(`/claims/${newId}`);
    } catch (err: any) {
      setIdError(err?.response?.data?.detail || "Failed to update Claim ID");
    } finally {
      setSavingId(false);
    }
  };

  const tabs: { id: FormTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "rental-agreement", label: "Hire Agreement", icon: FileText },
    { id: "accident-claim", label: "RTA Accident Form", icon: AlertTriangle },
    { id: "pre-inspection", label: "Hire Vehicle Checklist", icon: ClipboardCheck },
    { id: "storage-recovery", label: "Storage & Recovery", icon: Warehouse },
    { id: "cancellation", label: "Cancellation Notice", icon: FileX },
    { id: "documents", label: "Documents & PDFs", icon: FileCheck },
  ];

  if (loading && !claimData) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#D71920]" />
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-[#E5E7EB] px-8 py-4 sticky top-0 z-30 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/claims")}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                title="Back to Claims Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Editable Claim ID */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-bold text-lg">Claim </span>
                {isEditingId ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tempId}
                      onChange={(e) => setTempId(e.target.value)}
                      className="w-24 bg-red-50 border border-[#D71920] rounded-lg px-2.5 py-1 text-base font-black text-[#D71920] focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateClaimId}
                      disabled={savingId}
                      className="p-1 bg-[#D71920] text-white rounded hover:bg-[#B5141A]"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setTempId(claimId);
                        setIsEditingId(false);
                      }}
                      className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span className="text-2xl font-black text-[#D71920] tracking-tight">
                      {claimId}
                    </span>
                    <button
                      onClick={() => setIsEditingId(true)}
                      className="p-1 text-gray-400 hover:text-[#D71920] rounded opacity-60 group-hover:opacity-100 transition-opacity"
                      title="Edit Claim ID manually"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Claimant */}
              <div className="border-l border-gray-200 pl-4 hidden md:block">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#151515]">
                    {claimData?.claimant_name || "Claimant"}
                  </span>
                  {claimData?.is_existing_customer ? (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-[#D71920] border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      <UserCheck className="w-3 h-3 text-[#D71920]" />
                      <span>Existing Customer</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleOpenLinkModal}
                      className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#D71920] hover:underline font-semibold"
                      title="Link this claim to an existing customer / previous case"
                    >
                      <LinkIcon className="w-2.5 h-2.5" />
                      <span>Link Previous Case</span>
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-gray-400 flex items-center gap-2.5 mt-0.5">
                  <span>Type: <strong className="text-gray-700">{claimData?.claim_type}</strong></span>
                  {claimData?.linked_claim_id && (
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/claims/${claimData.linked_claim_id}`}
                        className="inline-flex items-center gap-1 text-[#D71920] hover:underline font-bold text-[11px]"
                        title="Jump to previous case"
                      >
                        <LinkIcon className="w-3 h-3 text-[#D71920]" />
                        <span>Case {claimData.linked_claim_id}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                      <button
                        onClick={handleUnlink}
                        className="text-gray-400 hover:text-red-600 text-[10px] px-1 hover:bg-gray-100 rounded"
                        title="Remove case link"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status & Assigned Car */}
            <div className="flex items-center gap-3">
              {claimData?.assigned_vehicle_reg && (
                <div className="flex items-center gap-1.5 bg-yellow-400 text-black px-2.5 py-1 rounded border border-yellow-500 font-extrabold text-xs uk-plate shadow-xs">
                  <CarFront className="w-3.5 h-3.5 text-black" />
                  <span>{claimData.assigned_vehicle_reg}</span>
                </div>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{claimData?.status || "Active"}</span>
              </span>
            </div>
          </div>

          {idError && (
            <div className="mt-2 text-xs text-red-600 font-medium">{idError}</div>
          )}

          {/* Form Tabs Navigation Bar */}
          <div className="flex items-center gap-1 mt-4 overflow-x-auto border-t border-gray-100 pt-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
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
        </div>

        {/* Tab Content Canvas */}
        <div className="p-8 max-w-6xl w-full mx-auto">
          {activeTab === "rental-agreement" && <RentalAgreementForm claimId={claimId} />}
          {activeTab === "accident-claim" && <AccidentClaimForm claimId={claimId} />}
          {activeTab === "pre-inspection" && <PreInspectionForm claimId={claimId} />}
          {activeTab === "storage-recovery" && <StorageForm claimId={claimId} />}
          {activeTab === "cancellation" && <CancellationForm claimId={claimId} />}
          {activeTab === "documents" && <DocumentManager claimId={claimId} />}
        </div>

        {/* Link Previous Case Modal */}
        {showLinkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100">
              <button
                onClick={() => setShowLinkModal(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#D71920] flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Link Existing Customer Case</h3>
                  <p className="text-[11px] text-gray-500">Connect Claim {claimId} to a previous case</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Select Previous Case
                  </label>
                  <select
                    value={selectedCaseToLink}
                    onChange={(e) => setSelectedCaseToLink(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="">-- Choose Previous Case --</option>
                    {availableCases.map((c) => (
                      <option key={c.claim_id} value={c.claim_id}>
                        {c.claimant_name} (Case {c.claim_id} • {c.claim_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLink}
                    disabled={!selectedCaseToLink || linkingCase}
                    className="bg-[#D71920] hover:bg-[#B5141A] disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    {linkingCase ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                    <span>Link Case</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    );
}
