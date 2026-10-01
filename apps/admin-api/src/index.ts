import app from "./app";
import { env } from "./config/env";
import { connectRedis, redisSub, isRedisConnected } from "./lib/redis";
import { REDIS_CHANNELS, OrderEventPayload } from "@pharmacy-admin/shared";
import { sseManager } from "./lib/sse";

async function bootstrap() {
  await connectRedis();

  if (isRedisConnected) {
    try {
      await redisSub.subscribe(REDIS_CHANNELS.STORE_ORDERS);
      console.log(`📡 Subscribed to Redis channel: ${REDIS_CHANNELS.STORE_ORDERS}`);

      redisSub.on("message", (channel, message) => {
        if (channel === REDIS_CHANNELS.STORE_ORDERS) {
          try {
            const payload: OrderEventPayload = JSON.parse(message);
            console.log(`⚡ Received Store Event: ${payload.type} -> Fanning out to ${sseManager.getClientCount()} admin browsers`);
            sseManager.broadcast(payload.type, payload);
          } catch (e) {
            console.error("Failed to parse Redis order event:", e);
          }
        }
      });
    } catch (err: any) {
      console.warn("Could not subscribe to Redis store:orders:", err.message);
    }
  } else {
    console.log("ℹ️ Running in standalone mode without Redis subscription");
  }

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Pharmacy Admin API running on http://localhost:${env.PORT}`);
    console.log(`📖 OpenAPI Swagger docs: http://localhost:${env.PORT}/api/docs`);
  });

  const shutdown = () => {
    console.log("Shutting down admin server gracefully...");
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((err) => {
  console.error("Failed to start Admin API:", err);
  process.exit(1);
});
