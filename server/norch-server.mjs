#!/usr/bin/env node

/**
 * norch WebSocket Server
 * Standalone server that relays aing hook events to connected browser clients.
 *
 * Usage: node server/norch-server.mjs [--port 4819]
 */

import { WebSocketServer } from "ws";
import { createServer } from "http";
import { createServer as createNetServer } from "net";
import { existsSync, unlinkSync } from "fs";

const PORT = parseInt(process.argv.find((_, i, a) => a[i - 1] === "--port") ?? "4819", 10);
const UNIX_SOCK = "/tmp/norch.sock";

// --- WebSocket Server (browser clients) ---

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[norch] client connected (${clients.size} total)`);

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[norch] client disconnected (${clients.size} total)`);
  });

  ws.on("error", () => {
    clients.delete(ws);
  });
});

function broadcast(data) {
  const msg = typeof data === "string" ? data : JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(msg);
    }
  }
}

httpServer.listen(PORT, () => {
  console.log(`[norch] WebSocket server listening on ws://localhost:${PORT}`);
});

// --- Unix Socket Server (hook bridge) ---

if (existsSync(UNIX_SOCK)) {
  unlinkSync(UNIX_SOCK);
}

const unixServer = createNetServer((socket) => {
  let buffer = "";

  socket.on("data", (chunk) => {
    buffer += chunk.toString();

    // Process complete JSON messages (newline-delimited)
    let newlineIdx;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);

      if (!line) continue;

      try {
        const event = JSON.parse(line);
        // Add timestamp if missing
        if (!event.timestamp) {
          event.timestamp = Date.now();
        }
        broadcast(event);
        console.log(`[norch] event: ${event.type}${event.agent?.name ? ` (${event.agent.name})` : ""}`);
      } catch (err) {
        console.error(`[norch] parse error: ${err.message}`);
      }
    }
  });

  socket.on("error", () => {});
});

unixServer.listen(UNIX_SOCK, () => {
  console.log(`[norch] Unix socket listening on ${UNIX_SOCK}`);
});

// --- Graceful shutdown ---

function shutdown() {
  console.log("\n[norch] shutting down...");
  wss.close();
  httpServer.close();
  unixServer.close();
  if (existsSync(UNIX_SOCK)) unlinkSync(UNIX_SOCK);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
