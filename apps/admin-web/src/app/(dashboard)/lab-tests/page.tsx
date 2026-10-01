"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { formatCurrency, formatDateIST } from "../../../lib/utils";
import {
  FlaskConical,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  User,
  ExternalLink,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

export default function LabTestsPage() {
  const [activeTab, setActiveTab] = useState<"packages" | "bookings">("bookings");
  const [labTests, setLabTests] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Lab Test Form
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Full Body Checkup");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [sampleType, setSampleType] = useState("Blood");
  const [fastingRequired, setFastingRequired] = useState(false);
  const [reportTimeHours, setReportTimeHours] = useState("24");
  const [description, setDescription] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [testsRes, bookingsRes] = await Promise.all([
        apiRequest("/lab-tests"),
        apiRequest("/lab-tests/bookings/list"),
      ]);
      setLabTests(testsRes.data || []);
      setBookings(bookingsRes.data || []);
    } catch (err: any) {
      toast.error("Failed to load lab diagnostic data", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/lab-tests", {
        method: "POST",
        body: JSON.stringify({
          name,
          category,
          price: Number(price),
          mrp: Number(mrp) || Number(price),
          sampleType,
          fastingRequired,
          reportTimeHours: Number(reportTimeHours) || 24,
          description,
        }),
      });
      toast.success("Diagnostic package created successfully");
      setShowAddModal(false);
      setName("");
      setPrice("");
      setMrp("");
      setDescription("");
      loadData();
    } catch (err: any) {
      toast.error("Failed to create package", { description: err.message });
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      await apiRequest(`/lab-tests/bookings/${bookingId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      toast.success(`Booking marked as ${status}`);
      loadData();
    } catch (err: any) {
      toast.error("Failed to update booking status", { description: err.message });
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this lab test?")) return;
    try {
      await apiRequest(`/lab-tests/${testId}`, { method: "DELETE" });
      toast.success("Lab test removed");
      loadData();
    } catch (err: any) {
      toast.error("Failed to delete lab test", { description: err.message });
    }
  };

  return (
    <div className="flex-1 pb-16">
      <Topbar
        breadcrumb="Services"
        title="Diagnostic Labs & Bookings"
        primaryAction={{
          label: "Add Diagnostic Package +",
          onClick: () => setShowAddModal(true),
        }}
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[#D7DEDB] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "bookings"
                ? "bg-[#0B4A3A] text-white shadow-xs"
                : "bg-white text-[#5B6B65] hover:bg-[#F4F6F5] border border-[#D7DEDB]"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Customer Lab Bookings ({bookings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("packages")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "packages"
                ? "bg-[#0B4A3A] text-white shadow-xs"
                : "bg-white text-[#5B6B65] hover:bg-[#F4F6F5] border border-[#D7DEDB]"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Diagnostic Packages ({labTests.length})</span>
          </button>
        </div>

        {/* TAB 1: LAB BOOKINGS */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-2xl border border-[#D7DEDB] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#D7DEDB] bg-[#FAF3EA]/40 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-[#0F2A22]">Diagnostic Sample Collection Queue</h3>
                <p className="text-xs text-[#5B6B65]">Home sample collections & laboratory report processing</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-white border border-[#D7DEDB] rounded-full text-[#0B4A3A]">
                Total: {bookings.length} Bookings
              </span>
            </div>

            <div className="divide-y divide-[#D7DEDB]">
              {bookings.length === 0 ? (
                <div className="p-12 text-center text-[#5B6B65] text-xs font-semibold">
                  No active diagnostic bookings found.
                </div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F4F6F5]/50 transition">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-black text-[#0B4A3A] px-2 py-0.5 rounded-md bg-[#FAF3EA] border border-[#D7DEDB]">
                          {b.bookingNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            b.status === "COMPLETED"
                              ? "bg-[#DCFCE7] text-[#16A34A]"
                              : b.status === "SAMPLE_COLLECTED"
                              ? "bg-[#FEF9C3] text-[#B45309]"
                              : b.status === "CANCELLED"
                              ? "bg-[#FEE2E2] text-[#DC2626]"
                              : "bg-[#DBEAFE] text-[#1D4ED8]"
                          }`}
                        >
                          {b.status.replace("_", " ")}
                        </span>
                        <span className="text-xs font-bold text-[#16A34A]">{b.paymentStatus}</span>
                      </div>

                      <h4 className="text-sm font-extrabold text-[#0F2A22]">
                        {b.labTest?.name || "Diagnostic Test"}
                      </h4>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#5B6B65]">
                        <span className="flex items-center gap-1 font-semibold text-[#0F2A22]">
                          <User className="w-3.5 h-3.5 text-[#0B4A3A]" />
                          {b.patientName} ({b.patientAge}y, {b.patientGender})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Collection: {new Date(b.sampleCollectionDate).toLocaleDateString("en-IN")} ({b.timeSlot})
                        </span>
                        <span>•</span>
                        <span className="font-bold text-[#0B4A3A]">{formatCurrency(b.totalAmount)}</span>
                      </div>

                      {b.address && (
                        <p className="text-[11px] text-[#5B6B65] italic">
                          Collection Address: {b.address.addressLine1}, {b.address.city} - {b.address.pincode}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {b.status === "SCHEDULED" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(b.id, "SAMPLE_COLLECTED")}
                          className="px-3 py-1.5 bg-[#FAF3EA] border border-[#D7DEDB] hover:bg-[#F5C043]/30 text-[#0B4A3A] text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Mark Sample Collected
                        </button>
                      )}
                      {b.status === "SAMPLE_COLLECTED" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(b.id, "COMPLETED")}
                          className="px-3 py-1.5 bg-[#0B4A3A] hover:bg-[#07362a] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Mark Completed
                        </button>
                      )}
                      {b.reportUrl && (
                        <a
                          href={b.reportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-[#F4F6F5] border border-[#D7DEDB] hover:bg-white text-[#0F2A22] text-xs font-bold rounded-xl transition flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#10B981]" />
                          <span>View Report</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LAB PACKAGES */}
        {activeTab === "packages" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labTests.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-[#D7DEDB] p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#10B981] transition">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0B4A3A] bg-[#FAF3EA] px-2.5 py-1 rounded-full border border-[#D7DEDB]">
                      {t.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTest(t.id)}
                      className="p-1.5 text-gray-400 hover:text-[#DC2626] transition cursor-pointer rounded-lg hover:bg-[#FEF2F2]"
                      title="Delete Test"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-extrabold text-base text-[#0F2A22]">{t.name}</h3>
                  <p className="text-xs text-[#5B6B65] line-clamp-2">{t.description}</p>

                  <div className="flex items-center gap-4 text-xs font-semibold text-[#5B6B65] pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#10B981]" />
                      {t.reportTimeHours}h Report
                    </span>
                    <span>•</span>
                    <span>Sample: {t.sampleType}</span>
                  </div>

                  {t.fastingRequired && (
                    <span className="inline-block text-[10px] font-bold text-[#B45309] bg-[#FEF9C3] px-2 py-0.5 rounded-md">
                      ⚠️ 10-12 hrs Fasting Required
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-[#D7DEDB] flex items-center justify-between">
                  <div>
                    <span className="text-base font-black text-[#0B4A3A]">{formatCurrency(t.price)}</span>
                    {t.mrp > t.price && (
                      <span className="text-xs text-[#5B6B65] line-through ml-2">
                        {formatCurrency(t.mrp)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-[#5B6B65]">
                    {t._count?.bookings || 0} Bookings
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE PACKAGE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#D7DEDB] pb-3">
              <h3 className="font-black text-base text-[#0F2A22]">Add Diagnostic Health Package</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1">Package Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Comprehensive Liver Function Test (LFT)"
                  className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  >
                    <option value="Full Body Checkup">Full Body Checkup</option>
                    <option value="Diabetes">Diabetes</option>
                    <option value="Thyroid">Thyroid</option>
                    <option value="Heart Health">Heart Health</option>
                    <option value="Kidney & Liver">Kidney & Liver</option>
                    <option value="Fever & Infection">Fever & Infection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Sample Type</label>
                  <input
                    type="text"
                    required
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                    placeholder="e.g. Blood, Urine"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="499"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    placeholder="899"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Turnaround (Hrs)</label>
                  <input
                    type="number"
                    value={reportTimeHours}
                    onChange={(e) => setReportTimeHours(e.target.value)}
                    placeholder="24"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1">Clinical Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Includes Bilirubin, SGOT, SGPT, Alkaline Phosphatase tests..."
                  className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fastingCheck"
                  checked={fastingRequired}
                  onChange={(e) => setFastingRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0B4A3A]"
                />
                <label htmlFor="fastingCheck" className="text-xs font-bold text-[#0F2A22] cursor-pointer">
                  Fasting required before test sample collection
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#D7DEDB] rounded-xl text-xs font-bold text-[#5B6B65] hover:bg-[#F4F6F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B4A3A] hover:bg-[#07362a] text-white rounded-xl text-xs font-bold"
                >
                  Save Diagnostic Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
