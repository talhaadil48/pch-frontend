"use client";

import React, { useState, useEffect } from "react";
import {
  CarFront,
  PenTool,
  Save,
  CheckCircle2,
  Calendar,
  Fuel,
  Gauge,
  AlertCircle,
  Loader2,
  ShieldCheck,
  User,
  FileText,
  DollarSign,
  HeartPulse,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import api from "@/lib/api";
import SignatureModal from "@/components/ui/SignatureModal";
import { generateRentalAgreementPDF } from "@/lib/pdf-generator";

interface RentalAgreementFormProps {
  claimId: string;
}

interface ChangeVehicleRecord {
  vehicle_reg: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_group: string;
  date_out: string;
  date_in: string;
  fuel_out: string;
  fuel_in: string;
  miles_out: string;
  miles_in: string;
  rate_per_day: string;
}

export default function RentalAgreementForm({ claimId }: RentalAgreementFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [availableCars, setAvailableCars] = useState<any[]>([]);

  // Section Toggle States
  const [showAdditionalDriver, setShowAdditionalDriver] = useState(false);
  const [showOwnInsurance, setShowOwnInsurance] = useState(false);
  const [showChangeVehicle, setShowChangeVehicle] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState<Record<string, any>>({
    // 1. Hirer Identification & Driving Licence
    title: "Mr",
    hirer_name: "",
    permanent_address: "",
    hirer_address: "",
    hirer_phone: "",
    hirer_email: "",
    dob: "",
    occupation: "",
    licence_no: "",
    date_issued: "",
    expiry_date: "",
    date_test_passed: "",

    // 2. Hire Vehicle
    hire_vehicle_reg: "",
    hire_vehicle_make: "",
    hire_vehicle_model: "",
    hire_vehicle_group: "Group C",
    hire_start_date: "",
    hire_end_date: "",
    hire_vehicle_date_out: "",
    hire_vehicle_date_in: "",
    valid_from: "",
    valid_till: "",
    fuel_out: "Full",
    fuel_in: "",
    hire_vehicle_fuel_out: "Full",
    hire_vehicle_fuel_in: "",
    miles_out: 0,
    miles_in: 0,
    hire_vehicle_miles_out: "",
    hire_vehicle_miles_in: "",
    daily_rate: 65.0,
    hire_vehicle_rate_per_day: 65.0,
    policy_excess: 500.0,
    excess_amount: 500.0,
    deposit: 0.0,
    refuelling_charge: 0.0,

    // 3. Additional Driver
    additional_driver_name: "",
    additional_driver_auth: "No",
    new_licence_no: "",
    new_date_issued: "",
    new_expiry_date: "",
    new_dob: "",
    new_date_test_passed: "",
    new_occupation: "",

    // 4. Hirer's Own Insurance
    own_insurance_confirm: "No",
    insurance_company: "",
    policy_no: "",
    insurance_dates: "",
    insurance_date: "",
    insurance_time: "",

    // 5. Insurance Proposal & Convictions
    motoring_offence_3yrs: "No",
    disqualified_5yrs: "No",
    accident_3yrs: "No",
    insurance_declined_5yrs: "No",
    dishonesty_conviction: "No",

    // 6. Medical Declaration
    medical_condition1: "No",
    medical_condition2: "No",
    medical_details: "",

    // 7. Change of Vehicle
    change_vehicle_history: [] as ChangeVehicleRecord[],

    // 8. Charges Breakdown
    total_days: 0,
    cdw_per_day: 0.0,
    admin_fee: 0.0,
    delivery_charge: 0.0,
    refuelling_total: 0.0,
    subtotal: 0.0,
    vat: 0.0,
    total_cost: 0.0,

    // 9. Signatures & Dates
    hirer_signature_terms: "",
    company_signature: "",
    hirer_signature_insurance: "",
    declaration_signature: "",
    liability_signature: "",
    declaration_date: "",
    liability_date: "",
  });

  // Modal Signature State
  const [activeSigField, setActiveSigField] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [agreeRes, carsRes] = await Promise.all([
          api.get(`/forms/${claimId}/rental-agreement`),
          api.get(`/fleet/available`),
        ]);

        setAvailableCars(carsRes.data);

        if (agreeRes.data && Object.keys(agreeRes.data).length > 0) {
          const d = agreeRes.data;
          setFormData((prev) => ({
            ...prev,
            ...d,
            // Ensure compatibility between alternative field names
            permanent_address: d.permanent_address || d.hirer_address || "",
            hirer_address: d.hirer_address || d.permanent_address || "",
            hire_start_date: d.hire_start_date || d.hire_vehicle_date_out || "",
            hire_end_date: d.hire_end_date || d.hire_vehicle_date_in || "",
            fuel_out: d.fuel_out || d.hire_vehicle_fuel_out || "Full",
            fuel_in: d.fuel_in || d.hire_vehicle_fuel_in || "",
            miles_out: d.miles_out || parseInt(d.hire_vehicle_miles_out || "0") || 0,
            miles_in: d.miles_in || parseInt(d.hire_vehicle_miles_in || "0") || 0,
            daily_rate: d.daily_rate ? parseFloat(d.daily_rate) : (d.hire_vehicle_rate_per_day ? parseFloat(d.hire_vehicle_rate_per_day) : 65.0),
            excess_amount: d.excess_amount ? parseFloat(d.excess_amount) : (d.policy_excess ? parseFloat(d.policy_excess) : 500.0),
            change_vehicle_history: Array.isArray(d.change_vehicle_history) ? d.change_vehicle_history : [],
          }));

          if (d.additional_driver_name) setShowAdditionalDriver(true);
          if (d.insurance_company || d.own_insurance_confirm === "Yes") setShowOwnInsurance(true);
          if (Array.isArray(d.change_vehicle_history) && d.change_vehicle_history.length > 0) setShowChangeVehicle(true);
        }
      } catch (err) {
        console.error("Failed to load rental agreement:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [claimId]);

  // Recalculate financial breakdown whenever dates or rates change
  useEffect(() => {
    const startDate = formData.hire_start_date || formData.hire_vehicle_date_out;
    const endDate = formData.hire_end_date || formData.hire_vehicle_date_in;
    const daily = parseFloat(formData.daily_rate || formData.hire_vehicle_rate_per_day || 0);

    let days = 0;
    if (startDate && endDate) {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      if (!isNaN(s) && !isNaN(e) && e >= s) {
        days = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)));
      }
    }

    const cdw = parseFloat(formData.cdw_per_day || 0);
    const admin = parseFloat(formData.admin_fee || 0);
    const delivery = parseFloat(formData.delivery_charge || 0);
    const refuel = parseFloat(formData.refuelling_charge || formData.refuelling_total || 0);

    const hireSubtotal = (days * daily) + (days * cdw) + admin + delivery + refuel;
    const vatAmount = hireSubtotal * 0.20;
    const totalCost = hireSubtotal + vatAmount;

    setFormData((prev) => ({
      ...prev,
      total_days: days,
      subtotal: parseFloat(hireSubtotal.toFixed(2)),
      vat: parseFloat(vatAmount.toFixed(2)),
      total_cost: parseFloat(totalCost.toFixed(2)),
    }));
  }, [
    formData.hire_start_date,
    formData.hire_end_date,
    formData.daily_rate,
    formData.cdw_per_day,
    formData.admin_fee,
    formData.delivery_charge,
    formData.refuelling_charge,
  ]);

  // Fleet Car Selection
  const handleCarSelect = (reg: string) => {
    if (!reg) {
      setFormData((prev) => ({
        ...prev,
        hire_vehicle_reg: "",
        hire_vehicle_make: "",
        hire_vehicle_model: "",
        miles_out: 0,
      }));
      return;
    }
    const selected = availableCars.find((c) => c.reg_no === reg);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        hire_vehicle_reg: selected.reg_no,
        hire_vehicle_make: selected.make,
        hire_vehicle_model: selected.model,
        miles_out: selected.current_miles || 0,
        daily_rate: selected.daily_rate ? parseFloat(selected.daily_rate) : prev.daily_rate,
        hire_vehicle_rate_per_day: selected.daily_rate ? parseFloat(selected.daily_rate) : prev.daily_rate,
      }));
    } else {
      setFormData((prev) => ({ ...prev, hire_vehicle_reg: reg }));
    }
  };

  // Add Vehicle Swap
  const handleAddVehicleSwap = () => {
    setFormData((prev) => ({
      ...prev,
      change_vehicle_history: [
        ...(prev.change_vehicle_history || []),
        {
          vehicle_reg: "",
          vehicle_make: "",
          vehicle_model: "",
          vehicle_group: "Group C",
          date_out: "",
          date_in: "",
          fuel_out: "Full",
          fuel_in: "",
          miles_out: "",
          miles_in: "",
          rate_per_day: String(prev.daily_rate || 65),
        },
      ],
    }));
  };

  const handleRemoveVehicleSwap = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      change_vehicle_history: prev.change_vehicle_history.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleUpdateVehicleSwap = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const updated = [...(prev.change_vehicle_history || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, change_vehicle_history: updated };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      // Sync mirrored fields before saving
      const payload = {
        ...formData,
        permanent_address: formData.permanent_address || formData.hirer_address,
        hirer_address: formData.permanent_address || formData.hirer_address,
        hire_vehicle_date_out: formData.hire_start_date,
        hire_vehicle_date_in: formData.hire_end_date,
        hire_vehicle_fuel_out: formData.fuel_out,
        hire_vehicle_fuel_in: formData.fuel_in,
        hire_vehicle_miles_out: String(formData.miles_out || ""),
        hire_vehicle_miles_in: String(formData.miles_in || ""),
        hire_vehicle_rate_per_day: formData.daily_rate,
        policy_excess: formData.excess_amount,
      };

      await api.post(`/forms/${claimId}/rental-agreement`, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert("Failed to save rental agreement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#D71920] mb-2" />
        <span className="text-xs">Loading Hire Agreement...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Hire Agreement saved successfully and fleet availability synchronized!</span>
        </div>
      )}

      {/* 1. Hirer Identification & Driving Licence Details */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-4 h-4 text-[#D71920]" />
          <span>1. Hirer Identification & Driving Licence</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
            <select
              value={formData.title || "Mr"}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#D71920]"
            >
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Miss">Miss</option>
              <option value="Ms">Ms</option>
              <option value="Dr">Dr</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-700 mb-1">Hirer Full Name</label>
            <input
              type="text"
              value={formData.hirer_name || ""}
              onChange={(e) => setFormData({ ...formData, hirer_name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Telephone</label>
            <input
              type="text"
              value={formData.hirer_phone || ""}
              onChange={(e) => setFormData({ ...formData, hirer_phone: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. 07700 900123"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={formData.hirer_email || ""}
              onChange={(e) => setFormData({ ...formData, hirer_email: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. hirer@example.co.uk"
            />
          </div>

          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-gray-700 mb-1">Permanent Postal Address *</label>
            <input
              type="text"
              value={formData.permanent_address || formData.hirer_address || ""}
              onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value, hirer_address: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. 14 High Street, Birmingham, B1 1AA"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={formData.dob || ""}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Occupation</label>
            <input
              type="text"
              value={formData.occupation || ""}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. Taxi Driver"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Driving Licence No.</label>
            <input
              type="text"
              value={formData.licence_no || ""}
              onChange={(e) => setFormData({ ...formData, licence_no: e.target.value.toUpperCase() })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. DOE850123AB99"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Date Test Passed</label>
            <input
              type="date"
              value={formData.date_test_passed || ""}
              onChange={(e) => setFormData({ ...formData, date_test_passed: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Licence Date Issued</label>
            <input
              type="date"
              value={formData.date_issued || ""}
              onChange={(e) => setFormData({ ...formData, date_issued: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Licence Expiry Date</label>
            <input
              type="date"
              value={formData.expiry_date || ""}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>
        </div>
      </div>

      {/* 2. Hire Vehicle Assignment (Connected to Fleet) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <CarFront className="w-4 h-4 text-[#D71920]" />
            <span>2. Hire Vehicle Assignment (Live Fleet Integration)</span>
          </h3>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {availableCars.length} cars available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700">Select Fleet Vehicle</label>
              {formData.hire_vehicle_reg && (
                <button
                  type="button"
                  onClick={() => handleCarSelect("")}
                  className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline"
                >
                  ✕ Unassign Car
                </button>
              )}
            </div>
            <select
              value={formData.hire_vehicle_reg || ""}
              onChange={(e) => handleCarSelect(e.target.value)}
              className="w-full bg-yellow-50 border border-yellow-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D71920]"
            >
              <option value="">-- Choose Available Car --</option>
              {availableCars.map((car) => (
                <option key={car.id} value={car.reg_no}>
                  {car.reg_no} — {car.make} {car.model} (£{car.daily_rate}/d)
                </option>
              ))}
              {formData.hire_vehicle_reg &&
                !availableCars.some((c) => c.reg_no === formData.hire_vehicle_reg) && (
                  <option value={formData.hire_vehicle_reg}>
                    {formData.hire_vehicle_reg} (Currently Assigned)
                  </option>
                )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Make</label>
            <input
              type="text"
              value={formData.hire_vehicle_make || ""}
              onChange={(e) => setFormData({ ...formData, hire_vehicle_make: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. Mercedes-Benz"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Model</label>
            <input
              type="text"
              value={formData.hire_vehicle_model || ""}
              onChange={(e) => setFormData({ ...formData, hire_vehicle_model: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. C220d"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Group</label>
            <input
              type="text"
              value={formData.hire_vehicle_group || "Group C"}
              onChange={(e) => setFormData({ ...formData, hire_vehicle_group: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              placeholder="e.g. Group C / Taxi Spec"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Hire Start Date</label>
            <input
              type="date"
              value={formData.hire_start_date || ""}
              onChange={(e) => setFormData({ ...formData, hire_start_date: e.target.value, hire_vehicle_date_out: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Hire End Date</label>
            <input
              type="date"
              value={formData.hire_end_date || ""}
              onChange={(e) => setFormData({ ...formData, hire_end_date: e.target.value, hire_vehicle_date_in: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Daily Rate (£)</label>
            <input
              type="number"
              step="0.01"
              value={formData.daily_rate}
              onChange={(e) => setFormData({ ...formData, daily_rate: parseFloat(e.target.value) || 0, hire_vehicle_rate_per_day: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Policy Excess (£)</label>
            <input
              type="number"
              step="0.01"
              value={formData.excess_amount}
              onChange={(e) => setFormData({ ...formData, excess_amount: parseFloat(e.target.value) || 0, policy_excess: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Deposit (£)</label>
            <input
              type="number"
              step="0.01"
              value={formData.deposit}
              onChange={(e) => setFormData({ ...formData, deposit: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mileage Out</label>
            <input
              type="number"
              value={formData.miles_out || ""}
              onChange={(e) => setFormData({ ...formData, miles_out: parseInt(e.target.value) || 0 })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Mileage In</label>
            <input
              type="number"
              value={formData.miles_in || ""}
              onChange={(e) => setFormData({ ...formData, miles_in: parseInt(e.target.value) || 0 })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Fuel Out</label>
            <select
              value={formData.fuel_out || "Full"}
              onChange={(e) => setFormData({ ...formData, fuel_out: e.target.value, hire_vehicle_fuel_out: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            >
              <option value="Full">Full (8/8)</option>
              <option value="3/4">3/4</option>
              <option value="1/2">1/2</option>
              <option value="1/4">1/4</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Fuel In</label>
            <select
              value={formData.fuel_in || ""}
              onChange={(e) => setFormData({ ...formData, fuel_in: e.target.value, hire_vehicle_fuel_in: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            >
              <option value="">-- Pending Return --</option>
              <option value="Full">Full (8/8)</option>
              <option value="3/4">3/4</option>
              <option value="1/2">1/2</option>
              <option value="1/4">1/4</option>
              <option value="Empty">Empty (0/8)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Additional Driver Section (Collapsible) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <button
          type="button"
          onClick={() => setShowAdditionalDriver(!showAdditionalDriver)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#D71920]" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              3. Additional Driver (Optional)
            </h3>
            {formData.additional_driver_name && (
              <span className="text-[10px] bg-red-50 text-[#D71920] px-2 py-0.5 rounded font-bold">
                {formData.additional_driver_name}
              </span>
            )}
          </div>
          {showAdditionalDriver ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showAdditionalDriver && (
          <div className="pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Additional Driver Full Name</label>
              <input
                type="text"
                value={formData.additional_driver_name || ""}
                onChange={(e) => setFormData({ ...formData, additional_driver_name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Licence No.</label>
              <input
                type="text"
                value={formData.new_licence_no || ""}
                onChange={(e) => setFormData({ ...formData, new_licence_no: e.target.value.toUpperCase() })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-[#D71920]"
                placeholder="e.g. DOE890123AB99"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.new_dob || ""}
                onChange={(e) => setFormData({ ...formData, new_dob: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Occupation</label>
              <input
                type="text"
                value={formData.new_occupation || ""}
                onChange={(e) => setFormData({ ...formData, new_occupation: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                placeholder="e.g. Chauffeur"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Date Test Passed</label>
              <input
                type="date"
                value={formData.new_date_test_passed || ""}
                onChange={(e) => setFormData({ ...formData, new_date_test_passed: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Authorized by Insurer?</label>
              <select
                value={formData.additional_driver_auth || "No"}
                onChange={(e) => setFormData({ ...formData, additional_driver_auth: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. Hirer's Own Insurance (Collapsible) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <button
          type="button"
          onClick={() => setShowOwnInsurance(!showOwnInsurance)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D71920]" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              4. Hirer's Own Insurance (Optional)
            </h3>
            {formData.insurance_company && (
              <span className="text-[10px] bg-red-50 text-[#D71920] px-2 py-0.5 rounded font-bold">
                {formData.insurance_company}
              </span>
            )}
          </div>
          {showOwnInsurance ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showOwnInsurance && (
          <div className="pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Using Own Insurance?</label>
              <select
                value={formData.own_insurance_confirm || "No"}
                onChange={(e) => setFormData({ ...formData, own_insurance_confirm: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D71920]"
              >
                <option value="No">No (Company Fleet Insurance)</option>
                <option value="Yes">Yes (Hirer's Policy)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Insurance Company</label>
              <input
                type="text"
                value={formData.insurance_company || ""}
                onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                placeholder="e.g. Aviva / Admiral"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Policy Number</label>
              <input
                type="text"
                value={formData.policy_no || ""}
                onChange={(e) => setFormData({ ...formData, policy_no: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                placeholder="e.g. POL-992120-X"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Insurance Valid Date</label>
              <input
                type="date"
                value={formData.insurance_date || ""}
                onChange={(e) => setFormData({ ...formData, insurance_date: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Insurance Time</label>
              <input
                type="time"
                value={formData.insurance_time || ""}
                onChange={(e) => setFormData({ ...formData, insurance_time: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Cover Dates / Notes</label>
              <input
                type="text"
                value={formData.insurance_dates || ""}
                onChange={(e) => setFormData({ ...formData, insurance_dates: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                placeholder="e.g. Comprehensive valid for 30 days"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Insurance Proposal & Medical Convictions */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <HeartPulse className="w-4 h-4 text-[#D71920]" />
          <span>5. Insurance Proposal Questions & Medical Declaration</span>
        </h3>

        <div className="space-y-2 text-xs">
          {[
            { key: "motoring_offence_3yrs", label: "Have you had any motoring convictions, offences or endorsements in the last 3 years?" },
            { key: "disqualified_5yrs", label: "Have you been disqualified from driving in the last 5 years?" },
            { key: "accident_3yrs", label: "Have you been involved in any motor accidents, losses, or claims in the last 3 years?" },
            { key: "insurance_declined_5yrs", label: "Has any insurance company ever declined your proposal, cancelled, or imposed special terms?" },
            { key: "dishonesty_conviction", label: "Have you ever been convicted of any offence involving fraud, dishonesty, theft, or violence?" },
            { key: "medical_condition1", label: "Do you suffer from diabetes, epilepsy, heart condition, or defective vision/hearing?" },
            { key: "medical_condition2", label: "Do you suffer from any other physical or mental disability affecting driving ability?" },
          ].map((q) => (
            <div key={q.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <span className="font-semibold text-gray-800">{q.label}</span>
              <div className="inline-flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, [q.key]: "No" })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    formData[q.key] === "No" ? "bg-emerald-600 text-white shadow-xs" : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, [q.key]: "Yes" })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    formData[q.key] === "Yes" ? "bg-[#D71920] text-white shadow-xs" : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>
          ))}

          {(formData.medical_condition1 === "Yes" || formData.medical_condition2 === "Yes" || formData.motoring_offence_3yrs === "Yes") && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Details of Conditions / Convictions</label>
              <textarea
                rows={2}
                value={formData.medical_details || ""}
                onChange={(e) => setFormData({ ...formData, medical_details: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                placeholder="Specify details, DVLA notification status, or penalty points..."
              />
            </div>
          )}
        </div>
      </div>

      {/* 6. Vehicle Swaps / Change of Hire Vehicle History */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <button
          type="button"
          onClick={() => setShowChangeVehicle(!showChangeVehicle)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <CarFront className="w-4 h-4 text-[#D71920]" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              6. Change of Vehicle History (Vehicle Swaps)
            </h3>
            {formData.change_vehicle_history?.length > 0 && (
              <span className="text-[10px] bg-red-50 text-[#D71920] px-2 py-0.5 rounded font-bold">
                {formData.change_vehicle_history.length} vehicle swaps recorded
              </span>
            )}
          </div>
          {showChangeVehicle ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showChangeVehicle && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Record previous vehicle details if car was changed during hire</span>
              <button
                type="button"
                onClick={handleAddVehicleSwap}
                className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-[#D71920]" />
                <span>Add Vehicle Swap</span>
              </button>
            </div>

            {formData.change_vehicle_history?.map((swap: ChangeVehicleRecord, idx: number) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2 relative">
                <button
                  type="button"
                  onClick={() => handleRemoveVehicleSwap(idx)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 rounded"
                  title="Remove vehicle swap record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="font-bold text-xs text-gray-700">Vehicle {idx + 1} (Swapped Out)</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500">Registration</label>
                    <input
                      type="text"
                      value={swap.vehicle_reg || ""}
                      onChange={(e) => handleUpdateVehicleSwap(idx, "vehicle_reg", e.target.value.toUpperCase())}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500">Make & Model</label>
                    <input
                      type="text"
                      value={`${swap.vehicle_make || ""} ${swap.vehicle_model || ""}`}
                      onChange={(e) => handleUpdateVehicleSwap(idx, "vehicle_make", e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500">Date Out</label>
                    <input
                      type="date"
                      value={swap.date_out || ""}
                      onChange={(e) => handleUpdateVehicleSwap(idx, "date_out", e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500">Date In</label>
                    <input
                      type="date"
                      value={swap.date_in || ""}
                      onChange={(e) => handleUpdateVehicleSwap(idx, "date_in", e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-900"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Charges Breakdown & Financial Summary */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-[#D71920]" />
          <span>7. Charges Breakdown & Invoice Summary</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Total Days Hired</label>
            <input
              type="number"
              readOnly
              value={formData.total_days}
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">CDW Per Day (£)</label>
            <input
              type="number"
              step="0.01"
              value={formData.cdw_per_day}
              onChange={(e) => setFormData({ ...formData, cdw_per_day: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Admin Fee (£)</label>
            <input
              type="number"
              step="0.01"
              value={formData.admin_fee}
              onChange={(e) => setFormData({ ...formData, admin_fee: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Charge (£)</label>
            <input
              type="number"
              step="0.01"
              value={formData.delivery_charge}
              onChange={(e) => setFormData({ ...formData, delivery_charge: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Refuelling Total (£)</label>
            <input
              type="number"
              step="0.01"
              value={formData.refuelling_charge}
              onChange={(e) => setFormData({ ...formData, refuelling_charge: parseFloat(e.target.value) || 0, refuelling_total: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Subtotal (£)</label>
            <input
              type="number"
              step="0.01"
              readOnly
              value={formData.subtotal}
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">VAT 20% (£)</label>
            <input
              type="number"
              step="0.01"
              readOnly
              value={formData.vat}
              className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#D71920] mb-1">Total Cost (£)</label>
            <input
              type="number"
              step="0.01"
              readOnly
              value={formData.total_cost}
              className="w-full bg-red-50 border border-red-300 rounded-xl px-3 py-2 text-xs font-black text-[#D71920] cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 8. Required Agreement Signatures (5 Sections) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <PenTool className="w-4 h-4 text-[#D71920]" />
          <span>8. Required Agreement Signatures (5 Sections)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: "hirer_signature_terms", label: "Hirer Agreement Terms" },
            { key: "company_signature", label: "Company Staff Signature" },
            { key: "hirer_signature_insurance", label: "Hirer's Own Insurance" },
            { key: "declaration_signature", label: "Declaration Signature" },
            { key: "liability_signature", label: "Statement of Liability" },
          ].map((sig) => {
            const hasSig = !!formData[sig.key];
            return (
              <div key={sig.key} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">{sig.label}</span>
                  {hasSig && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Signed
                    </span>
                  )}
                </div>

                <div className="h-20 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                  {hasSig ? (
                    <img
                      src={formData[sig.key]}
                      alt="Signature"
                      className="max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">No signature recorded</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSigField(sig.key)}
                    className="flex-1 text-center py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PenTool className="w-3 h-3 text-[#D71920]" />
                    <span>{hasSig ? "Update Signature" : "Sign Now"}</span>
                  </button>
                  {hasSig && (
                    <button
                      type="button"
                      onClick={async () => {
                        setFormData((prev) => ({ ...prev, [sig.key]: "" }));
                        try {
                          await api.post(`/forms/${claimId}/rental-agreement`, { [sig.key]: null });
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
            );
          })}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-3 sticky bottom-4 z-20">
        <button
          type="button"
          onClick={() => generateRentalAgreementPDF(claimId, formData)}
          className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all duration-150 active:scale-95"
          title="Export formatted Hire Agreement PDF"
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
              <span>Save Hire Agreement</span>
            </>
          )}
        </button>
      </div>

      {/* Signature Modal */}
      {activeSigField && (
        <SignatureModal
          isOpen={true}
          title={`Sign: ${activeSigField.replace(/_/g, " ").toUpperCase()}`}
          initialSignature={(formData as any)[activeSigField]}
          onClose={() => setActiveSigField(null)}
          onSave={async (dataUrl) => {
            const field = activeSigField;
            setFormData((prev) => ({ ...prev, [field]: dataUrl }));
            setActiveSigField(null);
            try {
              await api.post(`/forms/${claimId}/rental-agreement`, {
                [field]: dataUrl || null,
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
