"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import {
  BarChart3,
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState("30d");

  const loadData = async () => {
    try {
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        apiRequest("/dashboard/stats"),
        apiRequest("/products"),
        apiRequest("/orders"),
      ]);
      setStats(statsRes.data || {});
      setProducts(productsRes.data?.products || []);
      setOrders(ordersRes.data?.orders || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalRevenue = stats?.revenue || 0;
  const totalOrders = stats?.totalOrders || 0;
  const aov = stats?.aov || 0;
  const newCustomers = stats?.newCustomers || 0;

  // Derive top products by computing from available data
  const topProducts = products
    .slice(0, 5)
    .map((p: any) => ({
      name: p.name,
      price: Number(p.price || 0),
      stock: p.inventory?.[0]?.quantity || 0,
    }));

  // Order status breakdown
  const statusBreakdown = orders.reduce((acc: Record<string, number>, o: any) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const STATUS_COLORS: Record<string, string> = {
    CONFIRMED: "bg-[#DCFCE7] text-[#16A34A]",
    PENDING: "bg-[#FEF3C7] text-[#D97706]",
    PROCESSING: "bg-[#DBEAFE] text-[#2563EB]",
    SHIPPED: "bg-[#E0E7FF] text-[#4F46E5]",
    DELIVERED: "bg-[#D1FAE5] text-[#059669]",
    CANCELLED: "bg-[#FEE2E2] text-[#DC2626]",
  };

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Analytics" title="Reports & Insights" />

      <div className="p-8 max-w-6xl mx-auto space-y-6">
        {/* Date Range Filter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#5B6B65]" />
            <span className="text-xs font-bold text-[#5B6B65]">Period:</span>
            {["7d", "30d", "90d", "1y"].map((d) => (
              <button
                key={d}
                onClick={() => setDateRange(d)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  dateRange === d
                    ? "bg-[#0B4A3A] text-white"
                    : "bg-white text-[#5B6B65] border border-[#E4E7E9] hover:bg-[#F4F6F5]"
                }`}
              >
                {d === "7d" ? "7 Days" : d === "30d" ? "30 Days" : d === "90d" ? "90 Days" : "1 Year"}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#DCFCE7] flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-[#16A34A]" />
              </div>
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#16A34A]">
                <ArrowUpRight className="w-3 h-3" /> 12.5%
              </span>
            </div>
            <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Revenue</p>
            <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">₹{totalRevenue.toLocaleString("en-IN")}</h4>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FAF3EA] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#0B4A3A]" />
              </div>
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#16A34A]">
                <ArrowUpRight className="w-3 h-3" /> 8.3%
              </span>
            </div>
            <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Orders</p>
            <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">{totalOrders}</h4>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E0E7FF] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#4F46E5]" />
              </div>
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#DC2626]">
                <ArrowDownRight className="w-3 h-3" /> 2.1%
              </span>
            </div>
            <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Avg. Order Value</p>
            <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">₹{aov.toLocaleString("en-IN")}</h4>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#D97706]" />
              </div>
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#16A34A]">
                <ArrowUpRight className="w-3 h-3" /> 5.0%
              </span>
            </div>
            <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">New Customers</p>
            <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">{newCustomers}</h4>
          </div>
        </div>

        {/* Two-Column: Order Status + Top Products */}
        <div className="grid grid-cols-12 gap-6">
          {/* Order Status Breakdown */}
          <div className="col-span-5 bg-white p-6 rounded-2xl border border-[#E4E7E9] shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-[#0F2A22]">Order Status Breakdown</h3>
              <p className="text-xs text-[#5B6B65] mt-0.5">Distribution across fulfillment pipeline</p>
            </div>

            <div className="space-y-3">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const percent = totalOrders > 0 ? Math.round(((count as number) / totalOrders) * 100) : 0;
                const colorClass = STATUS_COLORS[status] || "bg-[#F1F3F4] text-[#5B6B65]";
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colorClass}`}>
                        {status}
                      </span>
                      <span className="text-xs font-bold text-[#0F2A22]">{count as number} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[#F1F3F4] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B4A3A] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {Object.keys(statusBreakdown).length === 0 && (
                <p className="text-xs text-[#5B6B65] text-center py-4">No order data available</p>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="col-span-7 bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E4E7E9]">
              <h3 className="font-bold text-[#0F2A22]">Top Products by Catalog</h3>
              <p className="text-xs text-[#5B6B65] mt-0.5">Leading medicines in your inventory</p>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[#F9FAFB] text-[10px] font-extrabold text-[#5B6B65] uppercase tracking-wider border-b border-[#E4E7E9]">
              <div className="col-span-1">#</div>
              <div className="col-span-5">Product</div>
              <div className="col-span-3 text-right">Price</div>
              <div className="col-span-3 text-right">Stock</div>
            </div>

            <div className="divide-y divide-[#E4E7E9]">
              {topProducts.map((p, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-[#F9FAFB] transition">
                  <div className="col-span-1">
                    <span className="w-6 h-6 rounded-full bg-[#FAF3EA] flex items-center justify-center text-[10px] font-black text-[#0B4A3A]">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="col-span-5">
                    <p className="text-xs font-bold text-[#0F2A22] truncate">{p.name}</p>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="text-xs font-black text-[#0B4A3A]">₹{p.price.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className={`text-xs font-bold ${p.stock < 10 ? "text-[#DC2626]" : "text-[#0F2A22]"}`}>
                      {p.stock} units
                    </span>
                  </div>
                </div>
              ))}

              {topProducts.length === 0 && (
                <div className="p-8 text-center text-xs text-[#5B6B65]">
                  No product data available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inventory Specific Metrics */}
        <div className="grid grid-cols-2 gap-6">

          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Low Stock Alerts</p>
              <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">{stats?.lowStockCount || 0}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FAF3EA] flex items-center justify-center text-[#0B4A3A]">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Expiring Batches</p>
              <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">{stats?.expiringBatchesCount || 0}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FEE2E2] flex items-center justify-center text-[#DC2626]">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
