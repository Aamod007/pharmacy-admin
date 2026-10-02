"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { formatCurrency, formatDateIST } from "../../../lib/utils";
import { Search, Eye, Download, Shield } from "lucide-react";
import { toast } from "sonner";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const query = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
        const res = await apiRequest(`/orders${query}`);
        setOrders(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus, note: `Status changed to ${newStatus} by admin` }),
      });
      toast.success("Order status updated to " + newStatus);
      const res = await apiRequest(`/orders`);
      setOrders(res.data || []);
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error("Failed to update status", { description: err.message });
    }
  };

  const handleDownloadInvoice = (orderId: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || "/api/v1"}/invoices/${orderId}/pdf`, "_blank");
  };

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Fulfillment" title="Orders Manager" />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Status tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["ALL", "PLACED", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === s ? "bg-[hsl(var(--primary))] text-white shadow" : "bg-white text-[#5B6B65] border border-[#E4E7E9]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F6F7] border-b border-[#E4E7E9] text-xs font-bold text-[#5B6B65] uppercase">
              <tr>
                <th className="py-3 px-6">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7E9]">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-[#F1F3F4] transition">
                  <td className="py-3 px-6 font-bold text-[#0F2A22]">
                    {o.orderNumber}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[#0F2A22]">{o.user?.name}</p>
                    <p className="text-xs text-[#5B6B65]">{o.user?.phone}</p>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#5B6B65]">{formatDateIST(o.createdAt)}</td>
                  <td className="py-3 px-4 text-xs font-bold text-[#0F2A22]">{o.paymentMethod}</td>
                  <td className="py-3 px-4 font-bold text-[#0F2A22]">{formatCurrency(o.totalAmount)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#16A34A]">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrder(o)}
                      className="p-1.5 bg-white border border-[#E4E7E9] rounded-lg hover:bg-[#F1F3F4]"
                    >
                      <Eye className="w-4 h-4 text-[#5B6B65]" />
                    </button>
                    <button
                      onClick={() => handleDownloadInvoice(o.id)}
                      className="p-1.5 bg-white border border-[#E4E7E9] rounded-lg hover:bg-[#F1F3F4]"
                      title="Download GST Invoice"
                    >
                      <Download className="w-4 h-4 text-[#5B6B65]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal for Order Inspection & State Machine Update */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-lg text-[#0F2A22]">Order Details: {selectedOrder.orderNumber}</h3>
                <button onClick={() => setSelectedOrder(null)} className="text-[#5B6B65]">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#5B6B65]">Customer:</span>
                  <p className="font-bold text-sm text-[#0F2A22]">{selectedOrder.user?.name}</p>
                  <p>{selectedOrder.user?.email} | {selectedOrder.user?.phone}</p>
                </div>
                <div>
                  <span className="text-[#5B6B65]">Delivery Address:</span>
                  <p className="font-medium text-[#0F2A22]">{selectedOrder.address?.addressLine1}, {selectedOrder.address?.city} - {selectedOrder.address?.pincode}</p>
                </div>
              </div>

              <div className="p-3 bg-[#F1F3F4] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#5B6B65]">Current Status:</span>
                  <p className="font-bold text-[#0F2A22]">{selectedOrder.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedOrder.status === "PLACED" && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, "CONFIRMED")}
                      className="px-3 py-1.5 bg-[hsl(var(--primary))] text-white rounded-lg text-xs font-bold"
                    >
                      Confirm Order
                    </button>
                  )}
                  {selectedOrder.status === "CONFIRMED" && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, "PACKED")}
                      className="px-3 py-1.5 bg-[hsl(var(--primary))] text-white rounded-lg text-xs font-bold"
                    >
                      Mark Packed
                    </button>
                  )}
                  {selectedOrder.status === "PACKED" && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, "SHIPPED")}
                      className="px-3 py-1.5 bg-[hsl(var(--primary))] text-white rounded-lg text-xs font-bold"
                    >
                      Mark Shipped
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
