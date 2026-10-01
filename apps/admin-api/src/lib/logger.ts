const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "apikey",
  "api_key",
  "access_token",
  "refresh_token",
]);

function redact(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redact);

  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = "[REDACTED]";
    } else if (typeof val === "object") {
      clean[key] = redact(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export function log(level: LogLevel, message: string, meta: Record<string, any> = {}) {
  const isDev = process.env.NODE_ENV !== "production";
  if (level === "debug" && !isDev) return;

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redact(meta),
  };

  const jsonStr = JSON.stringify(payload);
  if (level === "error") {
    console.error(jsonStr);
  } else if (level === "warn") {
    console.warn(jsonStr);
  } else {
    console.log(jsonStr);
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, any>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, any>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, any>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, any>) => log("error", msg, meta),
};
