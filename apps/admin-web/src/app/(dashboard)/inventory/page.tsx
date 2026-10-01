"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { formatDateIST, formatCurrency } from "../../../lib/utils";
import {
  AlertCircle,
  Plus,
  Search,
  RotateCcw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Package,
  Layers,
  History,
  ArrowUpDown,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"batches" | "ledger">("batches");

  // Filter States
  const [search, setSearch] = useState("");
  const [expiryDays, setExpiryDays] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [isBlockedFilter, setIsBlockedFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Data States
  const [batches, setBatches] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, totalPages: 1 });
  const [summary, setSummary] = useState<any>({
    totalBatches: 0,
    totalUnits: 0,
    expiring30Count: 0,
    expiredCount: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Stock Ledger Data State
  const [ledgerMovements, setLedgerMovements] = useState<any[]>([]);
  const [ledgerMeta, setLedgerMeta] = useState<any>({ total: 0, totalPages: 1 });
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Stock Adjustment Modal
  const [adjustBatch, setAdjustBatch] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"PURCHASE" | "DAMAGE" | "CORRECTION" | "EXPIRED">("PURCHASE");
  const [adjustReason, setAdjustReason] = useState("");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Load Batches with Filters
  const loadBatches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (search.trim()) params.set("search", search.trim());
      if (expiryDays !== "all") params.set("expiryDays", expiryDays);
      if (stockStatus !== "all") params.set("stockStatus", stockStatus);
      if (isBlockedFilter === "blocked") params.set("isBlocked", "true");
      if (isBlockedFilter === "active") params.set("isBlocked", "false");

      const res = await apiRequest(`/inventory/batches?${params.toString()}`);
      setBatches(res.data || []);
      setMeta(res.meta || { total: 0, totalPages: 1 });
      if (res.summary) setSummary(res.summary);
    } catch (err: any) {
      console.error("Failed to load inventory batches:", err);
      toast.error("Failed to fetch inventory batches", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Load Stock Ledger
  const loadLedger = async () => {
    setLedgerLoading(true);
    try {
      const res = await apiRequest(`/inventory/ledger?page=${ledgerPage}&limit=20`);
      setLedgerMovements(res.data || []);
      setLedgerMeta(res.meta || { total: 0, totalPages: 1 });
    } catch (err: any) {
      console.error("Failed to load stock ledger:", err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "batches") {
      loadBatches();
    } else {
      loadLedger();
    }
  }, [activeTab, page, limit, expiryDays, stockStatus, isBlockedFilter]);

  // Debounced search trigger (resets page to 1)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadBatches();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setExpiryDays("all");
    setStockStatus("all");
    setIsBlockedFilter("all");
    setPage(1);
  };

  // Toggle Batch Block/Quarantine
  const handleToggleBlock = async (batch: any) => {
    const nextState = !batch.isBlocked;
    try {
      await apiRequest(`/inventory/batches/${batch.id}/block`, {
        method: "PATCH",
        body: JSON.stringify({ isBlocked: nextState }),
      });
      toast.success(
        nextState
          ? `Batch #${batch.batchNumber} quarantined from dispensing`
          : `Batch #${batch.batchNumber} unblocked for sale`
      );
      loadBatches();
    } catch (err: any) {
      toast.error("Failed to update quarantine status", { description: err.message });
    }
  };

  // Commit Stock Adjustment
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustBatch) return;

    const qtyNumber = Number(adjustQty);
    if (isNaN(qtyNumber) || qtyNumber === 0) {
      toast.error("Please enter a valid non-zero adjustment quantity");
      return;
    }

    // Determine final signed quantity based on type
    const finalQuantity =
      adjustType === "DAMAGE" || adjustType === "EXPIRED"
        ? -Math.abs(qtyNumber)
        : adjustType === "PURCHASE"
        ? Math.abs(qtyNumber)
        : qtyNumber;

    setIsSubmittingAdjust(true);
    try {
      await apiRequest("/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          batchId: adjustBatch.id,
          variantId: adjustBatch.variantId,
          type: adjustType,
          quantity: finalQuantity,
          reason: adjustReason || `Manual ${adjustType} stock correction`,
        }),
      });

      toast.success("Stock adjustment ledger entry recorded!");
      setAdjustBatch(null);
      setAdjustQty("");
      setAdjustReason("");
      loadBatches();
      if (activeTab === "ledger") loadLedger();
    } catch (err: any) {
      toast.error("Failed to commit stock adjustment", { description: err.message });
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Days until expiry helper
  const getExpiryStatus = (expiryDateStr: string) => {
    const expDate = new Date(expiryDateStr);
    const now = new Date();
    const diffMs = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Expired ${Math.abs(diffDays)}d ago`,
        color: "bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]",
        isExpired: true,
      };
    }
    if (diffDays <= 30) {
      return {
        label: `Expiring in ${diffDays}d`,
        color: "bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]",
        isExpiringSoon: true,
      };
    }
    if (diffDays <= 90) {
      return {
        label: `Expiring in ${diffDays}d`,
        color: "bg-[#FEF9C3] text-[#CA8A04] border-[#FDE047]",
        isExpiringSoon: false,
      };
    }
    return {
      label: `${diffDays}d remaining`,
      color: "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]",
      isExpiringSoon: false,
    };
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    expiryDays !== "all" ||
    stockStatus !== "all" ||
    isBlockedFilter !== "all";

  return (
    <div className="flex-1 pb-16 bg-[#F8FAFC]">
      <Topbar breadcrumb="Stock Control" title="FEFO Batch Inventory & Stock Ledger" />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Top View Mode Switcher */}
        <div className="flex items-center justify-between border-b border-[#E4E7E9] pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("batches")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "batches"
                  ? "bg-[#0B4A3A] text-white shadow-sm"
                  : "bg-white text-[#5B6B65] border border-[#E4E7E9] hover:bg-[#F1F3F4]"
              }`}
            >
              <Layers className="w-4 h-4" />
              FEFO Batches Inventory ({meta.total || summary.totalBatches || 0})
            </button>

            <button
              onClick={() => setActiveTab("ledger")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === "ledger"
                  ? "bg-[#0B4A3A] text-white shadow-sm"
                  : "bg-white text-[#5B6B65] border border-[#E4E7E9] hover:bg-[#F1F3F4]"
              }`}
            >
              <History className="w-4 h-4" />
              Stock Movement Ledger
            </button>
          </div>

          {activeTab === "batches" && (
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5B6B65]">
              <span>FEFO Rule:</span>
              <span className="px-2.5 py-1 bg-[#DCFCE7] text-[#16A34A] rounded-lg font-bold">
                First-Expiry-First-Out Strict
              </span>
            </div>
          )}
        </div>

        {/* SUMMARY KPI CARDS (Interactive Quick Filters) */}
        {activeTab === "batches" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              onClick={() => {
                setExpiryDays("all");
                setStockStatus("all");
              }}
              className="bg-white p-4 rounded-2xl border border-[#E4E7E9] shadow-xs cursor-pointer hover:border-[#0B4A3A] transition"
            >
              <p className="text-[11px] font-bold text-[#5B6B65] uppercase">Total Active Batches</p>
              <h3 className="text-2xl font-black text-[#0F2A22] mt-1">{summary.totalBatches}</h3>
              <p className="text-[11px] text-[#5B6B65] mt-0.5">{summary.totalUnits} Total Units in Stock</p>
            </div>

            <div
              onClick={() => {
                setExpiryDays("30");
                setStockStatus("all");
              }}
              className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition ${
                expiryDays === "30"
                  ? "bg-[#FEF3C7] border-[#D97706]"
                  : "bg-white border-[#E4E7E9] hover:border-[#D97706]"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-[#D97706] uppercase">Expiring &le; 30 Days</p>
                <Clock className="w-4 h-4 text-[#D97706]" />
              </div>
              <h3 className="text-2xl font-black text-[#D97706] mt-1">{summary.expiring30Count}</h3>
              <p className="text-[11px] text-[#92400E] mt-0.5">Prioritize dispensing</p>
            </div>

            <div
              onClick={() => {
                setExpiryDays("expired");
                setStockStatus("all");
              }}
              className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition ${
                expiryDays === "expired"
                  ? "bg-[#FEE2E2] border-[#DC2626]"
                  : "bg-white border-[#E4E7E9] hover:border-[#DC2626]"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-[#DC2626] uppercase">Already Expired</p>
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              </div>
              <h3 className="text-2xl font-black text-[#DC2626] mt-1">{summary.expiredCount}</h3>
              <p className="text-[11px] text-[#991B1B] mt-0.5">Quarantine &amp; return to supplier</p>
            </div>

            <div
              onClick={() => {
                setStockStatus("low");
                setExpiryDays("all");
              }}
              className={`p-4 rounded-2xl border shadow-xs cursor-pointer transition ${
                stockStatus === "low"
                  ? "bg-[#FFEDD5] border-[#EA580C]"
                  : "bg-white border-[#E4E7E9] hover:border-[#EA580C]"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-[#EA580C] uppercase">Low Stock (&le; 10 units)</p>
                <AlertCircle className="w-4 h-4 text-[#EA580C]" />
              </div>
              <h3 className="text-2xl font-black text-[#EA580C] mt-1">{summary.lowStockCount}</h3>
              <p className="text-[11px] text-[#9A3412] mt-0.5">Reorder required</p>
            </div>
          </div>
        )}

        {/* BATCHES VIEW: FULL CONTROLS & TABLE */}
        {activeTab === "batches" ? (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="w-4 h-4 text-[#5B6B65] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search medicine name, brand, SKU, or batch number..."
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

                {/* Expiry Dropdown/Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5B6B65] whitespace-nowrap">Expiry:</span>
                  <select
                    value={expiryDays}
                    onChange={(e) => {
                      setExpiryDays(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] border border-transparent focus:border-[#0B4A3A] focus:outline-none"
                  >
                    <option value="all">All Expiries</option>
                    <option value="30">Expiring &le; 30 Days</option>
                    <option value="60">Expiring &le; 60 Days</option>
                    <option value="90">Expiring &le; 90 Days</option>
                    <option value="180">Expiring &le; 180 Days (6 Mos)</option>
                    <option value="expired">Already Expired</option>
                  </select>
                </div>

                {/* Stock Level Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5B6B65] whitespace-nowrap">Stock:</span>
                  <select
                    value={stockStatus}
                    onChange={(e) => {
                      setStockStatus(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] border border-transparent focus:border-[#0B4A3A] focus:outline-none"
                  >
                    <option value="all">All Quantities</option>
                    <option value="in_stock">In Stock (&gt; 10 units)</option>
                    <option value="low">Low Stock (1 - 10 units)</option>
                    <option value="out">Out of Stock (0 units)</option>
                  </select>
                </div>

                {/* Blocked / Quarantine Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5B6B65] whitespace-nowrap">Status:</span>
                  <select
                    value={isBlockedFilter}
                    onChange={(e) => {
                      setIsBlockedFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] border border-transparent focus:border-[#0B4A3A] focus:outline-none"
                  >
                    <option value="all">All Batches</option>
                    <option value="active">Active for Dispensing</option>
                    <option value="blocked">Quarantined / Blocked</option>
                  </select>
                </div>

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-2 bg-[#F1F3F4] text-[#DC2626] rounded-xl text-xs font-bold hover:bg-[#FEE2E2] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                  </button>
                )}
              </div>

              {/* Quick Pills for Active Filter Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E4E7E9] text-xs">
                <span className="text-[11px] font-bold text-[#5B6B65]">Quick Filters:</span>
                {[
                  { label: "All Batches", key: "all" },
                  { label: "Expiring in 30d", key: "30" },
                  { label: "Expiring in 60d", key: "60" },
                  { label: "Expiring in 90d", key: "90" },
                  { label: "Expired", key: "expired" },
                ].map((pill) => (
                  <button
                    key={pill.key}
                    onClick={() => {
                      setExpiryDays(pill.key);
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      expiryDays === pill.key
                        ? "bg-[#0B4A3A] text-white shadow-xs"
                        : "bg-[#F1F3F4] text-[#5B6B65] hover:bg-[#E4E7E9]"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Batches Table */}
            <div className="bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F5F6F7] border-b text-xs font-bold text-[#5B6B65] uppercase">
                    <tr>
                      <th className="py-3 px-6">Medicine &amp; Brand</th>
                      <th className="py-3 px-4">Batch Number</th>
                      <th className="py-3 px-4">Expiry Date (FEFO)</th>
                      <th className="py-3 px-4">Sellable Stock</th>
                      <th className="py-3 px-4">Unit Cost (₹)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7E9]">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-[#5B6B65]">
                          Loading FEFO inventory batches...
                        </td>
                      </tr>
                    ) : batches.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[#5B6B65]">
                          <Package className="w-10 h-10 opacity-30 mx-auto mb-2" />
                          <p className="font-bold text-sm text-[#0F2A22]">No Matching Batches Found</p>
                          <p className="text-xs mt-1">Try relaxing the search keyword or expiry filters.</p>
                          {hasActiveFilters && (
                            <button
                              onClick={handleResetFilters}
                              className="mt-3 px-4 py-1.5 bg-[#0B4A3A] text-white text-xs font-bold rounded-xl"
                            >
                              Clear All Filters
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      batches.map((b) => {
                        const expStatus = getExpiryStatus(b.expiryDate);
                        const isLowStock = b.quantity > 0 && b.quantity <= 10;
                        const isOutOfStock = b.quantity <= 0;

                        return (
                          <tr
                            key={b.id}
                            className={`hover:bg-[#F9FAFB] transition ${
                              b.isBlocked ? "bg-[#FEF2F2]/40" : ""
                            }`}
                          >
                            {/* Medicine details */}
                            <td className="py-3.5 px-6">
                              <p className="font-bold text-sm text-[#0F2A22]">
                                {b.variant?.product?.name || "Medicine Item"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#5B6B65]">
                                {b.variant?.product?.brand && (
                                  <span className="font-semibold text-[#0B4A3A]">
                                    {b.variant.product.brand}
                                  </span>
                                )}
                                <span>&bull;</span>
                                <span>{b.variant?.name || "Standard Pack"}</span>
                              </div>
                            </td>

                            {/* Batch Number */}
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 bg-[#F1F3F4] text-[#0F2A22] rounded-md font-mono text-xs font-bold">
                                {b.batchNumber}
                              </span>
                            </td>

                            {/* Expiry Date (FEFO) */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <span className="font-mono text-xs font-bold text-[#0F2A22]">
                                  {new Date(b.expiryDate).toLocaleDateString("en-IN", {
                                    month: "short",
                                    year: "numeric",
                                    day: "numeric",
                                  })}
                                </span>
                                <div>
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${expStatus.color}`}
                                  >
                                    {expStatus.label}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Stock Quantity */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                                  isOutOfStock
                                    ? "bg-[#FEE2E2] text-[#DC2626]"
                                    : isLowStock
                                    ? "bg-[#FEF3C7] text-[#D97706]"
                                    : "bg-[#DCFCE7] text-[#16A34A]"
                                }`}
                              >
                                {b.quantity} units
                              </span>
                            </td>

                            {/* Unit Cost */}
                            <td className="py-3.5 px-4 text-xs font-bold text-[#0F2A22]">
                              ₹{Number(b.costPrice).toFixed(2)}
                            </td>

                            {/* Quarantine Status */}
                            <td className="py-3.5 px-4">
                              {b.isBlocked ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626]">
                                  <Lock className="w-3 h-3" /> Quarantined
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A]">
                                  <CheckCircle2 className="w-3 h-3" /> Sellable
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBlock(b)}
                                  className={`p-1.5 rounded-lg border transition ${
                                    b.isBlocked
                                      ? "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC] hover:bg-[#BBF7D0]"
                                      : "bg-[#F1F3F4] text-[#DC2626] border-[#E4E7E9] hover:bg-[#FEE2E2]"
                                  }`}
                                  title={b.isBlocked ? "Unblock batch for sale" : "Quarantine batch (recall/damage)"}
                                >
                                  {b.isBlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdjustBatch(b);
                                    setAdjustQty("");
                                    setAdjustReason("");
                                    setAdjustType("PURCHASE");
                                  }}
                                  className="px-3 py-1.5 bg-[#0B4A3A] text-white rounded-lg text-xs font-bold hover:bg-[#073629] transition shadow-xs"
                                >
                                  Adjust
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

              {/* Pagination Bar */}
              {meta.totalPages > 1 && (
                <div className="p-4 border-t border-[#E4E7E9] flex items-center justify-between text-xs text-[#5B6B65]">
                  <span>
                    Showing {batches.length} of {meta.total} total batches (Page {meta.page} of {meta.totalPages})
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 bg-[#F1F3F4] rounded-lg font-bold disabled:opacity-40 hover:bg-[#E4E7E9] flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>
                    <button
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                      className="px-3 py-1.5 bg-[#F1F3F4] rounded-lg font-bold disabled:opacity-40 hover:bg-[#E4E7E9] flex items-center gap-1"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STOCK MOVEMENT LEDGER VIEW */
          <div className="bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E4E7E9] bg-[#FAFAFA] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#0F2A22]">Stock Adjustment &amp; Movement Audit Ledger</h3>
                <p className="text-xs text-[#5B6B65]">
                  Immutable ledger tracking purchases, sales, damage write-offs, and physical audits.
                </p>
              </div>
              <button
                onClick={loadLedger}
                className="px-3 py-1.5 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] hover:bg-[#E4E7E9] flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Refresh Ledger
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F5F6F7] border-b text-xs font-bold text-[#5B6B65] uppercase">
                  <tr>
                    <th className="py-3 px-6">Timestamp (IST)</th>
                    <th className="py-3 px-4">Medicine &amp; Batch</th>
                    <th className="py-3 px-4">Movement Type</th>
                    <th className="py-3 px-4">Quantity Change</th>
                    <th className="py-3 px-4">Stock Transition</th>
                    <th className="py-3 px-4">Audit Reason</th>
                    <th className="py-3 px-4">Staff Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7E9]">
                  {ledgerLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#5B6B65]">
                        Loading stock movements ledger...
                      </td>
                    </tr>
                  ) : ledgerMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#5B6B65]">
                        <History className="w-10 h-10 opacity-30 mx-auto mb-2" />
                        <p className="font-bold text-sm text-[#0F2A22]">No Stock Adjustments Recorded</p>
                        <p className="text-xs mt-1">Stock adjustments made on batches will appear here.</p>
                      </td>
                    </tr>
                  ) : (
                    ledgerMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-[#F9FAFB] transition text-xs">
                        <td className="py-3 px-6 font-mono text-[#5B6B65]">
                          {formatDateIST(m.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-[#0F2A22]">{m.variant?.product?.name}</p>
                          <span className="font-mono text-[11px] text-[#5B6B65]">
                            Batch #{m.batch?.batchNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.type === "PURCHASE" || m.type === "RETURN_RESTOCK"
                                ? "bg-[#DCFCE7] text-[#16A34A]"
                                : m.type === "DAMAGE" || m.type === "EXPIRED"
                                ? "bg-[#FEE2E2] text-[#DC2626]"
                                : "bg-[#F1F3F4] text-[#0F2A22]"
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold">
                          <span
                            className={
                              m.type === "DAMAGE" || m.type === "EXPIRED"
                                ? "text-[#DC2626]"
                                : "text-[#16A34A]"
                            }
                          >
                            {m.type === "DAMAGE" || m.type === "EXPIRED" ? "-" : "+"}
                            {m.quantity} units
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {m.previousStock} &rarr;{" "}
                          <span className="font-bold text-[#0F2A22]">{m.newStock} units</span>
                        </td>
                        <td className="py-3 px-4 text-[#5B6B65] max-w-xs truncate">
                          {m.reason || "Manual inventory reconciliation"}
                        </td>
                        <td className="py-3 px-4 text-[#0F2A22] font-medium">
                          {m.createdBy?.firstName
                            ? `${m.createdBy.firstName} ${m.createdBy.lastName || ""}`
                            : "System"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {ledgerMeta.totalPages > 1 && (
              <div className="p-4 border-t border-[#E4E7E9] flex items-center justify-between text-xs text-[#5B6B65]">
                <span>
                  Showing page {ledgerMeta.page} of {ledgerMeta.totalPages} ({ledgerMeta.total} records)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={ledgerPage <= 1}
                    onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-[#F1F3F4] rounded-lg font-bold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={ledgerPage >= ledgerMeta.totalPages}
                    onClick={() => setLedgerPage((p) => Math.min(ledgerMeta.totalPages, p + 1))}
                    className="px-3 py-1.5 bg-[#F1F3F4] rounded-lg font-bold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADJUST STOCK MODAL */}
        {adjustBatch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#E4E7E9]">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base text-[#0F2A22]">
                  Adjust Stock: #{adjustBatch.batchNumber}
                </h3>
                <button onClick={() => setAdjustBatch(null)} className="text-[#5B6B65] hover:text-[#0F2A22]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-xl text-xs space-y-1">
                <p className="font-bold text-[#0F2A22]">{adjustBatch.variant?.product?.name}</p>
                <p className="text-[#5B6B65]">
                  Current on-hand: <strong className="text-[#0F2A22]">{adjustBatch.quantity} units</strong> &bull;
                  Expiry:{" "}
                  <strong>{new Date(adjustBatch.expiryDate).toLocaleDateString()}</strong>
                </p>
              </div>

              <form onSubmit={handleAdjustStock} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Adjustment Type</label>
                  <select
                    value={adjustType}
                    onChange={(e: any) => setAdjustType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22]"
                  >
                    <option value="PURCHASE">Stock Purchase / Restock (+)</option>
                    <option value="CORRECTION">Audit Count Correction (+/-)</option>
                    <option value="DAMAGE">Damaged / Broken in Transit (-)</option>
                    <option value="EXPIRED">Expired Batch Write-off / Return (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">
                    Units to {adjustType === "DAMAGE" || adjustType === "EXPIRED" ? "Deduct" : "Add"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-4 py-2 bg-[#F1F3F4] rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#0B4A3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Audit Ledger Reason</label>
                  <input
                    type="text"
                    required
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. Physical stock count check, Supplier invoice #481"
                    className="w-full px-4 py-2 bg-[#F1F3F4] rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-[#0B4A3A]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setAdjustBatch(null)}
                    className="px-4 py-2 text-xs font-bold text-[#5B6B65] hover:bg-[#F1F3F4] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdjust}
                    className="px-4 py-2 bg-[#0B4A3A] text-white rounded-xl text-xs font-bold shadow hover:bg-[#073629] transition disabled:opacity-50"
                  >
                    {isSubmittingAdjust ? "Recording..." : "Record Stock Adjustment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
