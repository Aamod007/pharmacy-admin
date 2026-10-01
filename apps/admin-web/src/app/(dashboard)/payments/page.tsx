"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { Search, CreditCard, IndianRupee, CheckCircle2, Clock, XCircle, ArrowUpDown } from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  PAID: { bg: "bg-[#DCFCE7]", text: "text-[#16A34A]", dot: "bg-[#16A34A]" },
  PENDING: { bg: "bg-[#FEF3C7]", text: "text-[#D97706]", dot: "bg-[#D97706]" },
  FAILED: { bg: "bg-[#FEE2E2]", text: "text-[#DC2626]", dot: "bg-[#DC2626]" },
  REFUNDED: { bg: "bg-[#E0E7FF]", text: "text-[#4F46E5]", dot: "bg-[#4F46E5]" },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadPayments = async () => {
    try {
      const res = await apiRequest("/payments");
      setPayments(res.data || []);
      setMeta(res.meta || {});
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.razorpayPaymentId?.toLowerCase().includes(search.toLowerCase()) ||
      p.order?.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.order?.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const paidCount = payments.filter((p) => p.status === "PAID").length;
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Finance" title="Payment Transactions" />

      <div className="p-8 max-w-6xl mx-auto space-y-6">
        {/* Metric Badges */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Total Revenue</p>
              <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">₹{totalRevenue.toLocaleString("en-IN")}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] flex items-center justify-center text-[#16A34A]">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Successful Payments</p>
              <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">{paidCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FAF3EA] flex items-center justify-center text-[#0B4A3A]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Pending</p>
              <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">{pendingCount}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E4E7E9] flex items-center justify-between gap-4">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 text-[#5B6B65] absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by payment ID, order, or customer..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#F1F3F4] rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              {["ALL", "PAID", "PENDING", "FAILED", "REFUNDED"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === s
                      ? "bg-[#0B4A3A] text-white"
                      : "bg-[#F1F3F4] text-[#5B6B65] hover:bg-[#E4E7E9]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#F9FAFB] text-[10px] font-extrabold text-[#5B6B65] uppercase tracking-wider border-b border-[#E4E7E9]">
            <div className="col-span-3">Payment ID</div>
            <div className="col-span-2">Order</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Date</div>
          </div>

          <div className="divide-y divide-[#E4E7E9] max-h-[520px] overflow-y-auto">
            {filteredPayments.map((p) => {
              const style = STATUS_STYLES[p.status] || STATUS_STYLES.PENDING;
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-[#F9FAFB] transition"
                >
                  <div className="col-span-3">
                    <p className="text-xs font-bold text-[#0F2A22] truncate flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#5B6B65] flex-shrink-0" />
                      {p.razorpayPaymentId || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-[#0B4A3A] truncate">
                      {p.order?.orderNumber || "—"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-medium text-[#0F2A22] truncate">
                      {p.order?.user?.name || "—"}
                    </p>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-black text-[#0B4A3A]">
                      ₹{Number(p.amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${style.bg} ${style.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {p.status}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-[#5B6B65] font-medium">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredPayments.length === 0 && (
              <div className="p-8 text-center text-xs text-[#5B6B65]">
                No payment transactions found.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[#E4E7E9] bg-[#F9FAFB] flex items-center justify-between">
            <span className="text-[11px] text-[#5B6B65] font-medium">
              Showing {filteredPayments.length} of {meta.total || payments.length} transactions
            </span>
            <span className="text-[11px] text-[#5B6B65] font-medium">
              Page {meta.page || 1} of {meta.totalPages || 1}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
