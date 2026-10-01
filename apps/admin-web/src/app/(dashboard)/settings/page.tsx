"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { SectionCard } from "../../../components/common/SectionCard";
import { apiRequest } from "../../../lib/api-client";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [freeShipping, setFreeShipping] = useState("");
  const [isCodEnabled, setIsCodEnabled] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [hRes, sRes] = await Promise.all([
          apiRequest("/settings/health"),
          apiRequest("/settings"),
        ]);
        setHealth(hRes.data);
        if (sRes.data?.deliveryCharge !== undefined) setDeliveryCharge(String(sRes.data.deliveryCharge));
        if (sRes.data?.freeShippingThreshold !== undefined) setFreeShipping(String(sRes.data.freeShippingThreshold));
        if (sRes.data?.isCodEnabled !== undefined) setIsCodEnabled(Boolean(sRes.data.isCodEnabled));
        if (sRes.data?.isMaintenanceMode !== undefined) setIsMaintenanceMode(Boolean(sRes.data.isMaintenanceMode));
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await apiRequest("/settings", {
        method: "PUT",
        body: JSON.stringify({
          deliveryCharge: Number(deliveryCharge),
          freeShippingThreshold: Number(freeShipping),
          isCodEnabled,
          isMaintenanceMode,
        }),
      });
      toast.success("Settings saved and revalidated on storefront!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleManualRevalidate = async () => {
    setIsSyncing(true);
    try {
      await apiRequest("/settings/revalidate-now", { method: "POST" });
      toast.success("Storefront ISR pages immediately revalidated!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="System" title="Main Site Control & Store Settings" />

      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Health Panel */}
        <SectionCard title="Storefront Connection Health">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-[#F1F3F4] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5B6B65]">Shared PostgreSQL DB</p>
                <p className="font-bold text-[#16A34A]">{health?.services?.database || "CONNECTED"}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
            </div>

            <div className="p-4 bg-[#F1F3F4] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5B6B65]">Redis Bus & Queues</p>
                <p className="font-bold text-[#16A34A]">{health?.services?.redis || "CONNECTED"}</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
            </div>

            <div className="p-4 bg-[#F1F3F4] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5B6B65]">Main Storefront ISR</p>
                <p className="font-bold text-[#16A34A]">{health?.services?.mainSiteStatus || "ONLINE"}</p>
              </div>
              <button
                onClick={handleManualRevalidate}
                disabled={isSyncing}
                className="px-3 py-1 bg-[hsl(var(--primary))] text-white rounded-lg text-xs font-bold hover:opacity-90 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} /> Sync Now
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Store Settings Form */}
        <SectionCard title="Shipping & Store Configuration">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">Standard Delivery Charge (₹)</label>
                <input
                  type="number"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  value={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-sm font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-8 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0F2A22]">
                <input
                  type="checkbox"
                  checked={isCodEnabled}
                  onChange={(e) => setIsCodEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[hsl(var(--primary))]"
                />
                <span>Enable Cash On Delivery (COD)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#DC2626]">
                <input
                  type="checkbox"
                  checked={isMaintenanceMode}
                  onChange={(e) => setIsMaintenanceMode(e.target.checked)}
                  className="w-4 h-4 rounded text-[#DC2626]"
                />
                <span>Storefront Maintenance Mode</span>
              </label>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2.5 bg-[hsl(var(--primary))] text-white rounded-xl text-xs font-bold shadow hover:opacity-90 transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
