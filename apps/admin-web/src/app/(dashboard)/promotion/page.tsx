"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { formatCurrency } from "../../../lib/utils";
import { Plus, Tag, Trash2, Image, ExternalLink, Calendar, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function PromotionPage() {
  const [activeTab, setActiveTab] = useState<"coupons" | "banners">("coupons");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Coupon State
  const [code, setCode] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [description, setDescription] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("500");

  // New Banner State
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerTargetUrl, setBannerTargetUrl] = useState("/products");
  const [bannerPosition, setBannerPosition] = useState("HERO");

  const loadData = async () => {
    setLoading(true);
    try {
      const [cpRes, bnRes] = await Promise.all([
        apiRequest("/coupons"),
        apiRequest("/banners"),
      ]);
      setCoupons(cpRes.data || []);
      setBanners(bnRes.data || []);
    } catch (err: any) {
      toast.error("Failed to load promotions", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: code.toUpperCase(),
          description,
          discountType: "PERCENTAGE",
          discountValue: Number(discountValue),
          minOrderValue: Number(minOrderValue),
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000 * 30),
        }),
      });
      toast.success(`Coupon ${code.toUpperCase()} created!`);
      setCode("");
      setDiscountValue("");
      setDescription("");
      loadData();
    } catch (err: any) {
      toast.error("Failed to create coupon", { description: err.message });
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await apiRequest(`/coupons/${id}`, { method: "DELETE" });
      toast.success("Coupon deleted");
      loadData();
    } catch (err: any) {
      toast.error("Failed to delete coupon", { description: err.message });
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/banners", {
        method: "POST",
        body: JSON.stringify({
          title: bannerTitle,
          subtitle: bannerSubtitle,
          imageUrl: bannerImageUrl || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1200",
          targetUrl: bannerTargetUrl,
          position: bannerPosition,
          isActive: true,
        }),
      });
      toast.success("Storefront banner published!");
      setBannerTitle("");
      setBannerSubtitle("");
      setBannerImageUrl("");
      loadData();
    } catch (err: any) {
      toast.error("Failed to publish banner", { description: err.message });
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this storefront banner?")) return;
    try {
      await apiRequest(`/banners/${id}`, { method: "DELETE" });
      toast.success("Banner deleted");
      loadData();
    } catch (err: any) {
      toast.error("Failed to delete banner", { description: err.message });
    }
  };

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Marketing" title="Coupons & Storefront Banners" />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[#D7DEDB] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("coupons")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "coupons"
                ? "bg-[#0B4A3A] text-white shadow-xs"
                : "bg-white text-[#5B6B65] hover:bg-[#F4F6F5] border border-[#D7DEDB]"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Discount Coupons ({coupons.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("banners")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "banners"
                ? "bg-[#0B4A3A] text-white shadow-xs"
                : "bg-white text-[#5B6B65] hover:bg-[#F4F6F5] border border-[#D7DEDB]"
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Storefront Banners ({banners.length})</span>
          </button>
        </div>

        {/* TAB 1: COUPONS */}
        {activeTab === "coupons" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-extrabold text-sm text-[#0F2A22]">Active Store Coupons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((c) => (
                  <div key={c.id} className="bg-white rounded-2xl border border-[#D7DEDB] p-5 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm text-[#0B4A3A] bg-[#FAF3EA] px-2.5 py-1 rounded-lg border border-[#D7DEDB]">
                          {c.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#5B6B65] pt-1">{c.description}</p>
                    </div>

                    <div className="pt-2 border-t border-[#D7DEDB] flex items-center justify-between text-xs font-bold">
                      <span className="text-[#16A34A]">{c.discountValue}% OFF</span>
                      <span className="text-[#5B6B65]">Used {c.usedCount || 0} times</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CREATE COUPON CARD */}
            <div className="bg-white rounded-2xl border border-[#D7DEDB] p-6 shadow-xs space-y-4 h-fit">
              <h4 className="font-extrabold text-sm text-[#0F2A22]">Create New Promo Code</h4>
              <form onSubmit={handleCreateCoupon} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. MONSOON20"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-bold text-[#0F2A22] outline-none uppercase tracking-wider"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Discount (%)</label>
                  <input
                    type="number"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-bold text-[#0F2A22] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="500"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-bold text-[#0F2A22] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Flat 20% discount on everyday health essentials"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0B4A3A] hover:bg-[#07362a] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                >
                  Publish Coupon
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: STOREFRONT CMS BANNERS */}
        {activeTab === "banners" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-extrabold text-sm text-[#0F2A22]">Storefront CMS Banners</h3>
              <div className="space-y-4">
                {banners.map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl border border-[#D7DEDB] overflow-hidden shadow-xs flex flex-col sm:flex-row">
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="w-full sm:w-48 h-32 object-cover bg-gray-100 flex-shrink-0"
                    />
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#0B4A3A] bg-[#FAF3EA] px-2 py-0.5 rounded-full border border-[#D7DEDB]">
                            {b.position}
                          </span>
                          <h4 className="text-sm font-extrabold text-[#0F2A22] mt-1">{b.title}</h4>
                          <p className="text-xs text-[#5B6B65]">{b.subtitle}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(b.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[#D7DEDB]">
                        <span className="font-semibold text-[#5B6B65]">Target: {b.targetUrl}</span>
                        <span className="text-[10px] font-black text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CREATE BANNER CARD */}
            <div className="bg-white rounded-2xl border border-[#D7DEDB] p-6 shadow-xs space-y-4 h-fit">
              <h4 className="font-extrabold text-sm text-[#0F2A22]">Add Storefront Banner</h4>
              <form onSubmit={handleCreateBanner} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Headline</label>
                  <input
                    type="text"
                    required
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="e.g. Up to 40% Off on Multivitamins"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Subtext / Offer</label>
                  <input
                    type="text"
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="Boost immunity with certified wellness supplements"
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#5B6B65] mb-1">Image URL</label>
                  <input
                    type="url"
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#5B6B65] mb-1">Position</label>
                    <select
                      value={bannerPosition}
                      onChange={(e) => setBannerPosition(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                    >
                      <option value="HERO">HERO</option>
                      <option value="PROMO_LEFT">PROMO_LEFT</option>
                      <option value="PROMO_RIGHT">PROMO_RIGHT</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5B6B65] mb-1">Link Target</label>
                    <input
                      type="text"
                      value={bannerTargetUrl}
                      onChange={(e) => setBannerTargetUrl(e.target.value)}
                      placeholder="/products"
                      className="w-full px-3 py-2 bg-[#F4F6F5] border border-[#D7DEDB] rounded-xl text-xs font-semibold text-[#0F2A22] outline-none"
                    >
                    </input>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0B4A3A] hover:bg-[#07362a] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                >
                  Publish Banner
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
