import prisma from "@pharmacy-admin/db";
import { REDIS_CHANNELS, StoreEventType } from "@pharmacy-admin/shared";
import { env } from "../config/env";
import { redis } from "./redis";

interface SyncMutationOptions {
  type: StoreEventType;
  entityId: string;
  entityName?: string;
  tags: string[];
  paths: string[];
  actor: {
    adminId: string;
    email: string;
  };
}

export async function syncMutationToMainSite(options: SyncMutationOptions) {
  const { type, entityId, entityName, tags, paths, actor } = options;

  // 1. Publish to Redis channel store:events
  try {
    const payload = {
      type,
      entityId,
      entityName,
      timestamp: new Date().toISOString(),
      revalidationTags: tags,
      revalidationPaths: paths,
      actor,
    };
    await redis.publish(REDIS_CHANNELS.STORE_EVENTS, JSON.stringify(payload));
  } catch (err: any) {
    console.error("Failed to publish store event to Redis:", err.message);
  }

  // 2. HTTP POST to Main Site ISR /api/revalidate with backoff retry
  let attempt = 0;
  const maxAttempts = 3;
  let success = false;
  let lastError = "";

  while (attempt < maxAttempts && !success) {
    attempt++;
    try {
      const response = await fetch(`${env.MAIN_SITE_URL}/api/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": env.REVALIDATE_SECRET,
        },
        body: JSON.stringify({ tags, paths }),
      });

      if (response.ok) {
        success = true;
      } else {
        const text = await response.text();
        lastError = `HTTP ${response.status}: ${text}`;
      }
    } catch (err: any) {
      lastError = err.message;
      if (attempt < maxAttempts) {
        await new Promise((res) => setTimeout(res, 500 * Math.pow(2, attempt)));
      }
    }
  }

  // 3. Log results to admin_notification_logs
  try {
    await prisma.adminNotificationLog.create({
      data: {
        channel: "REVALIDATION_WEBHOOK",
        recipient: `${env.MAIN_SITE_URL}/api/revalidate`,
        eventType: type,
        payload: { tags, paths, entityId, entityName, actor },
        status: success ? "SUCCESS" : "FAILED",
        errorMessage: success ? null : lastError,
        retryCount: attempt - 1,
        lastRetryAt: attempt > 1 ? new Date() : null,
      },
    });
  } catch (err: any) {
    console.error("Failed to write to admin_notification_logs:", err.message);
  }
}
