"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { formatCurrency } from "../../../lib/utils";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Users,
  AlertTriangle,
  RotateCcw,
  Clock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [donutData, setDonutData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, chartRes, donutRes, prodRes] = await Promise.all([
          apiRequest("/dashboard/stats"),
          apiRequest("/dashboard/sales-chart?days=30"),
          apiRequest("/dashboard/status-donut"),
          apiRequest("/dashboard/top-products"),
        ]);
        setStats(statsRes.data);
        setChartData(chartRes.data || []);
        setDonutData(donutRes.data || []);
        setTopProducts(prodRes.data || []);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const COLORS = ["#0B4A3A", "#10B981", "#F5C043", "#3B82F6", "#DC2626", "#8B5CF6"];

  return (
    <div className="flex-1 pb-16">
      <Topbar
        breadcrumb="Dashboard"
        title="Store Overview & Analytics"
        primaryAction={{ label: "Add Product +", onClick: () => (window.location.href = "/products/add") }}
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* KPI CARDS */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase">Total Revenue (30d)</p>
              <h3 className="text-2xl font-extrabold text-[#0F2A22] mt-1">
                {stats ? formatCurrency(stats.revenue) : "₹0"}
              </h3>
              <p className="text-xs text-[#16A34A] font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                {stats?.revenueGrowth !== undefined ? `${stats.revenueGrowth >= 0 ? "+" : ""}${stats.revenueGrowth}% vs prior period` : "Live store data"}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#F1F3F4] flex items-center justify-center text-[hsl(var(--primary))]">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase">Total Orders</p>
              <h3 className="text-2xl font-extrabold text-[#0F2A22] mt-1">{stats?.totalOrders || 0}</h3>
              <p className="text-xs text-[#5B6B65] font-semibold mt-1">AOV: {formatCurrency(stats?.aov || 0)}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#F1F3F4] flex items-center justify-center text-[hsl(var(--primary))]">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase">Expiring Batches (30d)</p>
              <h3 className="text-2xl font-extrabold text-[#F59E0B] mt-1">{stats?.expiringBatchesCount || 0}</h3>
              <p className="text-xs text-[#5B6B65] font-semibold mt-1">Requires distributor return</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase">Low Stock Alerts</p>
              <h3 className="text-2xl font-extrabold text-[#DC2626] mt-1">{stats?.lowStockCount || 0}</h3>
              <p className="text-xs text-[#DC2626] font-semibold mt-1">Batches below threshold</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] flex items-center justify-center text-[#DC2626]">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white p-6 rounded-2xl border border-[#E4E7E9] shadow-sm">
            <h3 className="text-base font-bold text-[#0F2A22] mb-6">Revenue & Orders (Last 30 Days)</h3>
            <div className="h-72">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E7E9" />
                    <XAxis dataKey="date" stroke="#5B6B65" fontSize={11} tickLine={false} />
                    <YAxis stroke="#5B6B65" fontSize={11} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#0B4A3A" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#5B6B65]">
                  No sales recorded in the selected period.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E4E7E9] shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-[#0F2A22] mb-4">Orders by Status</h3>
            <div className="flex-1 flex items-center justify-center h-56">
              {donutData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {donutData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-[#5B6B65]">No order status data available.</div>
              )}
            </div>
            {donutData.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                {donutData.slice(0, 4).map((d, i) => (
                  <div key={d.status} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-[#5B6B65] truncate">{d.status}: {d.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TOP PRODUCTS */}
        <div className="bg-white rounded-2xl border border-[#E4E7E9] shadow-sm p-6">
          <h3 className="text-base font-bold text-[#0F2A22] mb-4">Top Fast-Moving Medicines</h3>
          <div className="overflow-x-auto">
            {topProducts.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E4E7E9] text-xs font-bold text-[#5B6B65] uppercase">
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Units Sold</th>
                    <th className="pb-3">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7E9]">
                  {topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#F1F3F4] transition">
                      <td className="py-3 font-semibold text-[#0F2A22]">{p.name}</td>
                      <td className="py-3 text-[#5B6B65]">{p.unitsSold} units</td>
                      <td className="py-3 font-bold text-[#0F2A22]">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-[#5B6B65] py-4">No product sales recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
