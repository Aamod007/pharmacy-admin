import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var globalPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.globalPrisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["info", "warn", "error"]
        : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.globalPrisma = prisma;
}

export * from "@prisma/client";
export default prisma;
