#!/usr/bin/env node

/**
 * norch ← aing Adapter
 *
 * Drop-in integration for aing hook handlers.
 * Import and call `notifyNorch()` from any hook handler to relay events.
 *
 * Usage in aing hook handlers:
 *
 *   import { notifyNorch } from '<path-to>/norch/server/aing-adapter.mjs';
 *
 *   // In session-start hook:
 *   notifyNorch.sessionStart(sessionId);
 *
 *   // In pre-tool-use hook:
 *   notifyNorch.toolUse({ toolName, toolInput, agentName });
 *
 *   // In stop hook:
 *   notifyNorch.sessionEnd(sessionId);
 *
 * All calls are fire-and-forget — they never block or throw.
 */

import { connect } from "net";

const UNIX_SOCK = "/tmp/norch.sock";

function sendEvent(event) {
  try {
    const socket = connect(UNIX_SOCK, () => {
      socket.write(
        JSON.stringify({ ...event, timestamp: event.timestamp ?? Date.now() }) + "\n",
        () => socket.end()
      );
    });
    socket.on("error", () => {});
    setTimeout(() => socket.destroy(), 300);
  } catch {
    // norch not running — silently ignore
  }
}

/**
 * Map aing agent subagent_type to agent metadata.
 * Falls back to generic if agent name not recognized.
 */
const AGENT_LOOKUP = {
  sam: { name: "Sam", role: "CTO / Boil the Lake", model: "opus" },
  able: { name: "Able", role: "기획 / Office Hours 6-question", model: "sonnet" },
  klay: { name: "Klay", role: "설계", model: "opus" },
  jay: { name: "Jay", role: "API", model: "sonnet" },
  jerry: { name: "Jerry", role: "DB", model: "sonnet" },
  milla: { name: "Milla", role: "보안 / CSO 14-phase 보안 감사", model: "sonnet" },
  jun: { name: "Jun", role: "성능", model: "sonnet" },
  willji: { name: "Willji", role: "디자인 / AI Slop Detection", model: "sonnet" },
  iron: { name: "Iron", role: "화면", model: "sonnet" },
  rowan: { name: "Rowan", role: "모션", model: "sonnet" },
  derek: { name: "Derek", role: "모바일", model: "sonnet" },
  simon: { name: "Simon", role: "CEO / 제품 전략", model: "opus" },
  kain: { name: "Kain", role: "코드분석 / 정적 분석", model: "sonnet" },
  "progress-checker": { name: "Progress-Checker", role: "진행점검", model: "sonnet" },
  "figma-reader": { name: "Figma-Reader", role: "피그마분석", model: "sonnet" },
};

function resolveAgent(nameOrType) {
  if (!nameOrType) return null;
  const key = nameOrType.toLowerCase().replace(/^aing:/, "");
  return AGENT_LOOKUP[key] ?? null;
}

export const notifyNorch = {
  sessionStart(sessionId, message) {
    sendEvent({
      type: "session-start",
      sessionId: sessionId ?? "unknown",
      message: message ?? "세션 시작",
    });
  },

  sessionEnd(sessionId, message) {
    sendEvent({
      type: "session-end",
      sessionId: sessionId ?? "unknown",
      message: message ?? "세션 종료",
    });
  },

  agentSpawn(sessionId, agentNameOrType, message) {
    const agent = resolveAgent(agentNameOrType);
    if (!agent) return;
    sendEvent({
      type: "agent-spawn",
      sessionId: sessionId ?? "unknown",
      agent,
      message,
    });
  },

  agentDone(sessionId, agentNameOrType, message) {
    const agent = resolveAgent(agentNameOrType);
    if (!agent) return;
    sendEvent({
      type: "agent-done",
      sessionId: sessionId ?? "unknown",
      agent,
      message,
    });
  },

  toolUse({ sessionId, toolName, target, agentName, message }) {
    sendEvent({
      type: "tool-use",
      sessionId: sessionId ?? "unknown",
      agent: resolveAgent(agentName),
      tool: { name: toolName, target },
      message,
    });
  },

  pdcaChange(sessionId, phase, step) {
    sendEvent({
      type: "pdca-change",
      sessionId: sessionId ?? "unknown",
      pdca: { phase, step },
    });
  },

  error(sessionId, agentNameOrType, message) {
    const agent = resolveAgent(agentNameOrType);
    sendEvent({
      type: "error",
      sessionId: sessionId ?? "unknown",
      agent,
      message,
    });
  },

  reviewPipeline(sessionId, { tier, reviewer, status, message }) {
    sendEvent({
      type: "review-pipeline",
      sessionId: sessionId ?? "unknown",
      agent: resolveAgent(reviewer),
      review: { tier, status },
      message,
    });
  },

  shipStart(sessionId, message) {
    sendEvent({
      type: "ship-workflow",
      sessionId: sessionId ?? "unknown",
      ship: { step: "start" },
      message: message ?? "Ship 워크플로우 시작",
    });
  },

  shipStep(sessionId, step, message) {
    sendEvent({
      type: "ship-workflow",
      sessionId: sessionId ?? "unknown",
      ship: { step },
      message,
    });
  },

  shipComplete(sessionId, message) {
    sendEvent({
      type: "ship-workflow",
      sessionId: sessionId ?? "unknown",
      ship: { step: "complete" },
      message: message ?? "Ship 완료",
    });
  },

  csoAudit(sessionId, { phase, finding, severity, message }) {
    sendEvent({
      type: "cso-audit",
      sessionId: sessionId ?? "unknown",
      agent: resolveAgent("milla"),
      audit: { phase, finding, severity },
      message,
    });
  },
};

export default notifyNorch;
