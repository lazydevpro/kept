import type { AppEnv } from "./types";

interface SocketAttachment {
  userId: string;
  connectedAt: string;
}

export class CircleRoom implements DurableObject {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: AppEnv,
  ) {}

  async fetch(request: Request): Promise<Response> {
    if (
      request.headers.get("x-neon-internal") !== this.env.BETTER_AUTH_SECRET
    ) {
      return new Response("Forbidden", { status: 403 });
    }

    const url = new URL(request.url);
    if (url.pathname === "/broadcast" && request.method === "POST") {
      const event = await request.text();
      this.broadcast(event);
      return new Response(null, { status: 204 });
    }

    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response("Expected a WebSocket upgrade", { status: 426 });
    }

    const userId = request.headers.get("x-neon-user");
    if (!userId) return new Response("Missing user", { status: 401 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    server.serializeAttachment({
      userId,
      connectedAt: new Date().toISOString(),
    } satisfies SocketAttachment);
    server.send(
      JSON.stringify({
        type: "room.ready",
        connected: this.state.getWebSockets().length,
      }),
    );
    this.broadcast(
      JSON.stringify({
        type: "presence.changed",
        connected: this.state.getWebSockets().length,
      }),
      server,
    );
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(socket: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;
    if (message === "ping") {
      socket.send(
        JSON.stringify({ type: "pong", at: new Date().toISOString() }),
      );
    }
  }

  webSocketClose(socket: WebSocket, code: number, reason: string) {
    socket.close(code, reason);
    this.broadcast(
      JSON.stringify({
        type: "presence.changed",
        connected: this.state.getWebSockets().length,
      }),
    );
  }

  webSocketError(socket: WebSocket) {
    socket.close(1011, "Room connection error");
  }

  private broadcast(message: string, except?: WebSocket) {
    for (const socket of this.state.getWebSockets()) {
      if (socket === except) continue;
      try {
        socket.send(message);
      } catch {
        socket.close(1011, "Delivery failed");
      }
    }
  }
}
