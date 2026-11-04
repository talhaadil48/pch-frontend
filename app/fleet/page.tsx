"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  CarFront,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  Fuel,
  Gauge,
  Calendar,
  AlertCircle,
  X,
  Loader2,
  Trash2,
  ExternalLink,
  Layers,
} from "lucide-react";
import api from "@/lib/api";

interface Vehicle {
  id: number;
  reg_no: string;
  make: string;
  model: string;
  fuel_type: string;
  current_miles: number;
  mot_date?: string;
  road_tax?: string;
  daily_rate: number;
  status: "Available" | "On Hire" | "Maintenance";
  current_claim_id?: string;
}

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [regNo, setRegNo] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [fuelType, setFuelType] = useState("Diesel");
  const [miles, setMiles] = useState("");
  const [motDate, setMotDate] = useState("");
  const [roadTax, setRoadTax] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchFleet = async () => {
    setLoading(true);
    try {
      const res = await api.get("/fleet", {
        params: { status: statusFilter === "all" ? undefined : statusFilter },
      });
      setVehicles(res.data);
    } catch (err) {
      console.error("Failed to load fleet:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, [statusFilter]);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);

    try {
      await api.post("/fleet", {
        reg_no: regNo.toUpperCase().trim(),
        make: make.trim(),
        model: model.trim(),
        fuel_type: fuelType,
        current_miles: miles ? parseInt(miles) : 0,
        mot_date: motDate || undefined,
        road_tax: roadTax || undefined,
        daily_rate: dailyRate ? parseFloat(dailyRate) : 0,
        status: "Available",
      });

      setShowModal(false);
      setRegNo("");
      setMake("");
      setModel("");
      setMiles("");
      setMotDate("");
      setRoadTax("");
      setDailyRate("");
      fetchFleet();
    } catch (err: any) {
      setModalError(err?.response?.data?.detail || "Failed to add vehicle");
    } finally {
      setModalLoading(false);
    }
  };

  // Immediate availability status switcher (Only Available <-> Maintenance allowed manually)
  const handleStatusChange = async (carId: number, newStatus: string) => {
    try {
      await api.put(`/fleet/${carId}/status`, {
        status: newStatus,
      });
      setVehicles((prev) =>
        prev.map((v) => (v.id === carId ? { ...v, status: newStatus as any } : v))
      );
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to update vehicle status");
    }
  };

  const handleDeleteVehicle = async (carId: number, reg: string) => {
    if (!confirm(`Are you sure you want to remove vehicle ${reg} from fleet?`)) return;
    try {
      await api.delete(`/fleet/${carId}`);
      setVehicles((prev) => prev.filter((v) => v.id !== carId));
    } catch {
      alert("Failed to delete vehicle");
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.reg_no.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q)
    );
  });

  const availableCount = vehicles.filter((v) => v.status === "Available").length;
  const onHireCount = vehicles.filter((v) => v.status === "On Hire").length;

  return (
    <main className="flex-1 flex flex-col min-w-0">
      <Header
        title="Fleet Management"
        subtitle="Vehicle inventory, MOT/Tax tracking & live availability"
        onNewClaim={() => setShowModal(true)}
        showNewClaimButton={false}
      />

        <div className="p-6 max-w-7xl w-full mx-auto space-y-4">
          {/* Quick Metrics & Controls Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filters */}
              <div className="inline-flex bg-white p-1 rounded-xl border border-[#E5E7EB] shadow-xs">
                {[
                  { id: "all", label: "All Vehicles", count: vehicles.length },
                  { id: "Available", label: "Available", count: availableCount },
                  { id: "On Hire", label: "On Hire", count: onHireCount },
                  { id: "Maintenance", label: "Maintenance", count: vehicles.filter((v) => v.status === "Maintenance").length },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStatusFilter(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      statusFilter === s.id
                        ? "bg-[#D71920] text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <span>{s.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        statusFilter === s.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {s.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full lg:w-72">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by reg, make, model..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#D71920] shadow-xs"
                />
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 bg-[#D71920] hover:bg-[#B5141A] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Vehicle</span>
              </button>
            </div>
          </div>

          {/* Fleet Table Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-7 h-7 animate-spin text-[#D71920] mb-2" />
                <span className="text-xs font-medium">Loading fleet inventory...</span>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <CarFront className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-gray-800">No vehicles found</h3>
                <p className="text-xs text-gray-400 mt-0.5">Add vehicles to track availability.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-gray-50 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Registration</th>
                      <th className="py-2.5 px-4">Make & Model</th>
                      <th className="py-2.5 px-4">Fuel & Mileage</th>
                      <th className="py-2.5 px-4">MOT & Tax</th>
                      <th className="py-2.5 px-4">Daily Rate</th>
                      <th className="py-2.5 px-4">Live Status</th>
                      <th className="py-2.5 px-4">Linked Claim</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium">
                    {filteredVehicles.map((car) => (
                      <tr key={car.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* High Contrast, Ultra-Legible UK Number Plate */}
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5 bg-[#FFD500] text-black font-black text-xs px-3 py-1 rounded border border-black/80 uk-plate shadow-xs tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-black/30"></span>
                            <span>{car.reg_no}</span>
                          </div>
                        </td>

                        {/* Make & Model */}
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-[#151515] leading-snug">{car.make}</div>
                          <div className="text-[11px] text-gray-500">{car.model}</div>
                        </td>

                        {/* Fuel & Miles */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
                            <Gauge className="w-3.5 h-3.5 text-gray-400" />
                            <span>{car.current_miles?.toLocaleString() || 0} mi</span>
                          </div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <Fuel className="w-3 h-3" />
                            <span>{car.fuel_type}</span>
                          </div>
                        </td>

                        {/* MOT & Tax */}
                        <td className="py-3 px-4">
                          <div className="text-gray-800 text-xs">
                            MOT: <strong className="text-gray-900">{car.mot_date || "—"}</strong>
                          </div>
                          <div className="text-[10px] text-gray-400">
                            Tax: {car.road_tax || "—"}
                          </div>
                        </td>

                        {/* Daily Rate */}
                        <td className="py-3 px-4 font-black text-gray-900">
                          £{parseFloat(String(car.daily_rate || 0)).toFixed(2)}
                          <span className="text-[10px] font-normal text-gray-400">/day</span>
                        </td>

                        {/* Status (Automated On Hire, Manual Available <-> Maintenance) */}
                        <td className="py-3 px-4">
                          {car.status === "On Hire" ? (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-bold">
                                <Clock className="w-3.5 h-3.5 text-red-600" />
                                <span>On Hire</span>
                              </span>
                              <span className="text-[10px] text-gray-400 italic">Automated via Claim</span>
                            </div>
                          ) : car.status === "Available" ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Available</span>
                              </span>
                              <button
                                onClick={() => handleStatusChange(car.id, "Maintenance")}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-bold transition-colors"
                                title="Send vehicle for maintenance"
                              >
                                <Wrench className="w-3 h-3 text-amber-600" />
                                <span>Maintenance</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold">
                                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                                <span>Maintenance</span>
                              </span>
                              <button
                                onClick={() => handleStatusChange(car.id, "Available")}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold transition-colors"
                                title="Mark maintenance complete and set Available"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Set Available</span>
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Linked Claim */}
                        <td className="py-3 px-4">
                          {car.status === "On Hire" && car.current_claim_id ? (
                            <Link
                              href={`/claims/${car.current_claim_id}`}
                              className="inline-flex items-center gap-1 bg-[#151515] text-white hover:bg-[#D71920] px-2.5 py-1 rounded-md text-xs font-bold transition-colors shadow-2xs"
                              title="Go to linked claim in forms"
                            >
                              <span>Claim {car.current_claim_id}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-gray-400 text-[11px] italic">—</span>
                          )}
                        </td>

                        {/* Delete Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteVehicle(car.id, car.reg_no)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove vehicle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E5E7EB] shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h2 className="text-xl font-bold text-[#151515]">Add Fleet Vehicle</h2>
              <p className="text-xs text-gray-500 mt-1">Register vehicle into inventory.</p>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVehicle} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BD68 XYZ"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                  className="w-full bg-yellow-50 border border-yellow-300 rounded-xl px-3 py-2 text-xs font-black text-gray-900 uppercase focus:outline-none focus:border-[#D71920]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Make *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mercedes-Benz"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. C220d"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Fuel Type</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D71920]"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Mileage</label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={miles}
                    onChange={(e) => setMiles(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">MOT Expiry</label>
                  <input
                    type="date"
                    value={motDate}
                    onChange={(e) => setMotDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Road Tax</label>
                  <input
                    type="date"
                    value={roadTax}
                    onChange={(e) => setRoadTax(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">
                  Daily Hire Rate (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 65.00"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#D71920]"
                />
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
                  className="bg-[#D71920] hover:bg-[#B5141A] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {modalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
