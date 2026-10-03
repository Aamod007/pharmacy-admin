"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { formatCurrency, formatDateIST } from "../../../lib/utils";
import {
  Search,
  Eye,
  Download,
  X,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  AlertCircle,
  RotateCcw,
  FileText,
  MapPin,
  User,
  CreditCard,
  Ban,
  Loader2,
  ChevronRight,
  Package,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_TABS = [
  { id: "ALL", label: "All Orders" },
  { id: "PLACED", label: "Placed" },
  { id: "CONFIRMED", label: "Confirmed" },
  { id: "PACKED", label: "Packed" },
  { id: "SHIPPED", label: "Shipped" },
  { id: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { id: "DELIVERED", label: "Delivered" },
  { id: "CANCELLED", label: "Cancelled" },
];

export default function OrdersPage() {
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // In-memory cache for fast tab switching (0ms latency)
  const isInitialMount = useRef(true);

  // Load orders from API
  const loadOrders = async (silent = false) => {
    if (!silent && allOrders.length === 0) setLoading(true);
    try {
      // Fetch fresh orders (backend includes items & in-memory cache)
      const res = await apiRequest(`/orders?limit=100`);
      const fetched = res.data || [];
      setAllOrders(fetched);

      // Keep selected order synced if open
      if (selectedOrder) {
        const refreshedSelected = fetched.find((o: any) => o.id === selectedOrder.id);
        if (refreshedSelected) setSelectedOrder(refreshedSelected);
      }
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      toast.error("Failed to fetch orders", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(false);
  }, []);

  // Compute status counts for badges (instant derived state)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: allOrders.length };
    for (const o of allOrders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [allOrders]);

  // Client-side instant filter by status & search keyword (0ms latency!)
  const filteredOrders = useMemo(() => {
    let list = allOrders;

    // Filter by tab status
    if (statusFilter !== "ALL") {
      list = list.filter((o) => o.status === statusFilter);
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) => {
        const orderNum = (o.orderNumber || "").toLowerCase();
        const userName = (o.user?.name || "").toLowerCase();
        const userEmail = (o.user?.email || "").toLowerCase();
        const userPhone = (o.user?.phone || "").toLowerCase();
        return (
          orderNum.includes(q) ||
          userName.includes(q) ||
          userEmail.includes(q) ||
          userPhone.includes(q)
        );
      });
    }

    return list;
  }, [allOrders, statusFilter, search]);

  // Handle Order Status State Machine Transitions
  const handleUpdateStatus = async (orderId: string, newStatus: string, reason?: string) => {
    setIsUpdatingStatus(newStatus);

    // Optimistic UI update: instantly update local state so user feels 0ms latency
    const previousOrders = [...allOrders];
    const previousSelected = selectedOrder ? { ...selectedOrder } : null;

    setAllOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              cancelReason: newStatus === "CANCELLED" ? reason || "Cancelled by admin" : o.cancelReason,
            }
          : o
      )
    );

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev: any) => ({
        ...prev,
        status: newStatus,
        cancelReason: newStatus === "CANCELLED" ? reason || "Cancelled by admin" : prev?.cancelReason,
      }));
    }

    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
          note: reason || `Status transitioned to ${newStatus} by admin operator`,
        }),
      });

      toast.success(`Order marked as ${newStatus.replace(/_/g, " ")}`);
      setShowCancelModal(false);
      setCancelReason("");

      // Background silent revalidation
      loadOrders(true);
    } catch (err: any) {
      // Revert optimistic state on failure
      setAllOrders(previousOrders);
      if (previousSelected) setSelectedOrder(previousSelected);
      toast.error("Failed to update order status", { description: err.message });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleDownloadInvoice = (orderId: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/invoices/${orderId}/pdf`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLACED":
        return "bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]";
      case "CONFIRMED":
        return "bg-[#E0E7FF] text-[#4F46E5] border-[#C7D2FE]";
      case "PACKED":
        return "bg-[#F3E8FF] text-[#9333EA] border-[#E9D5FF]";
      case "SHIPPED":
        return "bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]";
      case "OUT_FOR_DELIVERY":
        return "bg-[#FFEDD5] text-[#EA580C] border-[#FED7AA]";
      case "DELIVERED":
        return "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]";
      case "CANCELLED":
        return "bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]";
      default:
        return "bg-[#F1F3F4] text-[#5B6B65] border-[#E4E7E9]";
    }
  };

  return (
    <div className="flex-1 pb-16 bg-[#F8FAFC]">
      <Topbar breadcrumb="Fulfillment" title="Orders & Sales Management" />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Top Control Bar: Search & Status Tabs */}
        <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Instant Search Bar */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-[#5B6B65] absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order # (MED-...), customer name, email, or phone..."
                className="w-full pl-10 pr-9 py-2 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-3 text-[#5B6B65] hover:text-[#0F2A22]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => loadOrders(false)}
              className="px-3.5 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] hover:bg-[#E4E7E9] transition flex items-center gap-1.5 cursor-pointer"
              title="Refresh Orders"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* Status Tabs with Instant Counts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-[#E4E7E9] pt-3">
            {STATUS_TABS.map((tab) => {
              const count = statusCounts[tab.id] || 0;
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#0B4A3A] text-white shadow-xs"
                      : "bg-[#F1F3F4] text-[#5B6B65] hover:bg-[#E4E7E9]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-[#E4E7E9] text-[#0F2A22]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F5F6F7] border-b border-[#E4E7E9] text-xs font-bold text-[#5B6B65] uppercase">
                <tr>
                  <th className="py-3 px-6">Order #</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Order Date (IST)</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7E9]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#5B6B65]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-[#0B4A3A] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-semibold">Loading orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#5B6B65]">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-10 h-10 opacity-30 text-[#0B4A3A]" />
                        <p className="font-semibold text-sm text-[#0F2A22]">No Orders Found</p>
                        <p className="text-xs">
                          {search.trim()
                            ? `No orders matching "${search}" in "${statusFilter}".`
                            : `No orders currently in status "${statusFilter}".`}
                        </p>
                        {statusFilter !== "ALL" && (
                          <button
                            onClick={() => {
                              setStatusFilter("ALL");
                              setSearch("");
                            }}
                            className="mt-2 px-3 py-1 bg-[#0B4A3A] text-white rounded-lg text-xs font-bold"
                          >
                            View All Orders
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const badgeClass = getStatusBadge(o.status);
                    const itemCount = o.items?.length || o._count?.items || 0;

                    return (
                      <tr key={o.id} className="hover:bg-[#F8FAFC] transition">
                        {/* Order Number */}
                        <td className="py-3.5 px-6 font-mono font-bold text-xs text-[#0F2A22]">
                          {o.orderNumber}
                        </td>

                        {/* Customer Info */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-xs text-[#0F2A22]">{o.user?.name || "Customer"}</p>
                          <p className="text-[11px] text-[#5B6B65] mt-0.5">{o.user?.phone || o.user?.email || "—"}</p>
                        </td>

                        {/* Order Date */}
                        <td className="py-3.5 px-4 text-xs font-medium text-[#5B6B65]">
                          {formatDateIST(o.createdAt)}
                        </td>

                        {/* Items Count */}
                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-bold text-[#0F2A22]">{itemCount} items</span>
                          {o.items && o.items.length > 0 && (
                            <p className="text-[10px] text-[#5B6B65] truncate max-w-[180px]">
                              {o.items[0]?.productName}
                              {o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}
                            </p>
                          )}
                        </td>

                        {/* Payment */}
                        <td className="py-3.5 px-4 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#0F2A22]">{o.paymentMethod || "PREPAID"}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                o.isPaid || o.paymentStatus === "PAID"
                                  ? "bg-[#DCFCE7] text-[#16A34A]"
                                  : "bg-[#FEF3C7] text-[#D97706]"
                              }`}
                            >
                              {o.isPaid || o.paymentStatus === "PAID" ? "PAID" : "PENDING"}
                            </span>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-3.5 px-4 font-bold text-xs text-[#0F2A22]">
                          {formatCurrency(o.totalAmount)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                            {o.status.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="px-2.5 py-1.5 bg-[#F1F3F4] text-[#0F2A22] hover:bg-[#0B4A3A] hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Inspect Order Details & Actions"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(o.id)}
                              className="p-1.5 bg-white border border-[#E4E7E9] text-[#5B6B65] hover:text-[#0B4A3A] hover:border-[#0B4A3A] rounded-lg transition cursor-pointer"
                              title="Download GST Tax Invoice (PDF)"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FULL ORDER INSPECTION & LIFECYCLE MODAL (0ms Instant Display) */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-[#E4E7E9] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF3EA] flex items-center justify-center text-[#0B4A3A]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#0F2A22] flex items-center gap-2">
                      Order: #{selectedOrder.orderNumber}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedOrder.status)}`}>
                        {selectedOrder.status.replace(/_/g, " ")}
                      </span>
                    </h3>
                    <p className="text-xs text-[#5B6B65] mt-0.5">
                      Placed on {formatDateIST(selectedOrder.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadInvoice(selectedOrder.id)}
                    className="px-3 py-1.5 bg-[#F1F3F4] text-[#0F2A22] rounded-xl text-xs font-bold hover:bg-[#E4E7E9] transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> GST Invoice
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrder(null);
                      setShowCancelModal(false);
                    }}
                    className="p-1.5 text-[#5B6B65] hover:text-[#0F2A22] hover:bg-[#F1F3F4] rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Customer & Address Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E4E7E9] space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0B4A3A]">
                    <User className="w-3.5 h-3.5" />
                    <span>Customer Details</span>
                  </div>
                  <p className="font-bold text-sm text-[#0F2A22]">{selectedOrder.user?.name || "Customer"}</p>
                  <p className="text-xs text-[#5B6B65]">{selectedOrder.user?.email || "No email"}</p>
                  <p className="text-xs font-mono font-medium text-[#0F2A22]">{selectedOrder.user?.phone || "No phone"}</p>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E4E7E9] space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0B4A3A]">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Delivery Address</span>
                  </div>
                  <p className="text-xs text-[#0F2A22] font-semibold leading-relaxed">
                    {selectedOrder.address?.addressLine1 || "Local Delivery Address"}
                    {selectedOrder.address?.city && `, ${selectedOrder.address.city}`}
                    {selectedOrder.address?.state && `, ${selectedOrder.address.state}`}
                    {selectedOrder.address?.pincode && ` - ${selectedOrder.address.pincode}`}
                  </p>
                  <p className="text-[11px] text-[#5B6B65]">Payment: {selectedOrder.paymentMethod} &bull; {selectedOrder.paymentStatus || (selectedOrder.isPaid ? "PAID" : "PENDING")}</p>
                </div>
              </div>

              {/* Ordered Medicines & Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-[#5B6B65] tracking-wider">
                  Ordered Medicines &amp; Items ({selectedOrder.items?.length || selectedOrder._count?.items || 0})
                </h4>

                <div className="border border-[#E4E7E9] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#E4E7E9] font-bold text-[#5B6B65]">
                      <tr>
                        <th className="py-2.5 px-3">Medicine Name</th>
                        <th className="py-2.5 px-3">Pack / Form</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E7E9]">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((it: any) => (
                          <tr key={it.id} className="hover:bg-[#FAFAFA]">
                            <td className="py-2.5 px-3 font-bold text-[#0F2A22]">
                              {it.productName}
                              {it.sku && <span className="block font-mono text-[10px] text-[#5B6B65] font-normal">{it.sku}</span>}
                            </td>
                            <td className="py-2.5 px-3 text-[#5B6B65]">{it.packSize || "Standard Pack"}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-[#0F2A22]">{it.quantity}</td>
                            <td className="py-2.5 px-3 text-right text-[#5B6B65]">₹{Number(it.price || 0).toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-[#0F2A22]">₹{Number(it.subtotal || it.price * it.quantity || 0).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-[#5B6B65]">
                            Standard Prescription Items ({selectedOrder._count?.items || 1} units)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E4E7E9] flex flex-wrap justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-[#5B6B65] font-semibold">Payment Method</span>
                  <p className="font-bold text-[#0F2A22]">{selectedOrder.paymentMethod || "Online / UPI"}</p>
                  <p className="text-[10px] text-[#5B6B65]">Status: <strong className="text-[#16A34A]">{selectedOrder.isPaid || selectedOrder.paymentStatus === "PAID" ? "Settled (PAID)" : "Pending Settlement"}</strong></p>
                </div>

                <div className="w-64 space-y-1 text-right">
                  <div className="flex justify-between text-[#5B6B65]">
                    <span>Items Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.subtotal || selectedOrder.totalAmount)}</span>
                  </div>
                  {Number(selectedOrder.discount || 0) > 0 && (
                    <div className="flex justify-between text-[#16A34A]">
                      <span>Discount:</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  {Number(selectedOrder.gstAmount || 0) > 0 && (
                    <div className="flex justify-between text-[#5B6B65]">
                      <span>GST:</span>
                      <span>{formatCurrency(selectedOrder.gstAmount)}</span>
                    </div>
                  )}
                  {Number(selectedOrder.deliveryFee || 0) > 0 && (
                    <div className="flex justify-between text-[#5B6B65]">
                      <span>Delivery:</span>
                      <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm text-[#0F2A22] pt-1.5 border-t border-[#E4E7E9]">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* State Machine Action Workflow Bar */}
              <div className="p-4 bg-[#F1F3F4] rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-[#5B6B65] uppercase">Order State Machine</span>
                  <p className="font-bold text-sm text-[#0F2A22] mt-0.5">
                    Current Stage: <span className="text-[#0B4A3A]">{selectedOrder.status.replace(/_/g, " ")}</span>
                  </p>
                  {selectedOrder.cancelReason && (
                    <p className="text-xs text-[#DC2626] font-semibold mt-1">
                      Cancellation Reason: {selectedOrder.cancelReason}
                    </p>
                  )}
                </div>

                {/* Workflow Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Step 1: PLACED -> CONFIRMED */}
                  {selectedOrder.status === "PLACED" && (
                    <button
                      disabled={!!isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "CONFIRMED")}
                      className="px-4 py-2 bg-[#0B4A3A] text-white rounded-xl text-xs font-bold shadow hover:bg-[#073629] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdatingStatus === "CONFIRMED" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Confirm &amp; Allocate Stock</span>
                    </button>
                  )}

                  {/* Step 2: CONFIRMED -> PACKED */}
                  {selectedOrder.status === "CONFIRMED" && (
                    <button
                      disabled={!!isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "PACKED")}
                      className="px-4 py-2 bg-[#4F46E5] text-white rounded-xl text-xs font-bold shadow hover:bg-[#4338CA] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdatingStatus === "PACKED" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
                      <span>Mark Packed</span>
                    </button>
                  )}

                  {/* Step 3: PACKED -> SHIPPED */}
                  {selectedOrder.status === "PACKED" && (
                    <button
                      disabled={!!isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "SHIPPED")}
                      className="px-4 py-2 bg-[#0284C7] text-white rounded-xl text-xs font-bold shadow hover:bg-[#0369A1] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdatingStatus === "SHIPPED" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                      <span>Dispatch &amp; Mark Shipped</span>
                    </button>
                  )}

                  {/* Step 4: SHIPPED -> OUT_FOR_DELIVERY */}
                  {selectedOrder.status === "SHIPPED" && (
                    <button
                      disabled={!!isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "OUT_FOR_DELIVERY")}
                      className="px-4 py-2 bg-[#EA580C] text-white rounded-xl text-xs font-bold shadow hover:bg-[#C2410C] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdatingStatus === "OUT_FOR_DELIVERY" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                      <span>Mark Out for Delivery</span>
                    </button>
                  )}

                  {/* Step 5: OUT_FOR_DELIVERY -> DELIVERED */}
                  {selectedOrder.status === "OUT_FOR_DELIVERY" && (
                    <button
                      disabled={!!isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "DELIVERED")}
                      className="px-4 py-2 bg-[#16A34A] text-white rounded-xl text-xs font-bold shadow hover:bg-[#15803D] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdatingStatus === "DELIVERED" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Mark Delivered</span>
                    </button>
                  )}

                  {/* Cancel Order Option for Any Non-Terminal State */}
                  {selectedOrder.status !== "DELIVERED" && selectedOrder.status !== "CANCELLED" && (
                    <button
                      disabled={!!isUpdatingStatus}
                      onClick={() => setShowCancelModal(true)}
                      className="px-3 py-2 bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-bold hover:bg-[#FCA5A5] transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel Order</span>
                    </button>
                  )}

                  {selectedOrder.status === "DELIVERED" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#DCFCE7] text-[#16A34A] rounded-xl text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Fulfilled &amp; Complete
                    </span>
                  )}
                </div>
              </div>

              {/* Order Cancellation Sub-Dialog */}
              {showCancelModal && (
                <div className="p-4 bg-[#FEF2F2] rounded-xl border border-[#FCA5A5] space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-[#DC2626] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Confirm Order Cancellation
                    </h5>
                    <button onClick={() => setShowCancelModal(false)} className="text-[#DC2626]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#991B1B]">
                    Cancelling will restore allocated inventory batches back to active stock. Please state the reason for compliance logs:
                  </p>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Customer requested cancellation, Duplicate order, Address undeliverable"
                    className="w-full px-3 py-2 bg-white rounded-lg text-xs font-medium border border-[#FCA5A5] focus:ring-2 focus:ring-[#DC2626] focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowCancelModal(false)}
                      className="px-3 py-1.5 bg-white text-[#5B6B65] text-xs font-bold rounded-lg border border-[#E4E7E9]"
                    >
                      Dismiss
                    </button>
                    <button
                      disabled={!!isUpdatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, "CANCELLED", cancelReason)}
                      className="px-4 py-1.5 bg-[#DC2626] text-white text-xs font-bold rounded-lg hover:bg-[#B91C1C] transition disabled:opacity-50"
                    >
                      {isUpdatingStatus === "CANCELLED" ? "Cancelling..." : "Confirm Cancellation"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
