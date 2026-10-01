// Business & Operational Enums shared across Admin Web and Admin API

export enum Role {
  CUSTOMER = "CUSTOMER",
  PHARMACIST = "PHARMACIST",
  ADMIN = "ADMIN",
}

export enum AdminRoleSlug {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  PHARMACIST = "PHARMACIST",
  INVENTORY_MANAGER = "INVENTORY_MANAGER",
  SUPPORT = "SUPPORT",
  MARKETING = "MARKETING",
}

export enum OrderStatus {
  PLACED = "PLACED",
  CONFIRMED = "CONFIRMED",
  PACKED = "PACKED",
  SHIPPED = "SHIPPED",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  RETURN_REQUESTED = "RETURN_REQUESTED",
  RETURNED = "RETURNED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  CREATED = "CREATED",
  AUTHORIZED = "AUTHORIZED",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
  RAZORPAY = "RAZORPAY",
  COD = "COD",
}

export enum PrescriptionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum ScheduleType {
  OTC = "OTC",
  SCHEDULE_H = "Schedule H",
  SCHEDULE_H1 = "Schedule H1",
  SCHEDULE_X = "Schedule X",
}

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FLAT = "FLAT",
}

export enum AdminStockMovementType {
  PURCHASE = "PURCHASE",
  SALE = "SALE",
  RETURN_RESTOCK = "RETURN_RESTOCK",
  DAMAGE = "DAMAGE",
  EXPIRED = "EXPIRED",
  CORRECTION = "CORRECTION",
  AUDIT_ADJUSTMENT = "AUDIT_ADJUSTMENT",
}

export enum AdminPurchaseStatus {
  DRAFT = "DRAFT",
  RECEIVED = "RECEIVED",
  VERIFIED = "VERIFIED",
  CANCELLED = "CANCELLED",
}

export enum AdminTicketPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum AdminTicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export enum AdminSenderType {
  ADMIN = "ADMIN",
  CUSTOMER = "CUSTOMER",
  SYSTEM = "SYSTEM",
}

export enum AdminNotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  SSE = "SSE",
  REDIS_SYNC = "REDIS_SYNC",
  REVALIDATION_WEBHOOK = "REVALIDATION_WEBHOOK",
}

export enum AdminNotificationStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  RETRYING = "RETRYING",
}

export enum AdminWebhookSource {
  RAZORPAY = "RAZORPAY",
  SHIPROCKET = "SHIPROCKET",
  MAIN_SITE = "MAIN_SITE",
}

export enum AdminWebhookStatus {
  RECEIVED = "RECEIVED",
  PROCESSED = "PROCESSED",
  FAILED = "FAILED",
}

export enum AdminImportType {
  PRODUCTS = "PRODUCTS",
  INVENTORY_BATCHES = "INVENTORY_BATCHES",
  PINCODES = "PINCODES",
  PRICES = "PRICES",
}

export enum AdminImportStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum AdminCreditNoteStatus {
  ISSUED = "ISSUED",
  APPLIED = "APPLIED",
  CANCELLED = "CANCELLED",
}
