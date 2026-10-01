// Redis Pub/Sub channels and Server-Sent Events contracts

export const REDIS_CHANNELS = {
  STORE_EVENTS: "store:events",
  STORE_ORDERS: "store:orders",
} as const;

export type StoreEventType =
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "category.updated"
  | "brand.updated"
  | "banner.updated"
  | "faq.updated"
  | "settings.updated"
  | "coupon.updated"
  | "lab_test.updated"
  | "doctor.updated"
  | "review.updated";

export interface StoreEventPayload {
  type: StoreEventType;
  entityId: string;
  entityName?: string;
  timestamp: string;
  revalidationTags: string[];
  revalidationPaths: string[];
  actor: {
    adminId: string;
    email: string;
  };
}

export type OrderEventType =
  | "order.created"
  | "payment.captured"
  | "payment.failed"
  | "prescription.uploaded"
  | "stock.low";

export interface OrderEventPayload {
  type: OrderEventType;
  entityId: string;
  referenceNumber?: string; // Order Number, Rx ID, SKU
  amount?: number;
  customerName?: string;
  pincode?: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SseEventMessage {
  id: string;
  event: OrderEventType | "connected" | "heartbeat";
  data: OrderEventPayload | { timestamp: string };
}
