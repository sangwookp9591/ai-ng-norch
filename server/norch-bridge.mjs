#!/usr/bin/env node

/**
 * norch Bridge
 * Called from aing hook handlers to relay events to norch-server via Unix socket.
 *
 * Usage: node server/norch-bridge.mjs '{"type":"agent-spawn","agent":{"name":"Jay"}}'
 *
 * Or pipe from stdin:
 *   echo '{"type":"agent-spawn"}' | node server/norch-bridge.mjs
 */

import { connect } from "net";

const UNIX_SOCK = "/tmp/norch.sock";

function send(event) {
  return new Promise((resolve) => {
    const socket = connect(UNIX_SOCK, () => {
      const payload = JSON.stringify({
        ...event,
        timestamp: event.timestamp ?? Date.now(),
      });
      socket.write(payload + "\n", () => {
        socket.end();
        resolve(true);
      });
    });

    socket.on("error", () => {
      // norch server not running — silently ignore
      resolve(false);
    });

    // Timeout after 500ms
    setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 500);
  });
}

// --- CLI entry point ---

async function main() {
  // Argument mode: norch-bridge.mjs '{"type":"..."}'
  const arg = process.argv[2];
  if (arg) {
    try {
      const event = JSON.parse(arg);
      await send(event);
    } catch (err) {
      console.error(`[norch-bridge] parse error: ${err.message}`);
    }
    return;
  }

  // Stdin mode: pipe JSON
  let data = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    data += chunk;
  }

  if (data.trim()) {
    try {
      const event = JSON.parse(data.trim());
      await send(event);
    } catch (err) {
      console.error(`[norch-bridge] parse error: ${err.message}`);
    }
  }
}

main();

export { send };
