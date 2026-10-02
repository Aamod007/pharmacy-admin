"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { formatDateIST } from "../../../lib/utils";
import { Search, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const loadCustomers = async () => {
    const res = await apiRequest(`/customers?search=${search}`);
    setCustomers(res.data || []);
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleToggleStatus = async (id: string, current: boolean) => {
    try {
      await apiRequest(`/customers/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !current }),
      });
      toast.success(`Customer account ${!current ? "activated" : "suspended"}`);
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Users" title="Customer Accounts & Medical History" />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#5B6B65] absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone number..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#E4E7E9] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
        </div>

        <div className="bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F6F7] border-b text-xs font-bold text-[#5B6B65] uppercase">
              <tr>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Registered On</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7E9]">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#F1F3F4] transition">
                  <td className="py-3 px-6 font-bold text-[#0F2A22]">{c.name}</td>
                  <td className="py-3 px-4 text-xs text-[#5B6B65]">
                    <p>{c.email}</p>
                    <p>{c.phone}</p>
                  </td>
                  <td className="py-3 px-4 font-semibold text-xs">{c._count?.orders || 0}</td>
                  <td className="py-3 px-4 text-xs text-[#5B6B65]">{formatDateIST(c.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.isActive ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#FEE2E2] text-[#DC2626]"
                      }`}
                    >
                      {c.isActive ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleStatus(c.id, c.isActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        c.isActive ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#DCFCE7] text-[#16A34A]"
                      }`}
                    >
                      {c.isActive ? "Block User" : "Unblock"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
