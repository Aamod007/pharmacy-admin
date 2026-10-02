import prisma from "@pharmacy-admin/db";

let cachedAdminId: string | null = null;

/**
 * Resolves a given admin identifier or email to a valid AdminUser primary key (UUID)
 * present in the admin_users table.
 *
 * If candidateId is already a valid AdminUser id, returns it.
 * If candidateId is missing, invalid, or "admin-master", looks up by email.
 * If not found, falls back to the first active AdminUser in the database.
 * Returns null if no AdminUser exists in the database.
 */
export async function resolveAdminUserId(
  candidateId?: string | null,
  email?: string | null,
  client?: any
): Promise<string | null> {
  const db = client || prisma;

  // 1. If candidate ID is a non-placeholder string, verify it exists in DB
  if (candidateId && candidateId !== "admin-master") {
    try {
      const existing = await db.adminUser.findUnique({
        where: { id: candidateId },
        select: { id: true },
      });
      if (existing) {
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
      cachedAdminId = byEmail.id;
      return byEmail.id;
    }
  } catch {
    // Continue fallback
  }

  // 3. Fallback to cached ID if previously resolved
  if (cachedAdminId) {
    return cachedAdminId;
  }

  // 4. Fallback to any active admin user
  try {
    const activeAdmin = await db.adminUser.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (activeAdmin) {
      cachedAdminId = activeAdmin.id;
      return activeAdmin.id;
    }
  } catch {
    // Continue
  }

  return null;
}
