"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { formatCurrency } from "../../../lib/utils";
import { Search, Plus, Filter, Shield, Package, AlertTriangle, Layers } from "lucide-react";

export default function ProductsListPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await apiRequest("/categories");
        setCategories(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        let url = `/products?search=${encodeURIComponent(search)}`;
        if (selectedCategory) {
          url += `&categoryId=${encodeURIComponent(selectedCategory)}`;
        }
        const res = await apiRequest(url);
        setProducts(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [search, selectedCategory]);

  const filteredProducts = products.filter((p) => {
    if (stockFilter === "LOW") return p.totalStock > 0 && p.totalStock <= 15;
    if (stockFilter === "OUT") return p.totalStock === 0;
    if (stockFilter === "IN") return p.totalStock > 15;
    return true;
  });

  return (
    <div className="flex-1 pb-16">
      <Topbar
        breadcrumb="Inventory & Catalog"
        title="Medicines & Stock Management"
        primaryAction={{ label: "Add Medicine +", onClick: () => (window.location.href = "/products/add") }}
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Search & Pharmacy Filters Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E4E7E9] shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <Search className="w-4 h-4 text-[#5B6B65] absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by medicine name, salt composition, SKU..."
              className="w-full pl-10 pr-4 py-2 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[hsl(var(--primary))]"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] focus:outline-none"
            >
              <option value="">All Medicine Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Stock status filter */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-bold text-[#0F2A22] focus:outline-none"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN">In Stock (&gt;15)</option>
              <option value="LOW">Low Stock (&le;15)</option>
              <option value="OUT">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {/* Medicines Table */}
        <div className="bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F6F7] border-b border-[#E4E7E9] text-xs font-bold text-[#5B6B65] uppercase">
              <tr>
                <th className="py-3 px-6">Medicine / Formulation</th>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4">Therapeutic Category</th>
                <th className="py-3 px-4">Retail Price</th>
                <th className="py-3 px-4">Stock In Hand</th>
                <th className="py-3 px-4">Rx Schedule</th>
                <th className="py-3 px-4">Catalog Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7E9]">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#F9FAFB] transition cursor-pointer">
                  <td className="py-3.5 px-6 flex items-center gap-3">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 rounded-xl object-cover bg-gray-100 border border-[#E4E7E9] flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#FAF3EA] border border-[#E4E7E9] flex items-center justify-center text-[#0B4A3A] flex-shrink-0">
                        <Package className="w-5 h-5 opacity-70" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-[#0F2A22] text-sm">{p.name}</p>
                      <p className="text-xs text-[#5B6B65]">{p.brand}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#5B6B65] font-semibold">{p.sku}</td>
                  <td className="py-3.5 px-4 text-xs font-bold text-[#0B4A3A]">{p.category}</td>
                  <td className="py-3.5 px-4 font-bold text-[#0F2A22]">{formatCurrency(p.price)}</td>
                  <td className="py-3.5 px-4">
                    {p.totalStock === 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FEE2E2] text-[#DC2626]">
                        0 units (Out of Stock)
                      </span>
                    ) : p.totalStock <= 15 ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#FEF3C7] text-[#D97706] flex items-center gap-1 w-max">
                        <AlertTriangle className="w-3 h-3" /> {p.totalStock} units (Low)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#DCFCE7] text-[#16A34A]">
                        {p.totalStock} units
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {p.prescriptionRequired ? (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FAF3EA] text-[#0B4A3A] border border-[#F3E5D4] flex items-center gap-1 w-max">
                        <Shield className="w-3 h-3 text-[#0B4A3A]" /> {p.scheduleType || "Schedule H"}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#F1F3F4] text-[#5B6B65] w-max">
                        OTC General
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.isActive ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#F1F3F4] text-[#5B6B65]"
                      }`}
                    >
                      {p.isActive ? "In Catalog" : "Draft"}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#5B6B65]">
                    No medicines match the selected search or category filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
