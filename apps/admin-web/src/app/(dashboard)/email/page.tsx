"use client";

import React, { useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import {
  Mail,
  Send,
  Inbox,
  Archive,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Users,
  FileText,
  Bell,
} from "lucide-react";

// Static email templates for the pharmacy admin
const EMAIL_TEMPLATES = [
  {
    id: "1",
    name: "Order Confirmation",
    subject: "Your Pharmico Order #{orderNumber} is Confirmed",
    category: "Transactional",
    lastEdited: "2026-09-28",
    status: "active",
  },
  {
    id: "2",
    name: "Prescription Approved",
    subject: "Your Prescription has been Verified & Approved",
    category: "Transactional",
    lastEdited: "2026-09-25",
    status: "active",
  },
  {
    id: "3",
    name: "Shipping Update",
    subject: "Your Order #{orderNumber} has been Shipped!",
    category: "Transactional",
    lastEdited: "2026-09-20",
    status: "active",
  },
  {
    id: "4",
    name: "Low Stock Alert",
    subject: "[Internal] Low Stock Warning — {productName}",
    category: "Internal",
    lastEdited: "2026-09-18",
    status: "active",
  },
  {
    id: "5",
    name: "Refund Processed",
    subject: "Refund of ₹{amount} has been Processed",
    category: "Transactional",
    lastEdited: "2026-09-15",
    status: "active",
  },
  {
    id: "6",
    name: "Welcome New Customer",
    subject: "Welcome to Pharmico — Your Health Partner",
    category: "Marketing",
    lastEdited: "2026-09-12",
    status: "active",
  },
  {
    id: "7",
    name: "Monthly Health Newsletter",
    subject: "Your Monthly Wellness Digest from Pharmico",
    category: "Marketing",
    lastEdited: "2026-09-10",
    status: "draft",
  },
  {
    id: "8",
    name: "Expiry Reminder",
    subject: "[Internal] Batch Expiry Alert — Action Required",
    category: "Internal",
    lastEdited: "2026-09-08",
    status: "draft",
  },
];

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  Transactional: { bg: "bg-[#DCFCE7]", text: "text-[#16A34A]" },
  Marketing: { bg: "bg-[#E0E7FF]", text: "text-[#4F46E5]" },
  Internal: { bg: "bg-[#FEF3C7]", text: "text-[#D97706]" },
};

export default function EmailPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const filteredTemplates = EMAIL_TEMPLATES.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const activeCount = EMAIL_TEMPLATES.filter((t) => t.status === "active").length;
  const draftCount = EMAIL_TEMPLATES.filter((t) => t.status === "draft").length;

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Communications" title="Email Templates & Notifications" />

      <div className="p-8 max-w-6xl mx-auto space-y-6">
        {/* Metric Badges */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Total Templates</p>
              <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">{EMAIL_TEMPLATES.length}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FAF3EA] flex items-center justify-center text-[#0B4A3A]">
              <Mail className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Active</p>
              <h4 className="text-2xl font-black text-[#16A34A] mt-1">{activeCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] flex items-center justify-center text-[#16A34A]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Drafts</p>
              <h4 className="text-2xl font-black text-[#D97706] mt-1">{draftCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Categories</p>
              <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">3</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#E0E7FF] flex items-center justify-center text-[#4F46E5]">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Templates Table */}
        <div className="bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E4E7E9] flex items-center justify-between gap-4">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-[#5B6B65] absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#F1F3F4] rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              {["ALL", "Transactional", "Marketing", "Internal"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    categoryFilter === c
                      ? "bg-[#0B4A3A] text-white"
                      : "bg-[#F1F3F4] text-[#5B6B65] hover:bg-[#E4E7E9]"
                  }`}
                >
                  {c === "ALL" ? "All" : c}
                </button>
              ))}
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#F9FAFB] text-[10px] font-extrabold text-[#5B6B65] uppercase tracking-wider border-b border-[#E4E7E9]">
            <div className="col-span-3">Template Name</div>
            <div className="col-span-4">Subject Line</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Last Edited</div>
          </div>

          <div className="divide-y divide-[#E4E7E9] max-h-[520px] overflow-y-auto">
            {filteredTemplates.map((t) => {
              const catStyle = CATEGORY_STYLES[t.category] || CATEGORY_STYLES.Transactional;
              const isSelected = selectedTemplate === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplate(isSelected ? null : t.id)}
                  className={`grid grid-cols-12 gap-4 px-4 py-3.5 items-center transition cursor-pointer ${
                    isSelected ? "bg-[#FAF3EA]" : "hover:bg-[#F9FAFB]"
                  }`}
                >
                  <div className="col-span-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F1F3F4] flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-[#0B4A3A]" />
                    </div>
                    <p className="text-xs font-bold text-[#0F2A22] truncate">{t.name}</p>
                  </div>
                  <div className="col-span-4">
                    <p className="text-xs text-[#5B6B65] font-medium truncate">{t.subject}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${catStyle.bg} ${catStyle.text}`}>
                      {t.category}
                    </span>
                  </div>
                  <div className="col-span-1">
                    {t.status === "active" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16A34A]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" /> Live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D97706]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> Draft
                      </span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-[#5B6B65] font-medium">
                      {new Date(t.lastEdited).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredTemplates.length === 0 && (
              <div className="p-8 text-center text-xs text-[#5B6B65]">
                No matching templates found.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[#E4E7E9] bg-[#F9FAFB] flex items-center justify-between">
            <span className="text-[11px] text-[#5B6B65] font-medium">
              Showing {filteredTemplates.length} of {EMAIL_TEMPLATES.length} templates
            </span>
            <span className="text-[10px] text-[#5B6B65] font-medium italic">
              Email template API coming soon — showing preview data
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
