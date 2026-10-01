"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { Plus, Trash2, Search, Package, Layers, ShieldCheck, Tag } from "lucide-react";
import { toast } from "sonner";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCategories = async () => {
    try {
      const res = await apiRequest("/categories");
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await apiRequest("/categories", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: description.trim() || undefined,
        }),
      });
      toast.success("Medicine category created & synced!");
      setName("");
      setSlug("");
      setDescription("");
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${catName}"?`)) return;
    try {
      await apiRequest(`/categories/${id}`, { method: "DELETE" });
      toast.success("Category deleted");
      loadCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = categories.reduce((sum, c) => sum + (c._count?.products || 0), 0);

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Catalog" title="Medicine Categories" />

      <div className="p-8 max-w-6xl mx-auto space-y-6">
        {/* Metric Badges */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Total Categories</p>
              <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">{categories.length}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FAF3EA] flex items-center justify-center text-[#0B4A3A]">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Catalogued Medicines</p>
              <h4 className="text-2xl font-black text-[#0B4A3A] mt-1">{totalProducts}</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] flex items-center justify-center text-[#16A34A]">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E4E7E9] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#5B6B65] uppercase tracking-wider">Storefront Status</p>
              <h4 className="text-sm font-bold text-[#16A34A] mt-2 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] animate-pulse" /> Live & Synchronized
              </h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 2-Column layout: Add Category Form + Category List */}
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Add Category Form */}
          <div className="col-span-5 bg-white p-6 rounded-2xl border border-[#E4E7E9] shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-[#0F2A22]">Add Medicine Category</h3>
              <p className="text-xs text-[#5B6B65] mt-0.5">
                Configure therapeutic and pharmacological classification groups.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }}
                  className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[hsl(var(--primary))]"
                  placeholder="e.g. Antibiotics & Anti-Infectives"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">URL Slug</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-mono text-[#5B6B65] focus:outline-none"
                  placeholder="e.g. antibiotics-anti-infectives"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-[#F1F3F4] rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none leading-relaxed"
                  placeholder="Brief clinical description of medicines covered in this category..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#0B4A3A] text-white rounded-xl text-xs font-bold hover:bg-[#07362a] transition shadow-sm"
              >
                {isSubmitting ? "Adding..." : "Add Category +"}
              </button>
            </form>
          </div>

          {/* Category List */}
          <div className="col-span-7 bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E4E7E9] flex items-center justify-between">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-[#5B6B65] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter categories..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#F1F3F4] rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>
              <span className="text-xs text-[#5B6B65] font-semibold">
                Showing {filteredCategories.length} categories
              </span>
            </div>

            <div className="divide-y divide-[#E4E7E9] max-h-[560px] overflow-y-auto">
              {filteredCategories.map((c) => (
                <div
                  key={c.id}
                  className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition group"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm text-[#0F2A22]">{c.name}</p>
                    <p className="text-xs text-[#5B6B65]">
                      Slug: <code className="text-[#0B4A3A] font-semibold">/{c.slug}</code> &bull;{" "}
                      <span className="font-bold text-[#0F2A22]">{c._count?.products || 0}</span> medicines
                    </p>
                    {c.description && (
                      <p className="text-[11px] text-[#718096] line-clamp-1">{c.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    className="p-2 text-[#DC2626] opacity-0 group-hover:opacity-100 hover:bg-[#FEE2E2] rounded-lg transition"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {filteredCategories.length === 0 && (
                <div className="p-8 text-center text-xs text-[#5B6B65]">
                  No matching categories found.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
