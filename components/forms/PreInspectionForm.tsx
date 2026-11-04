"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Save,
  CheckCircle2,
  Calendar,
  Fuel,
  Gauge,
  PenTool,
  Loader2,
  CarFront,
  CheckCheck,
  RotateCcw,
  AlertTriangle,
  User,
  Hash,
  Download,
} from "lucide-react";
import api from "@/lib/api";
import DamageDiagram from "@/components/ui/DamageDiagram";
import SignatureModal from "@/components/ui/SignatureModal";
import { generatePreInspectionPDF } from "@/lib/pdf-generator";

interface PreInspectionFormProps {
  claimId: string;
}

export const CHECKLIST_ITEMS = [
  "Deep Scratches",
  "Light Scratches",
  "Swirls / Holograms",
  "Clear Coat Failure",
  "Paint Chips",
  "Paint Oxidation",
  "Dents / Dings",
  "Body Rust",
  "Bumper Damage",
  "Wheel Damage",
  "Cracked Windshield",
  "Trunk Damage",
  "Ripped / Torn Flooring",
  "Ripped / Torn Seating",
  "Windshield Scratches / Chips",
  "Emblem Damaged / Missing",
  "Decal Damaged / Missing",
  "Cracked Headlight / Tail Light",
  "Fogged Headlight / Tail Light",
  "Tire Pressure",
  "Waterspot Density",
  "Floor Cleanliness",
  "Seat Cleanliness",
  "Glass Cleanliness",
  "Engine Bay Cleanliness",
  "Interior Cleanliness",
  "Exterior Cleanliness",
  "Dash / Console Cleanliness",
  "Interior Odour",
  "Pet Hair",
];

