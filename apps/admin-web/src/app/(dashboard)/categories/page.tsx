"use client";

import React, { useEffect, useState, useRef } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Package,
  Layers,
  ShieldCheck,
  Tag,
  UploadCloud,
  ImageIcon,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  sortOrder?: number;
  isActive: boolean;
  _count?: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editSortOrder, setEditSortOrder] = useState<number>(0);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);

  // File explorer inputs
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle local image file picker via native file explorer
  const handleImageFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setter(result);
        toast.success("Image selected from computer");
      }
    };
    reader.readAsDataURL(file);
  };

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
          image: image.trim() || undefined,
          sortOrder: Number(sortOrder) || 0,
        }),
      });
      toast.success("Medicine category created & synced with storefront!");
      setName("");
      setSlug("");
      setDescription("");
      setImage("");
      setSortOrder(0);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditDescription(cat.description || "");
    setEditImage(cat.image || "");
    setEditSortOrder(cat.sortOrder ?? 0);
    setEditIsActive(cat.isActive ?? true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;
    setIsEditingSubmitting(true);
    try {
      await apiRequest(`/categories/${editingCategory.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editName.trim(),
          slug: editSlug.trim(),
          description: editDescription.trim() || undefined,
          image: editImage.trim() || undefined,
          sortOrder: Number(editSortOrder) || 0,
          isActive: editIsActive,
        }),
      });
      toast.success("Category updated & synced successfully!");
      setEditingCategory(null);
      loadCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to update category");
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${catName}"?`)) return;
    try {
      await apiRequest(`/categories/${id}`, { method: "DELETE" });
      toast.success("Category deleted & removed from storefront");
      loadCategories();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const totalProducts = categories.reduce((sum, c) => sum + (c._count?.products || 0), 0);

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Catalog" title="Medicine Categories" />

      <div className="p-8 max-w-6xl mx-auto space-y-6">
        {/* Metric Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Category Form */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E4E7E9] shadow-sm space-y-4">
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
                  className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A]"
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
                  className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-mono text-[#5B6B65] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A]"
                  placeholder="e.g. antibiotics-anti-infectives"
                />
              </div>

              {/* Category Image Upload & Preview */}
              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">
                  Category Image
                </label>
                <input
                  type="file"
                  ref={createFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleImageFileSelect(e, setImage)}
                  className="hidden"
                />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => createFileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-[#F4F6F5] hover:bg-[#E9ECEB] text-[#0B4A3A] border border-[#D7DEDB] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-[#0B4A3A]" />
                      <span>Choose File (File Explorer)</span>
                    </button>
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Remove Image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {image ? (
                    <div className="relative w-full h-24 rounded-xl border border-[#D7DEDB] overflow-hidden bg-white flex items-center justify-center">
                      <img src={image} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="or paste image URL directly..."
                      className="w-full px-4 py-2 bg-[#F1F3F4] rounded-xl text-xs text-[#5B6B65] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A]"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">Display Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A]"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1.5">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-[#F1F3F4] rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A] resize-none leading-relaxed"
                  placeholder="Brief clinical description of medicines covered in this category..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#0B4A3A] text-white rounded-xl text-xs font-bold hover:bg-[#07362a] transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Adding Category..." : "Add Category +"}
              </button>
            </form>
          </div>

          {/* Category List */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E4E7E9] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E4E7E9] flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-[#5B6B65] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter categories..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#F1F3F4] rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A]"
                />
              </div>
              <span className="text-xs text-[#5B6B65] font-semibold whitespace-nowrap">
                Showing {filteredCategories.length} categories
              </span>
            </div>

            <div className="divide-y divide-[#E4E7E9] max-h-[620px] overflow-y-auto">
              {filteredCategories.map((c) => (
                <div
                  key={c.id}
                  className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] transition group gap-3"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#FAF3EA] border border-[#FDE6D3] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {c.image ? (
                        <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <Tag className="w-5 h-5 text-[#0B4A3A]" />
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-[#0F2A22] truncate">{c.name}</p>
                        {!c.isActive && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded font-bold">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5B6B65] truncate">
                        Slug: <code className="text-[#0B4A3A] font-semibold">/{c.slug}</code> &bull;{" "}
                        <span className="font-bold text-[#0F2A22]">{c._count?.products || 0}</span> medicines
                        {c.sortOrder !== undefined && c.sortOrder > 0 && (
                          <span className="ml-2 text-gray-400 font-mono">Order: {c.sortOrder}</span>
                        )}
                      </p>
                      {c.description && (
                        <p className="text-[11px] text-[#718096] line-clamp-1">{c.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-2 text-gray-500 hover:text-[#0B4A3A] hover:bg-[#FAF3EA] rounded-lg transition cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
                      className="p-2 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg transition cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-[#0F2A22] text-base">Edit Category</h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1.5 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F1F3F4] rounded-xl text-xs font-mono text-[#5B6B65] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1">Image</label>
                <input
                  type="file"
                  ref={editFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleImageFileSelect(e, setEditImage)}
                  className="hidden"
                />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 bg-[#F4F6F5] hover:bg-[#E9ECEB] text-[#0B4A3A] border border-[#D7DEDB] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-[#0B4A3A]" />
                      <span>Choose from Computer</span>
                    </button>
                    {editImage && (
                      <button
                        type="button"
                        onClick={() => setEditImage("")}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {editImage ? (
                    <div className="relative w-full h-20 rounded-xl border border-[#D7DEDB] overflow-hidden bg-white flex items-center justify-center">
                      <img src={editImage} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editImage}
                      onChange={(e) => setEditImage(e.target.value)}
                      placeholder="or paste image URL..."
                      className="w-full px-3 py-1.5 bg-[#F1F3F4] rounded-xl text-xs text-[#5B6B65] focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F1F3F4] rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Status</label>
                  <button
                    type="button"
                    onClick={() => setEditIsActive(!editIsActive)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                      editIsActive
                        ? "bg-[#DCFCE7] text-[#16A34A] border-green-200"
                        : "bg-red-50 text-red-600 border-red-200"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{editIsActive ? "Active" : "Inactive"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5B6B65] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2.5 bg-[#F1F3F4] rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0B4A3A] resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditingSubmitting}
                  className="flex-1 py-2.5 bg-[#0B4A3A] text-white rounded-xl text-xs font-bold hover:bg-[#07362a] transition disabled:opacity-50"
                >
                  {isEditingSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
