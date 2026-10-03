import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numeric)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatDateIST(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Format expiry date into standard pharmaceutical Month & Year (e.g., "Oct 2026")
 */
export function formatExpiryMonthYear(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Format expiry date with numeric month & year (e.g. "10/2026")
 */
export function formatExpirySlash(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "—";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "—";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${month}/${date.getFullYear()}`;
}

/**
 * Compute pharmaceutical expiry status in human-friendly Months and Years
 * instead of complicated raw day counts.
 */
export function getExpiryMonthYearStatus(dateInput: string | Date | null | undefined) {
  if (!dateInput) {
    return { label: "No Date", color: "bg-[#F1F3F4] text-[#5B6B65] border-[#E4E7E9]", isExpired: false };
  }
  const expDate = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(expDate.getTime())) {
    return { label: "Invalid Date", color: "bg-[#F1F3F4] text-[#5B6B65] border-[#E4E7E9]", isExpired: false };
  }

  const now = new Date();
  const expYear = expDate.getFullYear();
  const expMonth = expDate.getMonth();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();

  // Full calendar month difference
  const monthsDiff = (expYear - nowYear) * 12 + (expMonth - nowMonth);
  const isPast = expDate.getTime() < now.getTime();

  if (isPast || monthsDiff < 0) {
    const absMonths = Math.abs(monthsDiff);
    let label = "Expired";
    if (absMonths === 0) {
      label = "Expired this month";
    } else if (absMonths < 12) {
      label = `Expired ${absMonths} mo${absMonths > 1 ? "s" : ""} ago`;
    } else {
      const yrs = Math.floor(absMonths / 12);
      const rem = absMonths % 12;
      label = `Expired ${yrs} yr${yrs > 1 ? "s" : ""}${rem > 0 ? ` ${rem} mo${rem > 1 ? "s" : ""}` : ""} ago`;
    }
    return {
      label,
      color: "bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]",
      isExpired: true,
      monthsDiff,
    };
  }

  if (monthsDiff === 0) {
    return {
      label: "Expires this month",
      color: "bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]",
      isExpiringSoon: true,
      monthsDiff,
    };
  }

  if (monthsDiff <= 1) {
    return {
      label: "Expiring in 1 month",
      color: "bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]",
      isExpiringSoon: true,
      monthsDiff,
    };
  }

  if (monthsDiff <= 3) {
    return {
      label: `Expiring in ${monthsDiff} months`,
      color: "bg-[#FEF9C3] text-[#CA8A04] border-[#FDE047]",
      isExpiringSoon: true,
      monthsDiff,
    };
  }

  if (monthsDiff < 12) {
    return {
      label: `${monthsDiff} months remaining`,
      color: "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]",
      isExpiringSoon: false,
      monthsDiff,
    };
  }

  const yrs = Math.floor(monthsDiff / 12);
  const rem = monthsDiff % 12;
  const label = rem > 0
    ? `${yrs} yr${yrs > 1 ? "s" : ""} ${rem} mo${rem > 1 ? "s" : ""} remaining`
    : `${yrs} year${yrs > 1 ? "s" : ""} remaining`;

  return {
    label,
    color: "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]",
    isExpiringSoon: false,
    monthsDiff,
  };
}

