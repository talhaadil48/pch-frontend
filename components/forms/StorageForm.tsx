"use client";

import React, { useState, useEffect } from "react";
import {
  Warehouse,
  Save,
  CheckCircle2,
  Calendar,
  PenTool,
  Loader2,
  CarFront,
  User,
  MapPin,
  PoundSterling,
  RotateCcw,
  FileText,
  Download,
} from "lucide-react";
import api from "@/lib/api";
import SignatureModal from "@/components/ui/SignatureModal";
import { generateStoragePDF } from "@/lib/pdf-generator";

interface StorageFormProps {
  claimId: string;
}

export const STORAGE_LOCATIONS: Record<
  string,
  { name: string; city: string; postcode: string }
> = {
  addr1: {
    name: "LITTLE BURTON EAST",
    city: "Burton-on-Trent, Staffordshire",
    postcode: "DE14 1PS",
  },
  addr2: {
    name: "PCH Secure Vehicle Compound",
    city: "Birmingham, West Midlands",
    postcode: "B1 1AA",
  },
};

export default function StorageForm({ claimId }: StorageFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSigField, setActiveSigField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    postcode: "",
    address1: "",
    address2: "",
    vehicle_make: "",
    vehicle_model: "",
    registration_number: "",
    date_of_recovery: "",
    storage_start_date: "",
    storage_end_date: "",
    number_of_days: "",
    charges_per_day: "35.00",
    total_storage_charge: "",
    recovery_charge: "180.00",
    subtotal: "",
    vat_amount: "",
    invoice_total: "",
    client_date: new Date().toISOString().split("T")[0],
    owner_date: new Date().toISOString().split("T")[0],
    storage_location_key: "addr1",
    storage_location: "LITTLE BURTON EAST, Burton-on-Trent, Staffordshire DE14 1PS",
    notes: "",
    client_signature: "",
    owner_signature: "",
    // Legacy compatibility fields
    vehicle_reg: "",
    daily_storage_rate: "35.00",
    company_signature: "",
    engineer_fee: "",
  });

  // Calculate inclusive day difference
  const calculateDays = (start: string, end: string): string => {
    if (!start || !end) return "";
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "";
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return String(diffDays + 1);
    } catch {
      return "";
    }
  };

  // Auto-calculate days when start/end dates change
  useEffect(() => {
    if (formData.storage_start_date && formData.storage_end_date) {
      const days = calculateDays(formData.storage_start_date, formData.storage_end_date);
      setFormData((prev) => {
        if (prev.number_of_days === days) return prev;
        return { ...prev, number_of_days: days };
      });
    }
  }, [formData.storage_start_date, formData.storage_end_date]);

  // Auto-calculate totals
  useEffect(() => {
    const days = parseFloat(String(formData.number_of_days)) || 0;
    const perDay = parseFloat(String(formData.charges_per_day)) || 0;
    const recovery = parseFloat(String(formData.recovery_charge)) || 0;

    const totalStorage = days * perDay;
    const sub = totalStorage + recovery;
    const vat = sub * 0.2;
    const total = sub + vat;

    setFormData((prev) => {
      const next = { ...prev };
      const sTotalStr = totalStorage > 0 ? totalStorage.toFixed(2) : "";
      const subStr = sub > 0 ? sub.toFixed(2) : "";
      const vatStr = vat > 0 ? vat.toFixed(2) : "";
      const totalStr = total > 0 ? total.toFixed(2) : "";

      if (next.total_storage_charge !== sTotalStr) next.total_storage_charge = sTotalStr;
      if (next.subtotal !== subStr) next.subtotal = subStr;
      if (next.vat_amount !== vatStr) next.vat_amount = vatStr;
      if (next.invoice_total !== totalStr) next.invoice_total = totalStr;

      return next;
    });
  }, [formData.number_of_days, formData.charges_per_day, formData.recovery_charge]);

  // Update storage location text when key changes
  useEffect(() => {
    const loc = STORAGE_LOCATIONS[formData.storage_location_key || "addr1"];
    if (loc) {
      const fullText = `${loc.name}, ${loc.city} ${loc.postcode}`;
      setFormData((prev) => ({ ...prev, storage_location: fullText }));
    }
  }, [formData.storage_location_key]);

  useEffect(() => {
    const fetchForm = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/forms/${claimId}/storage-recovery`);
        if (res.data && Object.keys(res.data).length > 0) {
          const d = res.data;
          setFormData((prev) => ({
            ...prev,
            ...d,
            registration_number: d.registration_number || d.vehicle_reg || prev.registration_number,
            charges_per_day: d.charges_per_day ? String(d.charges_per_day) : (d.daily_storage_rate ? String(d.daily_storage_rate) : "35.00"),
            recovery_charge: d.recovery_charge ? String(d.recovery_charge) : "180.00",
            total_storage_charge: d.total_storage_charge ? String(d.total_storage_charge) : "",
            subtotal: d.subtotal ? String(d.subtotal) : "",
            vat_amount: d.vat_amount ? String(d.vat_amount) : "",
            invoice_total: d.invoice_total ? String(d.invoice_total) : "",
            number_of_days: d.number_of_days ? String(d.number_of_days) : "",
            owner_signature: d.owner_signature || d.company_signature || prev.owner_signature,
            storage_location_key: d.storage_location_key || "addr1",
          }));
        } else {
          // Prefill vehicle and client details from accident claim or rental agreement
          try {
            const accRes = await api.get(`/forms/${claimId}/accident-claim`);
            if (accRes.data) {
              const a = accRes.data;
              setFormData((prev) => ({
                ...prev,
                name: a.owner_full_name || a.driver_full_name || "",
                address1: a.driver_address || a.owner_address || "",
                postcode: a.driver_postcode || a.owner_postcode || "",
                vehicle_make: a.client_vehicle_make || "",
                vehicle_model: a.client_vehicle_model || "",
                registration_number: a.client_registration || "",
                date_of_recovery: a.accident_date || "",
                storage_start_date: a.accident_date || "",
              }));
            }
          } catch {
            try {
              const rentRes = await api.get(`/forms/${claimId}/rental-agreement`);
              if (rentRes.data) {
                const r = rentRes.data;
                setFormData((prev) => ({
                  ...prev,
                  name: r.hirer_name || "",
                  address1: r.permanent_address || "",
                  registration_number: r.hire_vehicle_reg || "",
                  vehicle_make: r.hire_vehicle_make || "",
                  vehicle_model: r.hire_vehicle_model || "",
                }));
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error("Failed to load storage form:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [claimId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next: any = { ...prev, [name]: value };
      if (name === "registration_number") {
        next.vehicle_reg = value;
      }
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
        vehicle_reg: formData.registration_number || formData.vehicle_reg,
        company_signature: formData.owner_signature,
        daily_storage_rate: formData.charges_per_day,
      };

      await api.post(`/forms/${claimId}/storage-recovery`, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert("Failed to save Storage & Recovery form");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#D71920] mb-2" />
        <span className="text-xs">Loading Storage Agreement...</span>
      </div>
    );
  }

  const selectedLocation =
    STORAGE_LOCATIONS[formData.storage_location_key || "addr1"] || STORAGE_LOCATIONS["addr1"];

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs font-medium pb-12">
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Storage & Recovery Agreement saved successfully!</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#D71920]">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#121212]">
              Storage and Recovery Invoice and Agreement
            </h2>
            <p className="text-[11px] text-gray-500">
              Recovery charges, daily compound storage calculations, and deferred terms
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#D71920] hover:bg-[#b5141a] text-white rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>Save Agreement</span>
        </button>
      </div>

      {/* Section 1: Client Details */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-[#F3F4F6] flex items-center gap-2">
          <User className="w-4 h-4 text-[#D71920]" />
          <span>Client Details</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="Full Client Name"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Postcode</label>
            <input
              type="text"
              name="postcode"
              value={formData.postcode || ""}
              onChange={handleChange}
              placeholder="e.g. B12 0JJ"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Address Line 1</label>
            <input
              type="text"
              name="address1"
              value={formData.address1 || ""}
              onChange={handleChange}
              placeholder="House number and street"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Address Line 2 (Optional)</label>
            <input
              type="text"
              name="address2"
              value={formData.address2 || ""}
              onChange={handleChange}
              placeholder="Apartment, suite, or area"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Vehicle Information */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-[#F3F4F6] flex items-center gap-2">
          <CarFront className="w-4 h-4 text-[#D71920]" />
          <span>Vehicle Information</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-600 mb-1">Vehicle Make</label>
            <input
              type="text"
              name="vehicle_make"
              value={formData.vehicle_make || ""}
              onChange={handleChange}
              placeholder="e.g. BMW"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Vehicle Model</label>
            <input
              type="text"
              name="vehicle_model"
              value={formData.vehicle_model || ""}
              onChange={handleChange}
              placeholder="e.g. 3 Series 320d"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Registration Number</label>
            <input
              type="text"
              name="registration_number"
              value={formData.registration_number || ""}
              onChange={handleChange}
              placeholder="e.g. VK22 ZZZ"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none uppercase font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Recovery & Storage Dates & Charges */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-[#F3F4F6] flex items-center gap-2">
          <PoundSterling className="w-4 h-4 text-[#D71920]" />
          <span>Recovery & Storage Dates & Billing Calculations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-600 mb-1">Date of Recovery</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="date"
                name="date_of_recovery"
                value={formData.date_of_recovery || ""}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Storage Start Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="date"
                name="storage_start_date"
                value={formData.storage_start_date || ""}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Storage End Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="date"
                name="storage_end_date"
                value={formData.storage_end_date || ""}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Cost calculations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Number of Days (auto-calc)</label>
            <input
              type="number"
              name="number_of_days"
              value={formData.number_of_days || ""}
              onChange={handleChange}
              placeholder="e.g. 14"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Charges Per Day (£)</label>
            <input
              type="number"
              step="0.01"
              name="charges_per_day"
              value={formData.charges_per_day || ""}
              onChange={handleChange}
              placeholder="35.00"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Total Storage Charge (£)</label>
            <input
              type="text"
              readOnly
              name="total_storage_charge"
              value={formData.total_storage_charge ? `£${formData.total_storage_charge}` : "£0.00"}
              className="w-full px-3 py-2 bg-gray-100 border border-[#E5E7EB] rounded-xl font-mono text-gray-700 outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">1 x Recovery Charge (£)</label>
            <input
              type="number"
              step="0.01"
              name="recovery_charge"
              value={formData.recovery_charge || ""}
              onChange={handleChange}
              placeholder="180.00"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Subtotal (£)</label>
            <input
              type="text"
              readOnly
              name="subtotal"
              value={formData.subtotal ? `£${formData.subtotal}` : "£0.00"}
              className="w-full px-3 py-2 bg-gray-100 border border-[#E5E7EB] rounded-xl font-mono text-gray-700 outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1 font-semibold">VAT @ 20% (£)</label>
            <input
              type="text"
              readOnly
              name="vat_amount"
              value={formData.vat_amount ? `£${formData.vat_amount}` : "£0.00"}
              className="w-full px-3 py-2 bg-gray-100 border border-[#E5E7EB] rounded-xl font-mono text-gray-700 outline-none"
            />
          </div>
        </div>

        {/* Invoice Total Banner */}
        <div className="p-4 bg-red-50/60 border border-red-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold text-gray-600">Total Invoice Amount (Inc. VAT)</span>
            <p className="text-[11px] text-gray-500">Storage charge + recovery fee + 20% VAT</p>
          </div>
          <div className="text-2xl font-black text-[#D71920] font-mono">
            {formData.invoice_total ? `£${formData.invoice_total}` : "£0.00"}
          </div>
        </div>
      </div>

      {/* Section 4: Storage Location */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-[#F3F4F6] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#D71920]" />
          <span>Storage Compound Location</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 mb-1">Select Storage Location Compound</label>
            <select
              name="storage_location_key"
              value={formData.storage_location_key || "addr1"}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            >
              <option value="addr1">LITTLE BURTON EAST (Staffordshire)</option>
              <option value="addr2">PCH Secure Vehicle Compound (Birmingham)</option>
            </select>
          </div>

          <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl">
            <span className="text-[11px] font-bold text-gray-700 block mb-0.5">
              {selectedLocation.name}
            </span>
            <span className="text-[11px] text-gray-500 block">{selectedLocation.city}</span>
            <span className="text-[11px] font-mono text-gray-600 font-semibold">
              {selectedLocation.postcode}
            </span>
          </div>
        </div>
      </div>

      {/* Section 5: Deferred Payment & Cancellation Terms */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-[#F3F4F6] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#D71920]" />
          <span>Deferred Payment & Statutory Cancellation Terms</span>
        </h3>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 text-[11px] leading-relaxed space-y-2.5">
          <p>
            I understand the recovery and storage costs are on a deferred payment basis and will be due
            and owing from me on completion of storage and that invoices are payable by me to PCH Hire Ltd
            in no more than one instalment beginning from the date of this agreement within a period of no
            more than 51 weeks beginning from the date of this agreement.
          </p>
          <p>
            It is my contractual obligation to pay the outstanding charges as provided by the deferred payment provision.
          </p>
          <p>
            I further understand that if I fail to co-operate in the pursuit of my claim for damages or appoint
            other solicitors to act on my behalf, then I understand and agree that the account for recovery and
            storage will be immediately due and payable by me to PCH Hire Ltd.
          </p>
          <p>
            This contract constitutes all terms and conditions under this agreement. You have the right to cancel
            this agreement within 14 days starting from the date signed on this agreement. Written cancellation notice
            must be sent within 14 days either by post or email to the address stated above. I understand that any charges
            incurred will be liable to immediate payment by me.
          </p>
        </div>
      </div>

      {/* Section 6: Signatures & Dates */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-[#F3F4F6] flex items-center gap-2">
          <PenTool className="w-4 h-4 text-[#D71920]" />
          <span>Signatures & Acceptance Dates</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Signature */}
          <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <div>
              <span className="font-semibold text-gray-700 block mb-1">Client's Signature</span>
              <p className="text-[11px] text-gray-500 mb-3">Signature of client authorising storage & recovery terms</p>
              {formData.client_signature ? (
                <div className="p-2 bg-white rounded-lg border border-[#E5E7EB] mb-3 flex items-center justify-center">
                  <img
                    src={formData.client_signature}
                    alt="Client Signature"
                    className="max-h-24 object-contain"
                  />
                </div>
              ) : (
                <div className="h-24 bg-white rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[11px] mb-3">
                  No signature captured
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-600 mb-1 text-[11px]">Date Signed</label>
                <input
                  type="date"
                  name="client_date"
                  value={formData.client_date || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSigField("client_signature")}
                  className="w-full py-2 bg-white border border-gray-300 hover:border-[#D71920] text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <PenTool className="w-3.5 h-3.5 text-[#D71920]" />
                  <span>{formData.client_signature ? "Update Client Signature" : "Capture Client Signature"}</span>
                </button>
                {formData.client_signature && (
                  <button
                    type="button"
                    onClick={async () => {
                      setFormData((p) => ({ ...p, client_signature: "" }));
                      try {
                        await api.post(`/forms/${claimId}/storage-recovery`, { client_signature: null });
                      } catch (err) {
                        console.error("Failed to clear client signature:", err);
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

          {/* Owner Signature */}
          <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <div>
              <span className="font-semibold text-gray-700 block mb-1">Owner / Authorised Representative Signature</span>
              <p className="text-[11px] text-gray-500 mb-3">Signature of storage facility / company representative</p>
              {formData.owner_signature ? (
                <div className="p-2 bg-white rounded-lg border border-[#E5E7EB] mb-3 flex items-center justify-center">
                  <img
                    src={formData.owner_signature}
                    alt="Owner Signature"
                    className="max-h-24 object-contain"
                  />
                </div>
              ) : (
                <div className="h-24 bg-white rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[11px] mb-3">
                  No signature captured
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-gray-600 mb-1 text-[11px]">Date Signed</label>
                <input
                  type="date"
                  name="owner_date"
                  value={formData.owner_date || ""}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-lg text-xs outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSigField("owner_signature")}
                  className="w-full py-2 bg-white border border-gray-300 hover:border-[#D71920] text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <PenTool className="w-3.5 h-3.5 text-[#D71920]" />
                  <span>{formData.owner_signature ? "Update Owner Signature" : "Capture Owner Signature"}</span>
                </button>
                {formData.owner_signature && (
                  <button
                    type="button"
                    onClick={async () => {
                      setFormData((p) => ({ ...p, owner_signature: "" }));
                      try {
                        await api.post(`/forms/${claimId}/storage-recovery`, {
                          owner_signature: null,
                          company_signature: null,
                        });
                      } catch (err) {
                        console.error("Failed to clear owner signature:", err);
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
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => generateStoragePDF(claimId, formData)}
          className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all duration-150 active:scale-95"
          title="Export formatted Storage & Recovery PDF"
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
          <span>Save Storage & Recovery Agreement</span>
        </button>
      </div>

      {/* Signature Modal */}
      {activeSigField && (
        <SignatureModal
          isOpen={true}
          title={
            activeSigField === "client_signature"
              ? "Client Signature"
              : "Owner / Company Signature"
          }
          initialSignature={(formData as any)[activeSigField]}
          onClose={() => setActiveSigField(null)}
          onSave={async (dataUrl) => {
            const field = activeSigField;
            setFormData((prev) => ({ ...prev, [field]: dataUrl }));
            setActiveSigField(null);
            const sigPayload: Record<string, any> = { [field]: dataUrl || null };
            if (field === "owner_signature") sigPayload["company_signature"] = dataUrl || null;
            try {
              await api.post(`/forms/${claimId}/storage-recovery`, sigPayload);
            } catch (err) {
              console.error("Signature auto-save error:", err);
            }
          }}
        />
      )}
    </form>
  );
}
