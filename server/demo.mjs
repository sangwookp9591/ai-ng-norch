#!/usr/bin/env node

/**
 * norch Demo Script
 * Simulates aing agent activity for testing the UI without actual Claude Code sessions.
 *
 * Usage: node server/demo.mjs
 * (Requires norch-server.mjs to be running)
 */

import { connect } from "net";

const UNIX_SOCK = "/tmp/norch.sock";

const AGENTS = [
  { name: "Sam", role: "CTO / Boil the Lake", model: "opus" },
  { name: "Able", role: "기획 / Office Hours 6-question", model: "sonnet" },
  { name: "Klay", role: "설계", model: "opus" },
  { name: "Jay", role: "API", model: "sonnet" },
  { name: "Jerry", role: "DB", model: "sonnet" },
  { name: "Milla", role: "보안 / CSO 14-phase 보안 감사", model: "sonnet" },
  { name: "Jun", role: "성능", model: "sonnet" },
  { name: "Willji", role: "디자인 / AI Slop Detection", model: "sonnet" },
  { name: "Iron", role: "화면", model: "sonnet" },
  { name: "Rowan", role: "모션", model: "sonnet" },
  { name: "Derek", role: "모바일", model: "sonnet" },
  { name: "Simon", role: "코드분석", model: "sonnet" },
  { name: "Progress-Checker", role: "진행점검", model: "sonnet" },
  { name: "Figma-Reader", role: "피그마분석", model: "sonnet" },
];

const TOOLS = ["Read", "Write", "Edit", "Bash", "Grep", "Glob", "Agent"];
const FILES = [
  "src/api/auth.ts",
  "src/components/Button.tsx",
  "src/db/schema.ts",
  "src/middleware.ts",
  "package.json",
  "src/app/layout.tsx",
];

function send(event) {
  return new Promise((resolve) => {
    const socket = connect(UNIX_SOCK, () => {
      socket.write(JSON.stringify({ ...event, timestamp: Date.now() }) + "\n", () => {
        socket.end();
        resolve(true);
      });
    });
    socket.on("error", () => resolve(false));
    setTimeout(() => { socket.destroy(); resolve(false); }, 500);
  });
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runDemo() {
  console.log("[demo] Starting norch demo simulation...\n");

  // Session start
  await send({ type: "session-start", sessionId: "demo-001", message: "데모 세션 시작" });
  console.log("[demo] Session started");
  await sleep(1000);

  // PDCA: Plan
  await send({ type: "pdca-change", sessionId: "demo-001", pdca: { phase: "plan", step: "요구사항 분석" } });
  console.log("[demo] PDCA → Plan");
  await sleep(500);

  // Able starts planning
  const able = AGENTS.find((a) => a.name === "Able");
  await send({ type: "agent-spawn", sessionId: "demo-001", agent: able, message: "요구사항 분석 시작" });
  console.log("[demo] Able spawned");
  await sleep(2000);

  // Klay explores codebase
  const klay = AGENTS.find((a) => a.name === "Klay");
  await send({ type: "agent-spawn", sessionId: "demo-001", agent: klay, message: "코드베이스 탐색" });
  await send({ type: "tool-use", sessionId: "demo-001", agent: klay, tool: { name: "Glob", target: "src/**/*.ts" } });
  console.log("[demo] Klay exploring codebase");
  await sleep(2000);

  // Plan done, move to Do
  await send({ type: "agent-done", sessionId: "demo-001", agent: able, message: "계획 수립 완료" });
  await send({ type: "pdca-change", sessionId: "demo-001", pdca: { phase: "do", step: "구현 시작" } });
  console.log("[demo] PDCA → Do");
  await sleep(500);

  // Multiple agents working
  const workers = ["Jay", "Derek", "Jerry"];
  for (const name of workers) {
    const agent = AGENTS.find((a) => a.name === name);
    await send({ type: "agent-spawn", sessionId: "demo-001", agent, message: `${agent.role} 작업 시작` });
    await sleep(300);
  }
  console.log("[demo] Workers spawned: Jay, Derek, Jerry");

  // Simulate tool use
  for (let i = 0; i < 8; i++) {
    await sleep(1500 + Math.random() * 2000);
    const workerName = pick(workers);
    const agent = AGENTS.find((a) => a.name === workerName);
    const tool = pick(TOOLS);
    const target = pick(FILES);
    await send({
      type: "tool-use",
      sessionId: "demo-001",
      agent,
      tool: { name: tool, target },
      message: `${tool} → ${target}`,
    });
    console.log(`[demo] ${workerName}: ${tool} → ${target}`);
  }

  // Check phase
  await send({ type: "pdca-change", sessionId: "demo-001", pdca: { phase: "check", step: "검증" } });
  console.log("[demo] PDCA → Check");
  await sleep(500);

  // Milla security review
  const milla = AGENTS.find((a) => a.name === "Milla");
  await send({ type: "agent-spawn", sessionId: "demo-001", agent: milla, message: "보안 리뷰 시작" });
  await sleep(3000);

  // Sam final review
  const sam = AGENTS.find((a) => a.name === "Sam");
  await send({ type: "agent-spawn", sessionId: "demo-001", agent: sam, message: "최종 검증" });
  await sleep(2000);

  // Complete
  for (const name of [...workers, "Klay", "Milla", "Sam"]) {
    const agent = AGENTS.find((a) => a.name === name);
    await send({ type: "agent-done", sessionId: "demo-001", agent, message: "작업 완료" });
    await sleep(200);
  }

  await send({ type: "pdca-change", sessionId: "demo-001", pdca: { phase: "review", step: "완료" } });
  await send({ type: "session-end", sessionId: "demo-001", message: "세션 완료" });
  console.log("\n[demo] Demo complete!");
}

runDemo().catch(console.error);
