"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { formatCurrency } from "../../../lib/utils";
import { FileText, Download, User, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "creditNotes">("invoices");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, cnRes] = await Promise.all([
        apiRequest("/invoices"),
        apiRequest("/invoices/credit-notes"),
      ]);
      setInvoices(invRes.data || []);
      setCreditNotes(cnRes.data || []);
    } catch (err: any) {
      toast.error("Failed to load invoice records", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadPdf = (orderId: string) => {
    window.open(`http://localhost:5001/api/v1/invoices/${orderId}/pdf`, "_blank");
  };

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Finance" title="Tax Invoices & GST Reports" />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[#D7DEDB] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "invoices"
                ? "bg-[#0B4A3A] text-white shadow-xs"
                : "bg-white text-[#5B6B65] hover:bg-[#F4F6F5] border border-[#D7DEDB]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Store GST Tax Invoices ({invoices.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("creditNotes")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "creditNotes"
                ? "bg-[#0B4A3A] text-white shadow-xs"
                : "bg-white text-[#5B6B65] hover:bg-[#F4F6F5] border border-[#D7DEDB]"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Issued Credit Notes ({creditNotes.length})</span>
          </button>
        </div>

        {/* TAB 1: TAX INVOICES */}
        {activeTab === "invoices" && (
          <div className="bg-white rounded-2xl border border-[#D7DEDB] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#D7DEDB] bg-[#FAF3EA]/40 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-[#0F2A22]">Statutory GST Tax Invoices</h3>
                <p className="text-xs text-[#5B6B65]">Pharmico Healthcare Pvt Ltd • GSTIN: 29AAAAA0000A1Z5</p>
              </div>
              <span className="text-xs font-bold text-[#0B4A3A] px-3 py-1 bg-white border border-[#D7DEDB] rounded-full">
                50% CGST + 50% SGST Breakdown
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#D7DEDB] bg-[#F4F6F5] text-[#5B6B65] font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Invoice / Order #</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Taxable Subtotal</th>
                    <th className="py-3 px-4">GST (12% / 18%)</th>
                    <th className="py-3 px-4">Invoice Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7DEDB]">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#5B6B65] font-semibold">
                        No orders or invoices found.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#F4F6F5]/50 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0B4A3A]">
                          INV-{inv.orderNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0F2A22]">{inv.user?.name || "Customer"}</div>
                          <div className="text-[11px] text-[#5B6B65]">{inv.user?.phone || "N/A"}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#5B6B65]">
                          {new Date(inv.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#0F2A22]">
                          {formatCurrency(inv.subtotal)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#16A34A]">
                          {formatCurrency(inv.gstAmount || Number(inv.totalAmount) * 0.12)}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-[#0B4A3A]">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#DCFCE7] text-[#16A34A]">
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(inv.id)}
                            className="px-3 py-1.5 bg-[#0B4A3A] hover:bg-[#07362a] text-white rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-[#10B981]" />
                            <span>PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CREDIT NOTES */}
        {activeTab === "creditNotes" && (
          <div className="bg-white rounded-2xl border border-[#D7DEDB] shadow-xs p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-[#0F2A22]">Issued Credit Notes</h3>
            {creditNotes.length === 0 ? (
              <div className="p-8 text-center text-[#5B6B65] text-xs font-semibold">
                No credit notes have been issued.
              </div>
            ) : (
              <div className="space-y-2">
                {creditNotes.map((cn) => (
                  <div key={cn.id} className="p-4 rounded-xl border border-[#D7DEDB] flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-[#0B4A3A]">CN-{cn.noteNumber}</span>
                      <p className="text-[#5B6B65]">Order: {cn.order?.orderNumber} • Reason: {cn.reason}</p>
                    </div>
                    <span className="font-extrabold text-[#DC2626]">{formatCurrency(cn.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
