"use client";

import React, { useState, useEffect } from "react";
import {
  FileX,
  Save,
  CheckCircle2,
  Calendar,
  PenTool,
  Loader2,
  AlertCircle,
  User,
  Mail,
  MapPin,
  CarFront,
  RotateCcw,
  Building2,
  Download,
} from "lucide-react";
import api from "@/lib/api";
import SignatureModal from "@/components/ui/SignatureModal";
import { generateCancellationPDF } from "@/lib/pdf-generator";

interface CancellationFormProps {
  claimId: string;
}

export default function CancellationForm({ claimId }: CancellationFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSigModal, setShowSigModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    postcode: "",
    email: "",
    cancellation_date: new Date().toISOString().split("T")[0],
    vehicle_reg: "",
    reason: "",
    cancellation_signature: "",
    // Legacy compatibility fields
    hirer_name: "",
    hirer_signature: "",
  });

  useEffect(() => {
    const fetchForm = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/forms/${claimId}/cancellation`);
        if (res.data && Object.keys(res.data).length > 0) {
          const d = res.data;
          setFormData((prev) => ({
            ...prev,
            ...d,
            name: d.name || d.hirer_name || prev.name,
            cancellation_signature: d.cancellation_signature || d.hirer_signature || prev.cancellation_signature,
          }));
        } else {
          // Prefill from rental agreement or accident claim
          try {
            const rentRes = await api.get(`/forms/${claimId}/rental-agreement`);
            if (rentRes.data) {
              const r = rentRes.data;
              setFormData((prev) => ({
                ...prev,
                name: r.hirer_name || "",
                address: r.permanent_address || "",
                vehicle_reg: r.hire_vehicle_reg || "",
                cancellation_date: new Date().toISOString().split("T")[0],
              }));
            }
          } catch {
            try {
              const accRes = await api.get(`/forms/${claimId}/accident-claim`);
              if (accRes.data) {
                const a = accRes.data;
                setFormData((prev) => ({
                  ...prev,
                  name: a.driver_full_name || a.owner_full_name || "",
                  address: a.driver_address || a.owner_address || "",
                  postcode: a.driver_postcode || a.owner_postcode || "",
                  email: a.driver_email || a.owner_email || "",
                  vehicle_reg: a.client_registration || "",
                  cancellation_date: new Date().toISOString().split("T")[0],
                }));
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error("Failed to load cancellation form:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [claimId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "name") next.hirer_name = value;
      return next;
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        ...formData,
        hirer_name: formData.name || formData.hirer_name,
        hirer_signature: formData.cancellation_signature || formData.hirer_signature,
      };

      await api.post(`/forms/${claimId}/cancellation`, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert("Failed to save Cancellation Notice");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#D71920] mb-2" />
        <span className="text-xs">Loading Cancellation Notice...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs font-medium pb-12">
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Statutory Notice of Right to Cancel saved successfully!</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#D71920]">
            <FileX className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#121212]">
              Cancellation Notice (14-Day Statutory Right)
            </h2>
            <p className="text-[11px] text-gray-500">
              Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#D71920] hover:bg-[#b5141a] text-white rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Save Notice</span>
        </button>
      </div>

      {/* Statutory Guidance & Destination Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3 p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 leading-relaxed text-[11px]">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Statutory Right to Cancel Notice</span>
            <p>
              If you wish to cancel the contract, you must do so in writing and deliver or send this cancellation form
              back to PCH Hire Ltd by post or email within 14 calendar days from the date of agreement.
            </p>
          </div>
        </div>

        {/* Company Destination Info */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-3">
          <Building2 className="w-4 h-4 text-[#D71920] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-800 block text-xs">Send Cancellation Notice To:</span>
            <p className="text-gray-600 text-[11px] mt-1 leading-relaxed">
              PCH Hire Ltd<br />
              Derby Turn, Building 1, Derby Road<br />
              Burton-On-Trent, Staffordshire, DE14 1RX<br />
              United Kingdom
            </p>
          </div>
        </div>
      </div>

      {/* Cancellation Statement Banner */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="p-4 bg-red-50/50 border border-red-200 rounded-xl text-gray-900 leading-relaxed text-xs">
          I, <span className="font-bold underline decoration-[#D71920]">{formData.name || "________________________"}</span>,
          hereby give notice that I wish to cancel my contract in respect of the vehicle hire and storage agreement
          entered on <span className="font-bold">{formData.cancellation_date || "________________"}</span>.
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-gray-600 mb-1">Customer / Hirer Name</label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Vehicle Registration</label>
            <div className="relative">
              <CarFront className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                name="vehicle_reg"
                value={formData.vehicle_reg || ""}
                onChange={handleChange}
                placeholder="e.g. AB21 CDE"
                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none uppercase font-mono font-bold"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-600 mb-1">Customer Full Address</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
              <textarea
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                rows={2}
                placeholder="House number, street name, and town/city"
                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Postcode</label>
            <input
              type="text"
              name="postcode"
              value={formData.postcode || ""}
              onChange={handleChange}
              placeholder="e.g. B12 0JJ"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none uppercase font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder="client@example.co.uk"
                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Date of Notice</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="date"
                name="cancellation_date"
                value={formData.cancellation_date || ""}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Reason for Cancellation (Optional)</label>
            <input
              type="text"
              name="reason"
              value={formData.reason || ""}
              onChange={handleChange}
              placeholder="e.g. Vehicle repaired early / Third-party settled"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-[#F3F4F6] flex items-center gap-2">
          <PenTool className="w-4 h-4 text-[#D71920]" />
          <span>Customer Signature & Declaration</span>
        </h3>

        <div className="max-w-md mx-auto p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl space-y-3">
          <span className="font-semibold text-gray-700 block text-center">
            Signed by Customer
          </span>
          {formData.cancellation_signature ? (
            <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] flex items-center justify-center">
              <img
                src={formData.cancellation_signature}
                alt="Cancellation Signature"
                className="max-h-28 object-contain"
              />
            </div>
          ) : (
            <div className="h-28 bg-white rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[11px]">
              No cancellation signature captured
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowSigModal(true)}
              className="w-full py-2 bg-white border border-gray-300 hover:border-[#D71920] text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <PenTool className="w-3.5 h-3.5 text-[#D71920]" />
              <span>{formData.cancellation_signature ? "Update Signature" : "Capture Signature"}</span>
            </button>
            {formData.cancellation_signature && (
              <button
                type="button"
                onClick={async () => {
                  setFormData((p) => ({ ...p, cancellation_signature: "", hirer_signature: "" }));
                  try {
                    await api.post(`/forms/${claimId}/cancellation`, {
                      cancellation_signature: null,
                      hirer_signature: null,
                    });
                  } catch (err) {
                    console.error("Failed to clear cancellation signature:", err);
                  }
                }}
                className="px-3 py-2 text-gray-400 hover:text-red-600 transition"
                title="Clear Signature"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => generateCancellationPDF(claimId, formData)}
          className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all duration-150 active:scale-95"
          title="Export formatted Cancellation Notice PDF"
        >
          <Download className="w-3.5 h-3.5 text-[#D71920]" />
          <span>Download PDF</span>
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#D71920] hover:bg-[#b5141a] text-white rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Save Cancellation Notice</span>
        </button>
      </div>

      {/* Signature Modal */}
      {showSigModal && (
        <SignatureModal
          isOpen={true}
          title="Customer Cancellation Signature"
          initialSignature={formData.cancellation_signature}
          onClose={() => setShowSigModal(false)}
          onSave={async (dataUrl) => {
            setFormData((prev) => ({
              ...prev,
              cancellation_signature: dataUrl,
              hirer_signature: dataUrl,
            }));
            setShowSigModal(false);
            try {
              await api.post(`/forms/${claimId}/cancellation`, {
                cancellation_signature: dataUrl || null,
                hirer_signature: dataUrl || null,
              });
            } catch (err) {
              console.error("Signature auto-save error:", err);
            }
          }}
        />
      )}
    </form>
  );
}
