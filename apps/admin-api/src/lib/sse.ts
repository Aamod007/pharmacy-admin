import { Response } from "express";
import { OrderEventType, OrderEventPayload } from "@pharmacy-admin/shared";

interface SseClient {
  id: string;
  adminUserId: string;
  res: Response;
}

class SseManager {
  private clients: Map<string, SseClient> = new Map();

  addClient(id: string, adminUserId: string, res: Response) {
    this.clients.set(id, { id, adminUserId, res });

    // Initial connection message
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    // Clean up on disconnect
    res.on("close", () => {
      this.clients.delete(id);
    });
  }

  removeClient(id: string) {
    this.clients.delete(id);
  }

  broadcast(eventType: OrderEventType, payload: OrderEventPayload) {
    const data = JSON.stringify(payload);
    for (const [, client] of this.clients) {
      client.res.write(`id: ${Date.now()}\nevent: ${eventType}\ndata: ${data}\n\n`);
    }
  }

  heartbeat() {
    const ping = `event: heartbeat\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`;
    for (const [, client] of this.clients) {
      client.res.write(ping);
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

export const sseManager = new SseManager();
setInterval(() => sseManager.heartbeat(), 25000);
