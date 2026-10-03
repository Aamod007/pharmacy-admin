import prisma from "@pharmacy-admin/db";

// In-memory cache with 10-minute TTL to eliminate remote DB latency on every API request
const idCache = new Map<string, { id: string; expiresAt: number }>();
let globalFallbackAdminId: string | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Resolves a given admin identifier or email to a valid AdminUser primary key (UUID)
 * present in the admin_users table with in-memory caching to eliminate per-request DB latency.
 */
export async function resolveAdminUserId(
  candidateId?: string | null,
  email?: string | null,
  client?: any
): Promise<string | null> {
  const cacheKey = `${candidateId || ""}|${email || ""}`;
  const now = Date.now();

  const cached = idCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.id;
  }

  const db = client || prisma;

  // 1. If candidate ID is a non-placeholder string, verify it exists in DB
  if (candidateId && candidateId !== "admin-master") {
    try {
      const existing = await db.adminUser.findUnique({
        where: { id: candidateId },
        select: { id: true },
      });
      if (existing) {
        idCache.set(cacheKey, { id: existing.id, expiresAt: now + CACHE_TTL_MS });
        idCache.set(`id:${existing.id}`, { id: existing.id, expiresAt: now + CACHE_TTL_MS });
        return existing.id;
      }
    } catch {
      // In case candidateId is not a valid UUID format for Postgres or query fails
    }
  }

  // 2. Try looking up by email
  const targetEmail = email || "admin@pharmacy.com";
  try {
    const byEmail = await db.adminUser.findUnique({
      where: { email: targetEmail },
      select: { id: true },
    });
    if (byEmail) {
      idCache.set(cacheKey, { id: byEmail.id, expiresAt: now + CACHE_TTL_MS });
      idCache.set(`email:${targetEmail}`, { id: byEmail.id, expiresAt: now + CACHE_TTL_MS });
      globalFallbackAdminId = byEmail.id;
      return byEmail.id;
    }
  } catch {
    // Continue fallback
  }

  // 3. Fallback to cached ID if previously resolved
  if (globalFallbackAdminId) {
    return globalFallbackAdminId;
  }

  // 4. Fallback to any active admin user
  try {
    const activeAdmin = await db.adminUser.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (activeAdmin) {
      globalFallbackAdminId = activeAdmin.id;
      idCache.set(cacheKey, { id: activeAdmin.id, expiresAt: now + CACHE_TTL_MS });
      return activeAdmin.id;
    }
  } catch {
    // Continue
  }

  return null;
}