export default function PreInspectionForm({ claimId }: PreInspectionFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSigField, setActiveSigField] = useState<string | null>(null);

  // Initialize all 30 condition keys
  const initialChecklistState = CHECKLIST_ITEMS.reduce((acc, _, index) => {
    acc[`condition_${index + 1}`] = "";
    return acc;
  }, {} as Record<string, string>);

  const [formData, setFormData] = useState<Record<string, any>>({
    ...initialChecklistState,
    date: new Date().toISOString().split("T")[0],
    customer: "",
    detailer: "",
    order_number: "",
    year: "",
    make: "",
    model: "",
    notes: "",
    recommendations: "",
    customer_signature: "",
    detailer_signature: "",
    annotated_vehicle_image: "",
    damage_diagram: "",
    // Legacy / fleet compatibility fields
    vehicle_reg: "",
    mileage_out: "",
    mileage_in: "",
    fuel_level_out: "Full (8/8)",
    fuel_level_in: "",
  });

  useEffect(() => {
    const fetchForm = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/forms/${claimId}/pre-inspection`);
        if (res.data && Object.keys(res.data).length > 0) {
          const d = res.data;
          setFormData((prev) => ({
            ...prev,
            ...d,
            order_number: d.order_number || d.vehicle_reg || prev.order_number,
            customer: d.customer || prev.customer,
            customer_signature: d.customer_signature || d.hirer_signature || prev.customer_signature,
            detailer_signature: d.detailer_signature || d.inspector_signature || prev.detailer_signature,
            annotated_vehicle_image: d.annotated_vehicle_image || d.damage_diagram || prev.annotated_vehicle_image,
          }));
        } else {
          // Prefill vehicle & customer from rental agreement or accident claim
          try {
            const rentRes = await api.get(`/forms/${claimId}/rental-agreement`);
            if (rentRes.data) {
              const r = rentRes.data;
              setFormData((prev) => ({
                ...prev,
                order_number: r.hire_vehicle_reg || "",
                vehicle_reg: r.hire_vehicle_reg || "",
                customer: r.hirer_name || "",
                make: r.hire_vehicle_make || "",
                model: r.hire_vehicle_model || "",
                mileage_out: r.hire_vehicle_miles_out || "",
                date: r.hire_vehicle_date_out || new Date().toISOString().split("T")[0],
              }));
            }
          } catch {
            try {
              const accRes = await api.get(`/forms/${claimId}/accident-claim`);
              if (accRes.data) {
                const a = accRes.data;
                setFormData((prev) => ({
                  ...prev,
                  customer: a.driver_full_name || a.owner_full_name || "",
                  order_number: a.client_registration || "",
                  vehicle_reg: a.client_registration || "",
                  make: a.client_vehicle_make || "",
                  model: a.client_vehicle_model || "",
                }));
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error("Failed to load pre-inspection:", err);
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
      const next = { ...prev, [name]: value };
      if (name === "order_number") {
        next.vehicle_reg = value;
      }
      return next;
    });
  };

  const handleConditionChange = (condKey: string, value: string) => {
    setFormData((prev) => ({ ...prev, [condKey]: value }));
  };

  const markAllGood = () => {
    const updates: Record<string, string> = {};
    CHECKLIST_ITEMS.forEach((_, idx) => {
      updates[`condition_${idx + 1}`] = "Good";
    });
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const clearAllConditions = () => {
    const updates: Record<string, string> = {};
    CHECKLIST_ITEMS.forEach((_, idx) => {
      updates[`condition_${idx + 1}`] = "";
    });
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        ...formData,
        vehicle_reg: formData.order_number || formData.vehicle_reg,
        hirer_signature: formData.customer_signature,
        inspector_signature: formData.detailer_signature,
        damage_diagram: formData.annotated_vehicle_image,
      };

      await api.post(`/forms/${claimId}/pre-inspection`, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert("Failed to save Pre-Inspection Checklist");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#D71920] mb-2" />
        <span className="text-xs">Loading Pre-Inspection Form...</span>
      </div>
    );
  }

  // Count checklist completion
  const checkedCount = CHECKLIST_ITEMS.filter(
    (_, i) => !!formData[`condition_${i + 1}`]
  ).length;

  return (
    <form onSubmit={handleSave} className="space-y-6 text-xs font-medium pb-12">
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pre-Inspection Checklist successfully saved!</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#D71920]">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#121212]">
              Pre-Inspection Checklist & Condition Report
            </h2>
            <p className="text-[11px] text-gray-500">
              30-point vehicle inspection, damage diagram, and handover signatures
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-gray-100 rounded-lg text-gray-700 text-[11px] font-semibold">
            {checkedCount} / {CHECKLIST_ITEMS.length} Checked
          </span>
          <button
            type="button"
            onClick={markAllGood}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All Good</span>
          </button>
          <button
            type="button"
            onClick={clearAllConditions}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#D71920] hover:bg-[#b5141a] text-white rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Inspection</span>
          </button>
        </div>
      </div>

      {/* Section 1: Basic Vehicle & Inspection Info */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-[#F3F4F6] flex items-center gap-2">
          <CarFront className="w-4 h-4 text-[#D71920]" />
          <span>Vehicle & Inspection Details</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-600 mb-1">Inspection Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="date"
                name="date"
                value={formData.date || ""}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Customer / Hirer</label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                name="customer"
                value={formData.customer || ""}
                onChange={handleChange}
                placeholder="Full Hirer Name"
                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Detailer / Inspector</label>
            <input
              type="text"
              name="detailer"
              value={formData.detailer || ""}
              onChange={handleChange}
              placeholder="Inspector Name"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Car Reg / Order #</label>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                name="order_number"
                value={formData.order_number || ""}
                onChange={handleChange}
                placeholder="e.g. AB21 CDE"
                className="w-full pl-9 pr-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white font-mono uppercase font-bold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Year</label>
            <input
              type="text"
              name="year"
              value={formData.year || ""}
              onChange={handleChange}
              placeholder="e.g. 2022"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 mb-1">Make</label>
            <input
              type="text"
              name="make"
              value={formData.make || ""}
              onChange={handleChange}
              placeholder="e.g. Mercedes-Benz"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-600 mb-1">Model</label>
            <input
              type="text"
              name="model"
              value={formData.model || ""}
              onChange={handleChange}
              placeholder="e.g. E-Class E220d AMG Line"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            />
          </div>
        </div>

        {/* Mileage & Fuel Optional Handover Bar */}
        <div className="pt-3 border-t border-[#F3F4F6] grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-600 mb-1 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-gray-400" />
              <span>Mileage Out</span>
            </label>
            <input
              type="number"
              name="mileage_out"
              value={formData.mileage_out || ""}
              onChange={handleChange}
              placeholder="e.g. 24500"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-gray-400" />
              <span>Mileage In</span>
            </label>
            <input
              type="number"
              name="mileage_in"
              value={formData.mileage_in || ""}
              onChange={handleChange}
              placeholder="e.g. 25100"
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1 flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-gray-400" />
              <span>Fuel Level Out</span>
            </label>
            <select
              name="fuel_level_out"
              value={formData.fuel_level_out || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            >
              <option value="Full (8/8)">Full (8/8)</option>
              <option value="3/4 (6/8)">3/4 (6/8)</option>
              <option value="1/2 (4/8)">1/2 (4/8)</option>
              <option value="1/4 (2/8)">1/4 (2/8)</option>
              <option value="Empty (0/8)">Empty (0/8)</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-600 mb-1 flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-gray-400" />
              <span>Fuel Level In</span>
            </label>
            <select
              name="fuel_level_in"
              value={formData.fuel_level_in || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none"
            >
              <option value="">Select level...</option>
              <option value="Full (8/8)">Full (8/8)</option>
              <option value="3/4 (6/8)">3/4 (6/8)</option>
              <option value="1/2 (4/8)">1/2 (4/8)</option>
              <option value="1/4 (2/8)">1/4 (2/8)</option>
              <option value="Empty (0/8)">Empty (0/8)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: 30-Point Checklist */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-[#D71920]" />
            <span>30-Point Vehicle Condition Checkpoints</span>
          </h3>
          <span className="text-gray-400 text-[11px]">Select Good, Moderate, or Poor for each item</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CHECKLIST_ITEMS.map((item, index) => {
            const condKey = `condition_${index + 1}`;
            const currentVal = formData[condKey] || "";

            return (
              <div
                key={condKey}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                  currentVal === "Good"
                    ? "bg-emerald-50/40 border-emerald-200"
                    : currentVal === "Moderate"
                    ? "bg-amber-50/40 border-amber-200"
                    : currentVal === "Poor"
                    ? "bg-red-50/40 border-red-200"
                    : "bg-[#F9FAFB] border-[#E5E7EB]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-[#121212] truncate">
                    {item}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleConditionChange(condKey, "Good")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      currentVal === "Good"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    Good
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConditionChange(condKey, "Moderate")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      currentVal === "Moderate"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    Moderate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConditionChange(condKey, "Poor")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      currentVal === "Poor"
                        ? "bg-[#D71920] text-white shadow-xs"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    Poor
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Notes & Recommendations */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-[#F3F4F6]">
          Inspector Notes & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 mb-1 font-semibold">General Observations & Notes</label>
            <textarea
              name="notes"
              value={formData.notes || ""}
              onChange={handleChange}
              rows={4}
              placeholder="Record any existing defects, stone chips, alloy scuffs, or interior wear..."
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none resize-none leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1 font-semibold">Suggested Repairs / Actions</label>
            <textarea
              name="recommendations"
              value={formData.recommendations || ""}
              onChange={handleChange}
              rows={4}
              placeholder="Recommended actions before next dispatch or maintenance schedule..."
              className="w-full px-3 py-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#D71920] focus:bg-white outline-none resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* Section 4: Vehicle Defect Diagram */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#F3F4F6]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <CarFront className="w-4 h-4 text-[#D71920]" />
              <span>Vehicle Condition Diagram</span>
            </h3>
            <p className="text-[11px] text-gray-500">
              Draw or mark visible scratches, dents, and bodywork imperfections on the vehicle template
            </p>
          </div>
          {formData.annotated_vehicle_image && (
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, annotated_vehicle_image: "", damage_diagram: "" }))}
              className="text-[11px] text-[#D71920] hover:underline font-semibold"
            >
              Clear Diagram
            </button>
          )}
        </div>

        <div className="flex justify-center">
          <DamageDiagram
            value={formData.annotated_vehicle_image || formData.damage_diagram}
            onChange={(dataUrl) =>
              setFormData((prev) => ({
                ...prev,
                annotated_vehicle_image: dataUrl,
                damage_diagram: dataUrl,
              }))
            }
          />
        </div>
      </div>

      {/* Section 5: Handover Signatures */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-[#F3F4F6] flex items-center gap-2">
          <PenTool className="w-4 h-4 text-[#D71920]" />
          <span>Handover Declarations & Signatures</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Signature */}
          <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <div>
              <span className="font-semibold text-gray-700 block mb-1">Customer / Hirer Signature</span>
              <p className="text-[11px] text-gray-500 mb-3">
                I acknowledge receipt of the vehicle in the condition noted above.
              </p>
              {formData.customer_signature ? (
                <div className="p-2 bg-white rounded-lg border border-[#E5E7EB] mb-3 flex items-center justify-center">
                  <img
                    src={formData.customer_signature}
                    alt="Customer Signature"
                    className="max-h-24 object-contain"
                  />
                </div>
              ) : (
                <div className="h-24 bg-white rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[11px] mb-3">
                  No signature captured
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSigField("customer_signature")}
                className="w-full py-2 bg-white border border-gray-300 hover:border-[#D71920] text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <PenTool className="w-3.5 h-3.5 text-[#D71920]" />
                <span>{formData.customer_signature ? "Update Customer Signature" : "Capture Customer Signature"}</span>
              </button>
              {formData.customer_signature && (
                <button
                  type="button"
                  onClick={async () => {
                    setFormData((p) => ({ ...p, customer_signature: "" }));
                    try {
                      await api.post(`/forms/${claimId}/pre-inspection`, {
                        customer_signature: null,
                        hirer_signature: null,
                      });
                    } catch (err) {
                      console.error("Failed to clear customer signature:", err);
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

          {/* Detailer / Inspector Signature */}
          <div className="p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <div>
              <span className="font-semibold text-gray-700 block mb-1">Detailer / Inspector Signature</span>
              <p className="text-[11px] text-gray-500 mb-3">
                I certify that I have conducted this 30-point inspection truthfully and accurately.
              </p>
              {formData.detailer_signature ? (
                <div className="p-2 bg-white rounded-lg border border-[#E5E7EB] mb-3 flex items-center justify-center">
                  <img
                    src={formData.detailer_signature}
                    alt="Detailer Signature"
                    className="max-h-24 object-contain"
                  />
                </div>
              ) : (
                <div className="h-24 bg-white rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-[11px] mb-3">
                  No signature captured
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSigField("detailer_signature")}
                className="w-full py-2 bg-white border border-gray-300 hover:border-[#D71920] text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <PenTool className="w-3.5 h-3.5 text-[#D71920]" />
                <span>{formData.detailer_signature ? "Update Inspector Signature" : "Capture Inspector Signature"}</span>
              </button>
              {formData.detailer_signature && (
                <button
                  type="button"
                  onClick={async () => {
                    setFormData((p) => ({ ...p, detailer_signature: "" }));
                    try {
                      await api.post(`/forms/${claimId}/pre-inspection`, {
                        detailer_signature: null,
                        inspector_signature: null,
                      });
                    } catch (err) {
                      console.error("Failed to clear detailer signature:", err);
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

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => generatePreInspectionPDF(claimId, formData)}
          className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all duration-150 active:scale-95"
          title="Export formatted Pre-Inspection PDF"
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
          <span>Save Pre-Inspection Checklist</span>
        </button>
      </div>

      {/* Signature Modal */}
      {activeSigField && (
        <SignatureModal
          isOpen={true}
          title={
            activeSigField === "customer_signature"
              ? "Customer / Hirer Signature"
              : "Detailer / Inspector Signature"
          }
          initialSignature={(formData as any)[activeSigField]}
          onClose={() => setActiveSigField(null)}
          onSave={async (dataUrl) => {
            const field = activeSigField;
            setFormData((prev) => ({ ...prev, [field]: dataUrl }));
            setActiveSigField(null);
            const sigPayload: Record<string, any> = { [field]: dataUrl || null };
            if (field === "customer_signature") sigPayload["hirer_signature"] = dataUrl || null;
            if (field === "detailer_signature") sigPayload["inspector_signature"] = dataUrl || null;
            try {
              await api.post(`/forms/${claimId}/pre-inspection`, sigPayload);
            } catch (err) {
              console.error("Signature auto-save error:", err);
            }
          }}
        />
      )}
    </form>
  );
}
