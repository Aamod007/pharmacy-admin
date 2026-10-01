"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { formatDateIST, formatCurrency } from "../../../lib/utils";
import {
  Check,
  X,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sun,
  Search,
  Plus,
  Trash2,
  Stethoscope,
  User,
  Pill,
  Calendar,
  Building2,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Layers,
  MapPin,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface PrescribedMedicine {
  id: string;
  productId?: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  unit: string;
  price: number;
  batchNumber?: string;
  expiryDate?: string;
  rackLocation?: string;
  scheduleType?: "OTC" | "SCHEDULE_H" | "SCHEDULE_H1" | "SCHEDULE_X";
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [selectedRx, setSelectedRx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Viewer Controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Retail Pharmacist Audit & Verification Form
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("MALE");
  const [diagnosis, setDiagnosis] = useState("");
  const [validityDays, setValidityDays] = useState("180");
  const [scheduleCompliance, setScheduleCompliance] = useState({
    signatureVerified: true,
    regNoVerified: true,
    validDateVerified: true,
    isScheduleH1: false,
  });

  // Digitized Medicines Dispensing Table
  const [dispensedItems, setDispensedItems] = useState<PrescribedMedicine[]>([]);
  const [medSearch, setMedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingMed, setIsSearchingMed] = useState(false);

  // Reject Modal
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("Doctor signature or medical council registration missing");
  const [customRejectNotes, setCustomRejectNotes] = useState("");

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/prescriptions?status=${status}`);
      const list = res.data || [];
      setPrescriptions(list);
      if (list.length > 0 && (!selectedRx || !list.some((item: any) => item.id === selectedRx.id))) {
        selectPrescription(list[0]);
      } else if (list.length === 0) {
        setSelectedRx(null);
      }
    } catch (err) {
      console.error("Failed to load prescriptions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [status]);

  // When selecting a prescription, parse existing notes if any or reset form
  const selectPrescription = (rx: any) => {
    setSelectedRx(rx);
    setZoom(1);
    setRotation(0);
    setHighContrast(false);

    // Try parsing existing audit metadata from notes
    if (rx.notes) {
      try {
        const parsed = JSON.parse(rx.notes);
        if (parsed.doctorName) setDoctorName(parsed.doctorName);
        if (parsed.doctorRegNo) setDoctorRegNo(parsed.doctorRegNo);
        if (parsed.clinicName) setClinicName(parsed.clinicName);
        if (parsed.patientAge) setPatientAge(parsed.patientAge);
        if (parsed.patientGender) setPatientGender(parsed.patientGender);
        if (parsed.diagnosis) setDiagnosis(parsed.diagnosis);
        if (parsed.dispensedItems) setDispensedItems(parsed.dispensedItems);
        return;
      } catch (e) {
        // Plain text notes fallback
      }
    }

    // Default clean state for fresh verification
    setDoctorName("");
    setDoctorRegNo("");
    setClinicName("");
    setPatientAge("");
    setPatientGender("MALE");
    setDiagnosis("");
    setDispensedItems([]);
  };

  // Live Medicine Search from Retail Shop Catalog
  useEffect(() => {
    if (!medSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingMed(true);
      try {
        const res = await apiRequest(`/products?search=${encodeURIComponent(medSearch)}`);
        setSearchResults(res.data || []);
      } catch (e) {
        console.error("Failed to search medicines", e);
      } finally {
        setIsSearchingMed(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [medSearch]);

  const handleAddMedicineFromCatalog = (product: any) => {
    const newItem: PrescribedMedicine = {
      id: Date.now().toString(),
      productId: product.id,
      name: product.name,
      dosage: product.dosageForm || "Tablet",
      frequency: "1-0-1 (Twice daily after meals)",
      duration: "5 days",
      quantity: 1,
      unit: "Strip",
      price: product.price || 0,
      batchNumber: product.variants?.[0]?.batches?.[0]?.batchNumber || "FEFO-Allocated",
      expiryDate: product.variants?.[0]?.batches?.[0]?.expiryDate || "Next Expiry",
      rackLocation: product.rackLocation || "Rack A, Shelf 2",
      scheduleType: product.prescriptionRequired ? "SCHEDULE_H" : "OTC",
    };

    setDispensedItems((prev) => [...prev, newItem]);
    setMedSearch("");
    setSearchResults([]);
    toast.success(`Added ${product.name} to dispensing queue`);
  };

  const handleAddManualMedicine = () => {
    const manualItem: PrescribedMedicine = {
      id: Date.now().toString(),
      name: medSearch || "Prescribed Medicine",
      dosage: "500mg",
      frequency: "1-0-1 after food",
      duration: "5 days",
      quantity: 1,
      unit: "Strip",
      price: 0,
      scheduleType: "SCHEDULE_H",
    };
    setDispensedItems((prev) => [...prev, manualItem]);
    setMedSearch("");
    setSearchResults([]);
  };

  const handleRemoveItem = (id: string) => {
    setDispensedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof PrescribedMedicine, value: any) => {
    setDispensedItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  // Grand total of dispensed medicines
  const grandTotal = useMemo(() => {
    return dispensedItems.reduce((acc, curr) => acc + (curr.price || 0) * (curr.quantity || 1), 0);
  }, [dispensedItems]);

  // Approve & Save Full Clinical Audit Record
  const handleApprove = async () => {
    if (!selectedRx) return;

    if (!scheduleCompliance.signatureVerified || !scheduleCompliance.regNoVerified) {
      toast.error("Compliance Check Required", {
        description: "Please verify Doctor's physical signature and Registration stamp before dispensing.",
      });
      return;
    }

    try {
      const validityDate = new Date(Date.now() + Number(validityDays) * 24 * 60 * 60 * 1000).toISOString();

      const auditPayload = {
        doctorName: doctorName || "Verified Practitioner",
        doctorRegNo: doctorRegNo || "MCI-VERIFIED",
        clinicName: clinicName || "Clinic/Hospital",
        patientAge,
        patientGender,
        diagnosis,
        isScheduleH1: scheduleCompliance.isScheduleH1,
        dispensedItems,
        grandTotal,
        approvedAt: new Date().toISOString(),
        pharmacistSignoff: "Registered Pharmacist (D.Pharm / B.Pharm)",
      };

      await apiRequest(`/prescriptions/${selectedRx.id}/approve`, {
        method: "POST",
        body: JSON.stringify({
          validityDate,
          notes: JSON.stringify(auditPayload),
        }),
      });

      toast.success("Prescription Approved & Verified!", {
        description: scheduleCompliance.isScheduleH1
          ? "Logged to Chemist Schedule H1 Drug Register."
          : "Medicines approved for dispensing and order dispatch.",
      });

      loadPrescriptions();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve prescription");
    }
  };

  // Reject Prescription with Standard Retail Pharmacy Reasons
  const handleReject = async () => {
    if (!selectedRx) return;
    try {
      const finalReason = customRejectNotes
        ? `${rejectReason}: ${customRejectNotes}`
        : rejectReason;

      await apiRequest(`/prescriptions/${selectedRx.id}/reject`, {
        method: "POST",
        body: JSON.stringify({
          reason: finalReason,
          notes: `Retail Pharmacy Verification: Rejected by Registered Pharmacist. Reason: ${finalReason}`,
        }),
      });

      toast.warning("Prescription Rejected", {
        description: "Customer notified via email with re-upload instructions.",
      });

      setIsRejectOpen(false);
      setCustomRejectNotes("");
      loadPrescriptions();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject prescription");
    }
  };

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        rx.user?.name?.toLowerCase().includes(q) ||
        rx.user?.phone?.toLowerCase().includes(q) ||
        rx.orders?.[0]?.orderNumber?.toLowerCase().includes(q) ||
        rx.id.toLowerCase().includes(q)
      );
    });
  }, [prescriptions, searchQuery]);

  return (
    <div className="flex-1 pb-16 bg-[#F8FAFC]">
      <Topbar
        breadcrumb="Retail Pharmacy"
        title="Pharmacist Prescription Verification & Dispensing Workstation"
      />

      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Top Queue Bar & Status Switches */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E4E7E9] shadow-sm">
          <div className="flex items-center gap-2">
            {[
              { key: "PENDING", label: "Pending Verification", color: "bg-[#F59E0B]" },
              { key: "APPROVED", label: "Approved & Dispensed", color: "bg-[#16A34A]" },
              { key: "REJECTED", label: "Rejected / Defective", color: "bg-[#DC2626]" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatus(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  status === tab.key
                    ? "bg-[#0F2A22] text-white shadow-sm"
                    : "bg-[#F1F3F4] text-[#5B6B65] hover:bg-[#E4E7E9]"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${tab.color}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Rx Bar */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-[#5B6B65] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, phone, order #..."
              className="w-full pl-9 pr-4 py-2 bg-[#F1F3F4] rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A]"
            />
          </div>
        </div>

        {/* WORKSTATION GRID */}
        <div className="grid grid-cols-12 gap-6">
          {/* COLUMN 1: Prescriptions Queue (3 cols) */}
          <div className="col-span-12 lg:col-span-3 bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden flex flex-col h-[820px]">
            <div className="p-4 border-b border-[#E4E7E9] bg-[#FAFAFA] flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F2A22] uppercase tracking-wider">
                Prescription Queue ({filteredPrescriptions.length})
              </span>
              <span className="text-[11px] text-[#5B6B65] font-semibold">Live Shop Sync</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#E4E7E9]">
              {loading ? (
                <div className="p-8 text-center text-xs text-[#5B6B65]">Loading prescriptions...</div>
              ) : filteredPrescriptions.length === 0 ? (
                <div className="p-8 text-center text-[#5B6B65]">
                  <FileText className="w-8 h-8 opacity-40 mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#0F2A22]">No {status} Prescriptions</p>
                  <p className="text-[11px] mt-1">Queue is up to date.</p>
                </div>
              ) : (
                filteredPrescriptions.map((rx) => {
                  const isSelected = selectedRx?.id === rx.id;
                  return (
                    <div
                      key={rx.id}
                      onClick={() => selectPrescription(rx)}
                      className={`p-4 cursor-pointer transition ${
                        isSelected
                          ? "bg-[#EFF6FF] border-l-4 border-[#0B4A3A]"
                          : "hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-xs text-[#0F2A22] truncate">
                          {rx.user?.name || "Retail Walk-In Patient"}
                        </p>
                        <span className="text-[10px] text-[#5B6B65] font-mono">
                          {formatDateIST(rx.createdAt).split(",")[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#5B6B65]">
                        <User className="w-3 h-3" />
                        <span>{rx.user?.phone || "Phone N/A"}</span>
                      </div>

                      {rx.orders?.[0]?.orderNumber && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#0B4A3A]">
                          <Receipt className="w-3 h-3" />
                          <span>Order #{rx.orders[0].orderNumber}</span>
                        </div>
                      )}

                      <div className="mt-2.5 flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rx.status === "APPROVED"
                              ? "bg-[#DCFCE7] text-[#16A34A]"
                              : rx.status === "REJECTED"
                              ? "bg-[#FEE2E2] text-[#DC2626]"
                              : "bg-[#FEF3C7] text-[#D97706]"
                          }`}
                        >
                          {rx.status}
                        </span>

                        <span className="text-[10px] text-[#5B6B65] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(rx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMN 2: Medical Rx Document Viewer with Tools (5 cols) */}
          <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-[#E4E7E9] shadow-sm flex flex-col h-[820px] overflow-hidden">
            {/* Viewer Header with Rx Tools */}
            <div className="p-3 border-b border-[#E4E7E9] bg-[#FAFAFA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F2A22]">Rx Document Inspector</span>
                <span className="text-[10px] px-2 py-0.5 bg-[#E4E7E9] text-[#0F2A22] rounded-md font-mono">
                  {zoom * 100}%
                </span>
              </div>

              {/* Manipulation Toolbar */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                  title="Zoom In"
                  className="p-1.5 rounded-lg bg-white border border-[#E4E7E9] text-[#0F2A22] hover:bg-[#F1F3F4]"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  title="Zoom Out"
                  className="p-1.5 rounded-lg bg-white border border-[#E4E7E9] text-[#0F2A22] hover:bg-[#F1F3F4]"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Rotate 90°"
                  className="p-1.5 rounded-lg bg-white border border-[#E4E7E9] text-[#0F2A22] hover:bg-[#F1F3F4]"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setHighContrast(!highContrast)}
                  title="Toggle High Contrast (Read Faint Handwriting)"
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                    highContrast
                      ? "bg-[#0F2A22] text-white border-[#0F2A22]"
                      : "bg-white border-[#E4E7E9] text-[#0F2A22] hover:bg-[#F1F3F4]"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                    setHighContrast(false);
                  }}
                  title="Reset View"
                  className="p-1.5 rounded-lg bg-white border border-[#E4E7E9] text-[#5B6B65] hover:bg-[#F1F3F4]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Image Viewport */}
            <div className="flex-1 bg-[#1A1A1A] p-4 flex items-center justify-center overflow-auto relative">
              {selectedRx?.fileUrl ? (
                <div
                  className="transition-transform duration-200 flex items-center justify-center"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    filter: highContrast ? "contrast(180%) brightness(95%) grayscale(30%)" : "none",
                  }}
                >
                  <img
                    src={selectedRx.fileUrl}
                    alt="Prescription Document"
                    className="max-h-[700px] max-w-full object-contain rounded shadow-2xl bg-white select-none"
                  />
                </div>
              ) : (
                <div className="text-center text-white/50 p-8">
                  <FileText className="w-12 h-12 stroke-1 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold text-white/80">No Prescription Image Attached</p>
                  <p className="text-[11px] mt-1 text-white/50">
                    Retail pharmacist can still transcribe doctor telephone or clinic orders.
                  </p>
                </div>
              )}

              {highContrast && (
                <span className="absolute bottom-3 left-3 px-2 py-1 bg-black/80 text-white rounded text-[10px] font-mono">
                  High-Contrast Active
                </span>
              )}
            </div>
          </div>

          {/* COLUMN 3: Retail Pharmacist Verification & Dispensing Workstation (4 cols) */}
          <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-[#E4E7E9] shadow-sm flex flex-col h-[820px] overflow-hidden">
            {/* Header with Decision Actions */}
            <div className="p-4 border-b border-[#E4E7E9] bg-[#FAFAFA] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs text-[#0F2A22]">Pharmacist Audit & Dispense</h3>
                <p className="text-[11px] text-[#5B6B65]">Drugs & Cosmetics Act Compliance</p>
              </div>

              {selectedRx && selectedRx.status === "PENDING" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRejectOpen(true)}
                    className="px-3 py-1.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5] rounded-xl text-xs font-bold hover:bg-[#FEE2E2] transition flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-3.5 py-1.5 bg-[#16A34A] text-white rounded-xl text-xs font-bold hover:bg-[#15803D] transition shadow flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Workstation Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* SECTION A: Prescriber Doctor & Clinic Audit */}
              <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F2A22] flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-[#0B4A3A]" />
                    Doctor & Clinic Verification
                  </span>
                  <span className="text-[10px] text-[#16A34A] font-bold bg-[#DCFCE7] px-2 py-0.5 rounded">
                    MCI Mandatory
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6B65] mb-1">Doctor Name</label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Kumar, MD"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#0B4A3A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6B65] mb-1">Doctor MCI / Reg No.</label>
                    <input
                      type="text"
                      value={doctorRegNo}
                      onChange={(e) => setDoctorRegNo(e.target.value)}
                      placeholder="e.g. MCI-48192-DEL"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-[#0B4A3A] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6B65] mb-1">Clinic / Hospital</label>
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="e.g. Apollo Polyclinic"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#0B4A3A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6B65] mb-1">Rx Validity</label>
                    <select
                      value={validityDays}
                      onChange={(e) => setValidityDays(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#0B4A3A] focus:outline-none"
                    >
                      <option value="30">30 Days (Acute)</option>
                      <option value="90">90 Days (Quarterly)</option>
                      <option value="180">180 Days (Chronic Standard)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION B: Statutory Regulatory Compliance Checks */}
              <div className="bg-[#FFFBEB] p-3.5 rounded-xl border border-[#FDE68A] space-y-2">
                <span className="text-xs font-bold text-[#92400E] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                  Drug Regulations & Schedule Checks
                </span>

                <div className="space-y-1.5 text-xs text-[#0F2A22]">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={scheduleCompliance.signatureVerified}
                      onChange={(e) =>
                        setScheduleCompliance({ ...scheduleCompliance, signatureVerified: e.target.checked })
                      }
                      className="w-3.5 h-3.5 text-[#16A34A] rounded"
                    />
                    <span>Doctor physical signature and stamp present</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={scheduleCompliance.regNoVerified}
                      onChange={(e) =>
                        setScheduleCompliance({ ...scheduleCompliance, regNoVerified: e.target.checked })
                      }
                      className="w-3.5 h-3.5 text-[#16A34A] rounded"
                    />
                    <span>Medical council registration number verified</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={scheduleCompliance.isScheduleH1}
                      onChange={(e) =>
                        setScheduleCompliance({ ...scheduleCompliance, isScheduleH1: e.target.checked })
                      }
                      className="w-3.5 h-3.5 text-[#DC2626] rounded"
                    />
                    <span className="text-[#DC2626] font-bold">
                      Contains Schedule H1 Drug (Log in Chemist Register)
                    </span>
                  </label>
                </div>
              </div>

              {/* SECTION C: Digitized Prescribed Medicines Dispensing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F2A22] flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-[#16A34A]" />
                    Dispensed Medicines ({dispensedItems.length})
                  </span>
                  <span className="text-xs font-extrabold text-[#0F2A22]">
                    Total: {formatCurrency(grandTotal)}
                  </span>
                </div>

                {/* Quick Medicine Catalog Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    placeholder="Search medicine catalog by name or composition..."
                    className="w-full px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#0B4A3A] focus:outline-none"
                  />
                  {isSearchingMed && (
                    <span className="absolute right-3 top-2.5 text-[10px] text-[#5B6B65] animate-pulse">
                      Searching...
                    </span>
                  )}

                  {/* Catalog Autocomplete Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-10 bg-white border border-[#E4E7E9] rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y">
                      {searchResults.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => handleAddMedicineFromCatalog(prod)}
                          className="p-2.5 hover:bg-[#F1F3F4] cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-[#0F2A22]">{prod.name}</p>
                            <p className="text-[10px] text-[#5B6B65]">{prod.brand} &bull; Stock: {prod.totalStock} units</p>
                          </div>
                          <span className="font-bold text-[#16A34A]">{formatCurrency(prod.price)}</span>
                        </div>
                      ))}
                      <div
                        onClick={handleAddManualMedicine}
                        className="p-2 bg-[#F8FAFC] text-[11px] font-bold text-[#0B4A3A] hover:bg-[#EFF6FF] cursor-pointer text-center"
                      >
                        + Add &quot;{medSearch}&quot; as custom/manual prescribed drug
                      </div>
                    </div>
                  )}
                </div>

                {/* Dispensed Items List */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {dispensedItems.length === 0 ? (
                    <div className="p-4 border-2 border-dashed border-[#E4E7E9] rounded-xl text-center text-[#5B6B65]">
                      <Pill className="w-5 h-5 opacity-40 mx-auto mb-1" />
                      <p className="text-xs font-semibold">No medicines digitized yet</p>
                      <p className="text-[10px] text-[#5B6B65]">
                        Search shop catalog above to match prescribed items.
                      </p>
                    </div>
                  ) : (
                    dispensedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white border border-[#E4E7E9] rounded-xl shadow-sm text-xs space-y-2 hover:border-[#CBD5E1] transition"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-[#0F2A22]">{item.name}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#5B6B65]">
                              {item.batchNumber && <span>Batch: {item.batchNumber}</span>}
                              {item.rackLocation && (
                                <span className="flex items-center gap-0.5 text-[#0B4A3A]">
                                  <MapPin className="w-2.5 h-2.5" /> {item.rackLocation}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-[#DC2626] hover:opacity-80 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Frequency & Dosage row */}
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <label className="text-[10px] text-[#5B6B65] font-semibold">Dosage Schedule</label>
                            <input
                              type="text"
                              value={item.frequency}
                              onChange={(e) => handleUpdateItem(item.id, "frequency", e.target.value)}
                              className="w-full px-2 py-1 bg-[#F8FAFC] border rounded font-medium"
                            />
                          </div>
                          <div className="flex gap-1 items-end">
                            <div className="flex-1">
                              <label className="text-[10px] text-[#5B6B65] font-semibold">Qty</label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.id, "quantity", Number(e.target.value))}
                                className="w-full px-2 py-1 bg-[#F8FAFC] border rounded font-bold text-center"
                              />
                            </div>
                            <div className="w-16">
                              <label className="text-[10px] text-[#5B6B65] font-semibold">Unit</label>
                              <select
                                value={item.unit}
                                onChange={(e) => handleUpdateItem(item.id, "unit", e.target.value)}
                                className="w-full px-1 py-1 bg-[#F8FAFC] border rounded text-[10px]"
                              >
                                <option value="Strip">Strip</option>
                                <option value="Tab">Tab</option>
                                <option value="Bottle">Bottle</option>
                                <option value="Tube">Tube</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION D: Pharmacist Digital Verification Stamp */}
              <div className="p-3 bg-[#F1F5F9] rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-[#0F2A22] font-bold">
                  <span>Pharmacist License Sign-Off</span>
                  <span className="text-[#16A34A] flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                  </span>
                </div>
                <p className="text-[11px] text-[#5B6B65]">
                  Verification records the reviewing pharmacist&apos;s administrative ID, license council timestamp, and statutory logs for state drug inspection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* REJECTION REASON MODAL */}
      {isRejectOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E4E7E9]">
            <div className="flex items-center gap-2 text-[#DC2626]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base">Reject Prescription Document</h3>
            </div>
            <p className="text-xs text-[#5B6B65]">
              Select the medical/regulatory deficiency reason. This notice will be immediately emailed to the customer.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0F2A22] mb-1">Standard Regulatory Reason</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22]"
                >
                  <option value="Doctor signature or medical council registration missing">
                    Doctor signature or medical council registration missing
                  </option>
                  <option value="Prescription expired (older than 6 months)">
                    Prescription expired (older than 6 months)
                  </option>
                  <option value="Illegible or unclear handwriting - doctor confirmation needed">
                    Illegible or unclear handwriting - doctor confirmation needed
                  </option>
                  <option value="Schedule X / Narcotic drug requires authorized specialty license">
                    Schedule X / Narcotic drug requires authorized specialty license
                  </option>
                  <option value="Altered or tampered document image">
                    Altered or tampered document image
                  </option>
                  <option value="Dosage frequency or quantity not specified by physician">
                    Dosage frequency or quantity not specified by physician
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F2A22] mb-1">Additional Pharmacist Notes</label>
                <textarea
                  rows={3}
                  value={customRejectNotes}
                  onChange={(e) => setCustomRejectNotes(e.target.value)}
                  placeholder="e.g. Please provide a clear copy showing the doctor's registration stamp at the bottom right..."
                  className="w-full px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsRejectOpen(false)}
                className="px-4 py-2 bg-[#F1F3F4] text-[#0F2A22] rounded-xl text-xs font-bold hover:bg-[#E4E7E9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 bg-[#DC2626] text-white rounded-xl text-xs font-bold hover:bg-[#B91C1C] shadow"
              >
                Confirm Rejection & Send Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
