"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { Shield, Plus } from "lucide-react";
import { toast } from "sonner";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [sRes, rRes] = await Promise.all([
          apiRequest("/staff/users"),
          apiRequest("/staff/roles"),
        ]);
        setStaff(sRes.data || []);
        setRoles(rRes.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Security" title="Staff Members & RBAC Roles" />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F6F7] border-b text-xs font-bold text-[#5B6B65] uppercase">
              <tr>
                <th className="py-3 px-6">Staff Member</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">2FA Status</th>
                <th className="py-3 px-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7E9]">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-[#F1F3F4] transition">
                  <td className="py-3 px-6">
                    <p className="font-bold text-[#0F2A22]">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-[#5B6B65]">{s.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-[#F1F3F4] rounded-lg text-xs font-bold text-[hsl(var(--primary))]">
                      {s.role?.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold">
                    {s.isTwoFactorEnabled ? (
                      <span className="text-[#16A34A]">Hardware 2FA Active</span>
                    ) : (
                      <span className="text-[#F59E0B]">Pending Setup</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#16A34A]">
                      Active
                    </span>
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
