#!/usr/bin/env node

/**
 * norch Combined Launcher
 * Starts Next.js standalone server + WebSocket/Unix socket relay in one process.
 * Bundled inside norch.app/Contents/Resources/server/
 */

import { spawn } from "child_process";
import { createServer } from "http";
import { createServer as createNetServer } from "net";
import { existsSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const NEXT_PORT = parseInt(process.env.PORT ?? "3819", 10);
const WS_PORT = parseInt(process.env.WS_PORT ?? "4819", 10);
const UNIX_SOCK = "/tmp/norch.sock";

// --- 1. Next.js standalone server ---

const serverJs = join(__dirname, "server.js");
if (!existsSync(serverJs)) {
  console.error(`[norch] server.js not found at ${serverJs}`);
  process.exit(1);
}

const nextProc = spawn(process.execPath, [serverJs], {
  cwd: __dirname,
  env: {
    ...process.env,
    PORT: String(NEXT_PORT),
    HOSTNAME: "localhost",
  },
  stdio: "inherit",
});

nextProc.on("error", (err) => {
  console.error(`[norch] Next.js failed to start: ${err.message}`);
});

// --- 2. WebSocket relay (for browser/WebView clients) ---

// Dynamic import ws (bundled alongside)
let WebSocketServer;
try {
  const ws = await import("ws");
  WebSocketServer = ws.WebSocketServer;
} catch {
  // Fallback: try from node_modules relative to script
  const ws = await import(join(__dirname, "node_modules", "ws", "index.js"));
  WebSocketServer = ws.WebSocketServer;
}

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });
const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
  ws.on("error", () => clients.delete(ws));
});

function broadcast(data) {
  const msg = typeof data === "string" ? data : JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

httpServer.listen(WS_PORT, () => {
  console.log(`[norch] WebSocket relay on ws://localhost:${WS_PORT}`);
});

// --- 3. Unix socket relay (receives events from aing hooks) ---

if (existsSync(UNIX_SOCK)) unlinkSync(UNIX_SOCK);

const unixServer = createNetServer((socket) => {
  let buffer = "";
  socket.on("data", (chunk) => {
    buffer += chunk.toString();
    let idx;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        const event = JSON.parse(line);
        if (!event.timestamp) event.timestamp = Date.now();
        broadcast(event);
      } catch {}
    }
  });
  socket.on("error", () => {});
});

unixServer.listen(UNIX_SOCK, () => {
  console.log(`[norch] Unix socket on ${UNIX_SOCK}`);
});

// --- Graceful shutdown ---

function shutdown() {
  console.log("[norch] shutting down...");
  nextProc.kill("SIGTERM");
  wss.close();
  httpServer.close();
  unixServer.close();
  if (existsSync(UNIX_SOCK)) unlinkSync(UNIX_SOCK);
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
nextProc.on("exit", (code) => {
  if (code !== null) shutdown();
});
