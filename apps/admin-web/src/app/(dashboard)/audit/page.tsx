"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { formatDateIST } from "../../../lib/utils";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await apiRequest("/audit");
        setLogs(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Security" title="System Audit Logs & Mutation History" />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F6F7] border-b text-xs font-bold text-[#5B6B65] uppercase">
              <tr>
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7E9]">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-[#F1F3F4] transition">
                  <td className="py-3 px-6 text-xs text-[#5B6B65] font-mono">{formatDateIST(l.createdAt)}</td>
                  <td className="py-3 px-4 text-xs font-bold text-[#0F2A22]">{l.adminUser?.email || "System"}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#E4E7E9] text-[#0F2A22]">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-[#0F2A22]">{l.entity}</td>
                  <td className="py-3 px-4 text-xs font-mono text-[#5B6B65]">{l.ipAddress || "127.0.0.1"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
