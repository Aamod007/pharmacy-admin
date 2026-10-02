"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "../../../components/shell/Topbar";
import { apiRequest } from "../../../lib/api-client";
import { Star, CheckCircle, XCircle, Trash2, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/reviews?isApproved=${statusFilter}`);
      setReviews(res.data || []);
    } catch (err: any) {
      toast.error("Failed to load reviews", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, isApproved: boolean) => {
    try {
      await apiRequest(`/reviews/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ isApproved }),
      });
      toast.success(isApproved ? "Review published" : "Review hidden from storefront");
      loadReviews();
    } catch (err: any) {
      toast.error("Failed to update review", { description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer review?")) return;
    try {
      await apiRequest(`/reviews/${id}`, { method: "DELETE" });
      toast.success("Review deleted");
      loadReviews();
    } catch (err: any) {
      toast.error("Failed to delete review", { description: err.message });
    }
  };

  return (
    <div className="flex-1 pb-16">
      <Topbar breadcrumb="Marketing" title="Medicine Ratings & Reviews" />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {["ALL", "true", "false"].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === filter
                    ? "bg-[#0B4A3A] text-white shadow-xs"
                    : "bg-white text-[#5B6B65] hover:bg-[#F4F6F5] border border-[#D7DEDB]"
                }`}
              >
                {filter === "ALL" ? "All Reviews" : filter === "true" ? "Approved & Live" : "Pending Moderation"}
              </button>
            ))}
          </div>
          <span className="text-xs font-bold text-[#5B6B65]">Showing {reviews.length} reviews</span>
        </div>

        {/* Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.length === 0 ? (
            <div className="col-span-2 p-12 text-center bg-white rounded-2xl border border-[#D7DEDB] text-[#5B6B65] text-xs font-semibold">
              No reviews found matching filter.
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-[#D7DEDB] p-5 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= r.rating ? "text-[#F5C043] fill-[#F5C043]" : "text-gray-200"
                          }`}
                        />
                      ))}
                      <span className="text-xs font-black text-[#0F2A22] ml-1.5">{r.rating}.0</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        r.isApproved ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#FEF9C3] text-[#B45309]"
                      }`}
                    >
                      {r.isApproved ? "Live on Store" : "Pending"}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-[#0B4A3A]">
                    {r.product?.name || "Medicine Product"}
                  </h4>

                  <p className="text-xs text-[#0F2A22] font-medium italic">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-[#D7DEDB] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#5B6B65]">
                    <User className="w-3.5 h-3.5 text-[#0B4A3A]" />
                    <span className="font-semibold text-[#0F2A22]">{r.user?.name || "Verified Customer"}</span>
                    {r.isVerifiedPurchase && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-1.5 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3" /> Verified Buyer
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {r.isApproved ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(r.id, false)}
                        className="px-2.5 py-1 bg-[#FAF3EA] border border-[#D7DEDB] hover:bg-[#F5C043]/30 text-[#0B4A3A] font-bold text-[11px] rounded-lg transition"
                      >
                        Hide
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(r.id, true)}
                        className="px-2.5 py-1 bg-[#0B4A3A] hover:bg-[#07362a] text-white font-bold text-[11px] rounded-lg transition"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
