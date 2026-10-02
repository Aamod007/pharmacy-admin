"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { formatCurrency } from "../../../lib/utils";
import {
  Stethoscope,
  Video,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function ConsultationsPage() {
  const [activeTab, setActiveTab] = useState<"appointments" | "doctors">("appointments");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  // New Doctor Form
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("General Physician & Internal Medicine");
  const [qualification, setQualification] = useState("MBBS, MD");
  const [experienceYears, setExperienceYears] = useState("8");
  const [consultationFee, setConsultationFee] = useState("499");
  const [registrationNumber, setRegistrationNumber] = useState("MCI-KA-10293");
  const [bio, setBio] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [docRes, aptRes] = await Promise.all([
        apiRequest("/consultations/doctors"),
        apiRequest("/consultations/appointments"),
      ]);
      setDoctors(docRes.data || []);
      setAppointments(aptRes.data || []);
    } catch (err: any) {
      toast.error("Failed to load consultations data", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/consultations/doctors", {
        method: "POST",
        body: JSON.stringify({
          name,
          specialization,
          qualification,
          experienceYears: Number(experienceYears),
          consultationFee: Number(consultationFee),
          registrationNumber,
          bio,
        }),
      });
      toast.success("Medical specialist onboarded successfully");
      setShowDoctorModal(false);
      setName("");
      setBio("");
      loadData();
    } catch (err: any) {
      toast.error("Failed to add doctor", { description: err.message });
    }
  };

  const handleUpdateAppointment = async (id: string, status: string) => {
    try {
      await apiRequest(`/consultations/appointments/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      toast.success(`Appointment marked as ${status}`);
      loadData();
    } catch (err: any) {
      toast.error("Failed to update status", { description: err.message });
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this doctor?")) return;
    try {
      await apiRequest(`/consultations/doctors/${id}`, { method: "DELETE" });
      toast.success("Doctor record deleted");
      loadData();
    } catch (err: any) {
      toast.error("Failed to delete doctor", { description: err.message });
    }
  };

  return (
    <div className="flex-1 pb-16">
      <Topbar
        breadcrumb="Telehealth"
        title="Doctor Video Consultations"
        primaryAction={{
          label: "Onboard Specialist +",
          onClick: () => setShowDoctorModal(true),
        }}
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[#D7DEDB] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("appointments")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "appointments"
                ? "bg-[#0B4A3A] text-white shadow-xs"
                : "bg-white text-[#5B6B65] hover:bg-[#F4F6F5] border border-[#D7DEDB]"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Consultation Sessions ({appointments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("doctors")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "doctors"
                ? "bg-[#0B4A3A] text-white shadow-xs"
                : "bg-white text-[#5B6B65] hover:bg-[#F4F6F5] border border-[#D7DEDB]"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Specialist Doctors ({doctors.length})</span>
          </button>
        </div>

        {/* TAB 1: APPOINTMENTS */}
        {activeTab === "appointments" && (
          <div className="bg-white rounded-2xl border border-[#D7DEDB] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#D7DEDB] bg-[#FAF3EA]/40 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-[#0F2A22]">Telehealth Consultation Queue</h3>
                <p className="text-xs text-[#5B6B65]">Patient appointments, video rooms, and post-call Rx notes</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-white border border-[#D7DEDB] rounded-full text-[#0B4A3A]">
                Total: {appointments.length} Sessions
              </span>
            </div>

            <div className="divide-y divide-[#D7DEDB]">
              {appointments.length === 0 ? (
                <div className="p-12 text-center text-[#5B6B65] text-xs font-semibold">
                  No consultation appointments scheduled.
                </div>
              ) : (
                appointments.map((a) => (
                  <div key={a.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F4F6F5]/50 transition">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-black text-[#0B4A3A] px-2 py-0.5 rounded-md bg-[#FAF3EA] border border-[#D7DEDB]">
                          {a.appointmentNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            a.status === "COMPLETED"
                              ? "bg-[#DCFCE7] text-[#16A34A]"
                              : a.status === "IN_PROGRESS"
                              ? "bg-[#FEF9C3] text-[#B45309]"
                              : a.status === "CANCELLED"
                              ? "bg-[#FEE2E2] text-[#DC2626]"
                              : "bg-[#DBEAFE] text-[#1D4ED8]"
                          }`}
                        >
                          {a.status}
                        </span>
                        <span className="text-xs font-bold text-[#16A34A]">{a.paymentStatus}</span>
                      </div>

                      <h4 className="text-sm font-extrabold text-[#0F2A22]">
                        Consultation with {a.doctor?.name || "Doctor"} ({a.doctor?.specialization})
                      </h4>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#5B6B65]">
                        <span className="flex items-center gap-1 font-semibold text-[#0F2A22]">
                          <User className="w-3.5 h-3.5 text-[#0B4A3A]" />
                          Patient: {a.patientName} ({a.patientAge}y, {a.patientGender})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(a.appointmentDate).toLocaleDateString("en-IN")} at {a.timeSlot}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-[#0B4A3A]">{formatCurrency(a.fee)}</span>
                      </div>

                      {a.notes && (
                        <p className="text-[11px] text-[#5B6B65] bg-[#FAF3EA] p-2 rounded-xl border border-[#D7DEDB]/60">
                          <strong>Chief Complaint:</strong> {a.notes}
                        </p>
                      )}

                      {a.prescriptionNotes && (
                        <p className="text-[11px] text-[#0B4A3A] bg-[#DCFCE7]/40 p-2 rounded-xl border border-[#10B981]/30">
                          <strong>Doctor&apos;s Rx Notes:</strong> {a.prescriptionNotes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {a.videoRoomUrl && (
                        <a
                          href={a.videoRoomUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Video Call</span>
                        </a>
                      )}
                      {a.status === "SCHEDULED" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateAppointment(a.id, "COMPLETED")}
                          className="px-3 py-2 bg-[#0B4A3A] hover:bg-[#07362a] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SPECIALISTS DIRECTORY */}
        {activeTab === "doctors" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-[#D7DEDB] p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-[#10B981] transition">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={d.avatar || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400"}
                        alt={d.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#10B981]"
                      />
                      <div>
                        <h4 className="font-extrabold text-sm text-[#0F2A22]">{d.name}</h4>
                        <p className="text-[11px] text-[#5B6B65] font-semibold">{d.qualification}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoctor(d.id)}
                      className="p-1.5 text-gray-400 hover:text-[#DC2626] transition cursor-pointer rounded-lg hover:bg-[#FEF2F2]"
                      title="Deactivate Doctor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#0B4A3A] bg-[#FAF3EA] px-2.5 py-0.5 rounded-full border border-[#D7DEDB]">
                      {d.specialization}
                    </span>
                    <p className="text-xs text-[#5B6B65] pt-1 line-clamp-2">{d.bio}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#5B6B65] pt-1">
                    <span>{d.experienceYears}+ Years Exp</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] font-bold text-[#0F2A22]">{d.registrationNumber}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#D7DEDB] flex items-center justify-between">
                  <span className="text-base font-black text-[#0B4A3A]">
                    {formatCurrency(d.consultationFee)} <span className="text-[11px] font-normal text-[#5B6B65]">/ call</span>
                  </span>
                  <span className="text-xs font-bold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
                    {d.isAvailable ? "Available" : "Offline"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ONBOARD SPECIALIST MODAL */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#D7DEDB] pb-3">
              <h3 className="font-black text-base text-[#0F2A22]">Onboard Medical Specialist</h3>
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="text-gray-400 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Gupta"
                  className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Specialization</label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Cardiologist"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Qualifications</label>
                  <input
                    type="text"
                    required
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="MBBS, MD (Medicine)"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Experience (Yrs)</label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">MCI / State Reg No</label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="MCI-KA-12001"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1">Professional Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Senior Consultant with over 10 years experience treating chronic hypertension and lifestyle disorders..."
                  className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2 border border-[#D7DEDB] rounded-xl text-xs font-bold text-[#5B6B65] hover:bg-[#F4F6F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B4A3A] hover:bg-[#07362a] text-white rounded-xl text-xs font-bold"
                >
                  Onboard Specialist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
