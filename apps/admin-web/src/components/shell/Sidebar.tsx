"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Package,
  Users,
  FileText,
  Tag,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Star,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

interface NavGroup {
  group: string;
  items: {
    name: string;
    href: string;
    icon: any;
    badge?: number;
    children?: { name: string; href: string }[];
  }[];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [catalogOpen, setCatalogOpen] = useState(
    pathname?.includes("/products") || pathname?.includes("/categories") || false
  );

  const navGroups: NavGroup[] = [
    {
      group: "WORKSTATION",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Orders & Sales", href: "/orders", icon: ShoppingBag },
        { name: "FEFO Inventory", href: "/inventory", icon: Layers },
      ],
    },
    {
      group: "CATALOG",
      items: [
        {
          name: "Medicines & Store",
          href: "/products",
          icon: Package,
          children: [
            { name: "Medicine Catalog", href: "/products" },
            { name: "Categories", href: "/categories" },
            { name: "Add Medicine", href: "/products/add" },
          ],
        },
      ],
    },
    {
      group: "FINANCE & MARKETING",
      items: [
        { name: "Tax Invoices", href: "/invoices", icon: FileText },
        { name: "Coupons & Banners", href: "/promotion", icon: Tag },
        { name: "Medicine Reviews", href: "/reviews", icon: Star },
      ],
    },
    {
      group: "ADMINISTRATION",
      items: [
        { name: "Customers", href: "/customers", icon: Users },
        { name: "Staff & RBAC", href: "/staff", icon: Building2 },
        { name: "Audit Trail", href: "/audit", icon: ShieldCheck },
        { name: "Store Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-[260px] flex-shrink-0 bg-white border-r border-[#D7DEDB] flex flex-col h-screen select-none shadow-xs">
      {/* Pharmico Brand Logo Card */}
      <div className="p-4 border-b border-[#D7DEDB]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[#0B4A3A] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition">
            <span className="text-xl font-black text-[#10B981]">+</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-[#0B4A3A] tracking-tight">Pharmico</span>
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            </div>
            <span className="text-[10px] font-bold text-[#5B6B65] uppercase tracking-wider">
              Control Center
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-extrabold text-[#5B6B65] uppercase tracking-wider">
              {group.group}
            </div>

            {group.items.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              const Icon = item.icon;

              if (item.children) {
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setCatalogOpen(!catalogOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? "bg-[#FAF3EA] text-[#0B4A3A]"
                          : "text-[#5B6B65] hover:bg-[#F4F6F5] hover:text-[#0F2A22]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-[#0B4A3A]" : "text-[#5B6B65]"}`} />
                        <span>{item.name}</span>
                      </div>
                      {catalogOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-[#5B6B65]" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-[#5B6B65]" />
                      )}
                    </button>
                    {catalogOpen && (
                      <div className="pl-7 pr-2 space-y-1 py-1 border-l-2 border-[#D7DEDB] ml-4">
                        {item.children.map((sub) => {
                          const isSubActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.name}
                              href={sub.href}
                              className={`block px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                isSubActive
                                  ? "bg-[#0B4A3A] text-white font-bold shadow-xs"
                                  : "text-[#5B6B65] hover:bg-[#F4F6F5] hover:text-[#0F2A22]"
                              }`}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? "bg-[#0B4A3A] text-white shadow-xs"
                      : "text-[#5B6B65] hover:bg-[#F4F6F5] hover:text-[#0F2A22]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#10B981]" : "text-[#5B6B65]"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive
                          ? "bg-[#10B981] text-[#0B4A3A]"
                          : "bg-[#FAF3EA] text-[#0B4A3A] border border-[#D7DEDB]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom User Card & Quick Logout */}
      <div className="p-3 border-t border-[#D7DEDB] bg-[#F4F6F5]/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#D7DEDB]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0B4A3A] text-[#10B981] flex items-center justify-center font-black text-xs flex-shrink-0">
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#0F2A22] truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.email || "Administrator"}
              </span>
              <span className="text-[10px] text-[#5B6B65] truncate font-medium">
                {user?.role?.name || "Super Admin"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Log Out"
            className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FEF2F2] transition cursor-pointer flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
