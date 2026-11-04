"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Save,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  PenTool,
  Loader2,
  User,
  ShieldCheck,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  MapPin,
  CarFront,
  Users,
  Download,
  Trash2,
} from "lucide-react";
import api from "@/lib/api";
import SignatureModal from "@/components/ui/SignatureModal";
import AccidentSketchCanvas from "@/components/ui/AccidentSketchCanvas";
import { generateAccidentClaimPDF } from "@/lib/pdf-generator";

interface AccidentClaimFormProps {
  claimId: string;
}

export default function AccidentClaimForm({ claimId }: AccidentClaimFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSigModal, setShowSigModal] = useState(false);

  // Collapsible Section States
  const [showOwnerDetails, setShowOwnerDetails] = useState(false);
  const [showWitnessDetails, setShowWitnessDetails] = useState(false);

  const checklistKeys = [
    { key: "checklist_vd", label: "V.D" },
    { key: "checklist_dvla", label: "DVLA" },
    { key: "checklist_badge", label: "Badge" },
    { key: "checklist_recovery", label: "Recovery" },
    { key: "checklist_hire", label: "Hire" },
    { key: "checklist_ni_no", label: "NI No" },
    { key: "checklist_storage", label: "Storage" },
    { key: "checklist_plate", label: "Plate" },
    { key: "checklist_licence", label: "Licence" },
    { key: "checklist_logbook", label: "Logbook" },
    { key: "checklist_pi", label: "P.I" },
  ];

  const [formData, setFormData] = useState<Record<string, any>>({
    // Checklists
    checklist_vd: false,
    checklist_dvla: false,
    checklist_badge: false,
    checklist_recovery: false,
    checklist_hire: false,
    checklist_ni_no: false,
    checklist_storage: false,
    checklist_plate: false,
    checklist_licence: false,
    checklist_logbook: false,
    checklist_pi: false,

    // Incident Details
    date_of_claim: "",
    accident_date: "",
    accident_time: "",
    accident_location: "",
    accident_description: "",

    // Client Vehicle
    client_vehicle_make: "",
    client_vehicle_model: "",
    client_registration: "",
    client_policy_no: "",
    client_cover_type: "Comprehensive",
    client_policy_holder: "",

    // Driver Details
    driver_full_name: "",
    driver_telephone: "",
    driver_email: "",
    driver_address: "",
    driver_postcode: "",
    driver_dob: "",
    driver_ni_number: "",
    driver_occupation: "",

    // Owner Details
    owner_full_name: "",
    owner_telephone: "",
    owner_email: "",
    owner_address: "",
    owner_postcode: "",
    owner_dob: "",
    owner_ni_number: "",
    owner_occupation: "",

    // Third Party Details
    third_party_name: "",
    third_party_telephone: "",
    third_party_email: "",
    third_party_address: "",
    third_party_postcode: "",
    third_party_dob: "",
    third_party_ni_number: "",
    third_party_occupation: "",
    third_party_vehicle_make: "",
    third_party_vehicle_model: "",
    third_party_registration: "",
    third_party_policy_no: "",
    third_party_policy_holder: "",

    // Circumstances & Fault
    fault_opinion: "Non-Fault",
    fault_reason: "",
    road_conditions: "Dry",
    weather_conditions: "Clear",

    // Witnesses
    witness1_name: "",
    witness1_telephone: "",
    witness1_address: "",
    witness1_postcode: "",
    witness2_name: "",
    witness2_telephone: "",
    witness2_address: "",
    witness2_postcode: "",

    // Declaration & Employment
    loss_of_earnings: "No",
    employer_details: "",
    print_name: "",
    declaration_date: "",
    client_signature: "",

    // Drawing
    circumstance_drawing: "",
    direction_before_drawing: "",
    direction_after_drawing: "",
  });

  useEffect(() => {
    const fetchForm = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/forms/${claimId}/accident-claim`);
        if (res.data && Object.keys(res.data).length > 0) {
          const d = res.data;
          setFormData((prev) => ({
            ...prev,
            ...d,
            loss_of_earnings: d.loss_of_earnings === true || d.loss_of_earnings === "Yes" ? "Yes" : "No",
          }));
          if (d.owner_full_name && d.owner_full_name !== d.driver_full_name) {
            setShowOwnerDetails(true);
          }
          if (d.witness1_name || d.witness2_name) {
            setShowWitnessDetails(true);
          }
        }
      } catch (err) {
        console.error("Failed to load accident claim:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [claimId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await api.post(`/forms/${claimId}/accident-claim`, formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save accident claim form");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#D71920] mb-2" />
        <span className="text-xs">Loading RTA Accident Claim...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Accident Claim saved successfully!</span>
        </div>
      )}

      {/* 1. Mandatory Checklist Header */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-[#D71920]" />
          <span>Claim Verification Checklist (11 Verification Items)</span>
        </h3>

        <div className="flex flex-wrap gap-2">
          {checklistKeys.map((c) => {
            const isChecked = !!formData[c.key];
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setFormData({ ...formData, [c.key]: !isChecked })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isChecked
                    ? "bg-[#D71920] text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-gray-400" />}
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Incident & Claim Timing */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#D71920]" />
          <span>1. Incident & Accident Circumstances</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Date of Claim</label>
            <input
              type="date"
              value={formData.date_of_claim || ""}
              onChange={(e) => setFormData({ ...formData, date_of_claim: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Date of Accident</label>
            <input
              type="date"
              value={formData.accident_date || ""}
              onChange={(e) => setFormData({ ...formData, accident_date: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Time of Accident</label>
            <input
              type="time"
              value={formData.accident_time || ""}
              onChange={(e) => setFormData({ ...formData, accident_time: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-700 mb-1">Accident Exact Location</label>
            <input
              type="text"
              value={formData.accident_location || ""}
              onChange={(e) => setFormData({ ...formData, accident_location: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. Junction of Stratford Rd & High St, Birmingham B11"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-700 mb-1">Accident Description</label>
            <textarea
              rows={3}
              value={formData.accident_description || ""}
              onChange={(e) => setFormData({ ...formData, accident_description: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="Describe how the accident happened..."
            />
          </div>

          <div className="md:col-span-3 pt-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Accident Circumstances Diagram / Sketch</label>
            <p className="text-[11px] text-gray-500 mb-2">
              Draw road lanes, vehicle movements, and point of impact to illustrate the collision.
            </p>
            <AccidentSketchCanvas
              value={formData.circumstance_drawing || formData.direction_before_drawing}
              onChange={(dataUrl) =>
                setFormData((prev) => ({
                  ...prev,
                  circumstance_drawing: dataUrl,
                  direction_before_drawing: dataUrl,
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* 3. Client Vehicle Details */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <CarFront className="w-4 h-4 text-[#D71920]" />
          <span>2. Client Vehicle & Insurance</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Registration</label>
            <input
              type="text"
              value={formData.client_registration || ""}
              onChange={(e) => setFormData({ ...formData, client_registration: e.target.value.toUpperCase() })}
              className="w-full bg-yellow-50 border border-yellow-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. BD68 XYZ"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Make</label>
            <input
              type="text"
              value={formData.client_vehicle_make || ""}
              onChange={(e) => setFormData({ ...formData, client_vehicle_make: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. Toyota"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Model</label>
            <input
              type="text"
              value={formData.client_vehicle_model || ""}
              onChange={(e) => setFormData({ ...formData, client_vehicle_model: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. Prius"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Policy Number</label>
            <input
              type="text"
              value={formData.client_policy_no || ""}
              onChange={(e) => setFormData({ ...formData, client_policy_no: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Cover Type</label>
            <select
              value={formData.client_cover_type || "Comprehensive"}
              onChange={(e) => setFormData({ ...formData, client_cover_type: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            >
              <option value="Comprehensive">Comprehensive</option>
              <option value="Third Party Fire & Theft">Third Party Fire & Theft</option>
              <option value="Third Party Only">Third Party Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Policy Holder</label>
            <input
              type="text"
              value={formData.client_policy_holder || ""}
              onChange={(e) => setFormData({ ...formData, client_policy_holder: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>
        </div>
      </div>

      {/* 4. Driver Identification */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-4 h-4 text-[#D71920]" />
          <span>3. Driver Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Driver Full Name</label>
            <input
              type="text"
              value={formData.driver_full_name || ""}
              onChange={(e) => setFormData({ ...formData, driver_full_name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Telephone</label>
            <input
              type="text"
              value={formData.driver_telephone || ""}
              onChange={(e) => setFormData({ ...formData, driver_telephone: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.driver_email || ""}
              onChange={(e) => setFormData({ ...formData, driver_email: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-700 mb-1">Postal Address</label>
            <input
              type="text"
              value={formData.driver_address || ""}
              onChange={(e) => setFormData({ ...formData, driver_address: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Postcode</label>
            <input
              type="text"
              value={formData.driver_postcode || ""}
              onChange={(e) => setFormData({ ...formData, driver_postcode: e.target.value.toUpperCase() })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={formData.driver_dob || ""}
              onChange={(e) => setFormData({ ...formData, driver_dob: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">NI Number</label>
            <input
              type="text"
              value={formData.driver_ni_number || ""}
              onChange={(e) => setFormData({ ...formData, driver_ni_number: e.target.value.toUpperCase() })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Occupation</label>
            <input
              type="text"
              value={formData.driver_occupation || ""}
              onChange={(e) => setFormData({ ...formData, driver_occupation: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>
        </div>
      </div>

      {/* 5. Owner Details (Collapsible if different from driver) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <button
          type="button"
          onClick={() => setShowOwnerDetails(!showOwnerDetails)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#D71920]" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              4. Vehicle Owner Details (if different from Driver)
            </h3>
            {formData.owner_full_name && (
              <span className="text-[10px] bg-red-50 text-[#D71920] px-2 py-0.5 rounded font-bold">
                {formData.owner_full_name}
              </span>
            )}
          </div>
          {showOwnerDetails ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showOwnerDetails && (
          <div className="pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner Full Name</label>
              <input
                type="text"
                value={formData.owner_full_name || ""}
                onChange={(e) => setFormData({ ...formData, owner_full_name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner Telephone</label>
              <input
                type="text"
                value={formData.owner_telephone || ""}
                onChange={(e) => setFormData({ ...formData, owner_telephone: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner Email</label>
              <input
                type="email"
                value={formData.owner_email || ""}
                onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner Address</label>
              <input
                type="text"
                value={formData.owner_address || ""}
                onChange={(e) => setFormData({ ...formData, owner_address: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Owner Postcode</label>
              <input
                type="text"
                value={formData.owner_postcode || ""}
                onChange={(e) => setFormData({ ...formData, owner_postcode: e.target.value.toUpperCase() })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 6. Third Party Details */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#D71920]" />
          <span>5. Third Party (At-Fault Party) Details</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Third Party Driver Name</label>
            <input
              type="text"
              value={formData.third_party_name || ""}
              onChange={(e) => setFormData({ ...formData, third_party_name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Telephone</label>
            <input
              type="text"
              value={formData.third_party_telephone || ""}
              onChange={(e) => setFormData({ ...formData, third_party_telephone: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.third_party_email || ""}
              onChange={(e) => setFormData({ ...formData, third_party_email: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.third_party_address || ""}
              onChange={(e) => setFormData({ ...formData, third_party_address: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Postcode</label>
            <input
              type="text"
              value={formData.third_party_postcode || ""}
              onChange={(e) => setFormData({ ...formData, third_party_postcode: e.target.value.toUpperCase() })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Registration</label>
            <input
              type="text"
              value={formData.third_party_registration || ""}
              onChange={(e) => setFormData({ ...formData, third_party_registration: e.target.value.toUpperCase() })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Make</label>
            <input
              type="text"
              value={formData.third_party_vehicle_make || ""}
              onChange={(e) => setFormData({ ...formData, third_party_vehicle_make: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Model</label>
            <input
              type="text"
              value={formData.third_party_vehicle_model || ""}
              onChange={(e) => setFormData({ ...formData, third_party_vehicle_model: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Policy Number</label>
            <input
              type="text"
              value={formData.third_party_policy_no || ""}
              onChange={(e) => setFormData({ ...formData, third_party_policy_no: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>
        </div>
      </div>

      {/* 7. Witnesses Details */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <button
          type="button"
          onClick={() => setShowWitnessDetails(!showWitnessDetails)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D71920]" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              6. Witness Information (Witness 1 & 2)
            </h3>
            {formData.witness1_name && (
              <span className="text-[10px] bg-red-50 text-[#D71920] px-2 py-0.5 rounded font-bold">
                Witness recorded
              </span>
            )}
          </div>
          {showWitnessDetails ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showWitnessDetails && (
          <div className="pt-3 border-t border-gray-100 space-y-4">
            {/* Witness 1 */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-700">Witness 1</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500">Full Name</label>
                  <input
                    type="text"
                    value={formData.witness1_name || ""}
                    onChange={(e) => setFormData({ ...formData, witness1_name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500">Telephone</label>
                  <input
                    type="text"
                    value={formData.witness1_telephone || ""}
                    onChange={(e) => setFormData({ ...formData, witness1_telephone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500">Postcode</label>
                  <input
                    type="text"
                    value={formData.witness1_postcode || ""}
                    onChange={(e) => setFormData({ ...formData, witness1_postcode: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="text-[10px] font-bold text-gray-500">Postal Address</label>
                  <input
                    type="text"
                    value={formData.witness1_address || ""}
                    onChange={(e) => setFormData({ ...formData, witness1_address: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Witness 2 */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-700">Witness 2</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-500">Full Name</label>
                  <input
                    type="text"
                    value={formData.witness2_name || ""}
                    onChange={(e) => setFormData({ ...formData, witness2_name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500">Telephone</label>
                  <input
                    type="text"
                    value={formData.witness2_telephone || ""}
                    onChange={(e) => setFormData({ ...formData, witness2_telephone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500">Postcode</label>
                  <input
                    type="text"
                    value={formData.witness2_postcode || ""}
                    onChange={(e) => setFormData({ ...formData, witness2_postcode: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="text-[10px] font-bold text-gray-500">Postal Address</label>
                  <input
                    type="text"
                    value={formData.witness2_address || ""}
                    onChange={(e) => setFormData({ ...formData, witness2_address: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 8. Declaration & Client Signature */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <PenTool className="w-4 h-4 text-[#D71920]" />
          <span>7. Client Declaration & Signature</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Print Full Name</label>
            <input
              type="text"
              value={formData.print_name || ""}
              onChange={(e) => setFormData({ ...formData, print_name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Declaration Date</label>
            <input
              type="date"
              value={formData.declaration_date || ""}
              onChange={(e) => setFormData({ ...formData, declaration_date: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Loss of Earnings Claimed?</label>
            <select
              value={formData.loss_of_earnings || "No"}
              onChange={(e) => setFormData({ ...formData, loss_of_earnings: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div className="md:col-span-3 p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">Client Signature</span>
              {formData.client_signature && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Signed
                </span>
              )}
            </div>

            <div className="h-24 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
              {formData.client_signature ? (
                <img
                  src={formData.client_signature}
                  alt="Client Signature"
                  className="max-h-full object-contain"
                />
              ) : (
                <span className="text-[11px] text-gray-400 italic">No signature recorded</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSigModal(true)}
                className="flex-1 text-center py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <PenTool className="w-3 h-3 text-[#D71920]" />
                <span>{formData.client_signature ? "Update Signature" : "Sign Now"}</span>
              </button>
              {formData.client_signature && (
                <button
                  type="button"
                  onClick={async () => {
                    setFormData((prev) => ({ ...prev, client_signature: "" }));
                    try {
                      await api.post(`/forms/${claimId}/accident-claim`, { client_signature: null });
                    } catch (err) {
                      console.error("Failed to clear signature:", err);
                    }
                  }}
                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition-colors border border-red-200"
                  title="Clear Signature"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-3 sticky bottom-4 z-20">
        <button
          type="button"
          onClick={() => generateAccidentClaimPDF(claimId, formData)}
          className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all duration-150 active:scale-95"
          title="Export formatted RTA Accident Claim PDF"
        >
          <Download className="w-4 h-4 text-[#D71920]" />
          <span>Download PDF</span>
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#D71920] hover:bg-[#B5141A] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all duration-150 active:scale-95"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save RTA Accident Claim</span>
            </>
          )}
        </button>
      </div>

      {/* Signature Modal */}
      {showSigModal && (
        <SignatureModal
          isOpen={true}
          title="Sign: Client Accident Claim Declaration"
          initialSignature={formData.client_signature}
          onClose={() => setShowSigModal(false)}
          onSave={async (dataUrl) => {
            setFormData((prev) => ({ ...prev, client_signature: dataUrl }));
            setShowSigModal(false);
            try {
              await api.post(`/forms/${claimId}/accident-claim`, {
                client_signature: dataUrl || null,
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
