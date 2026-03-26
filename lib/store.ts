"use client";

import { create } from "zustand";
import type { AgentName, AgentState, AgentStatus, NorchEvent, PdcaPhase, TimelineEntry } from "./types";
import { AGENTS } from "./agents";

const MAX_TIMELINE = 200;

interface NorchStore {
  /** Per-agent status */
  agents: Map<AgentName, AgentStatus>;
  /** Event timeline (newest first) */
  timeline: TimelineEntry[];
  /** Current PDCA phase */
  pdcaPhase: PdcaPhase | null;
  /** Session active */
  sessionActive: boolean;
  /** Connection status */
  connected: boolean;

  /** Actions */
  processEvent: (event: NorchEvent) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

function makeInitialAgents(): Map<AgentName, AgentStatus> {
  const map = new Map<AgentName, AgentStatus>();
  for (const agent of AGENTS) {
    map.set(agent.name, {
      name: agent.name,
      state: "idle",
      updatedAt: Date.now(),
    });
  }
  return map;
}

export const useNorchStore = create<NorchStore>((set) => ({
  agents: makeInitialAgents(),
  timeline: [],
  pdcaPhase: null,
  sessionActive: false,
  connected: false,

  setConnected: (connected) => set({ connected }),

  reset: () =>
    set({
      agents: makeInitialAgents(),
      timeline: [],
      pdcaPhase: null,
      sessionActive: false,
    }),

  processEvent: (event) =>
    set((state) => {
      const agents = new Map(state.agents);
      let { pdcaPhase, sessionActive } = state;

      // Update agent state based on event type
      if (event.agent) {
        const name = event.agent.name;
        const existing = agents.get(name);
        const base: AgentStatus = existing ?? {
          name,
          state: "idle",
          updatedAt: Date.now(),
        };

        let newState: AgentState = base.state;
        switch (event.type) {
          case "agent-spawn":
          case "agent-working":
            newState = "working";
            break;
          case "agent-idle":
          case "agent-done":
            newState = "idle";
            break;
          case "error":
            newState = "error";
            break;
          case "tool-use":
            newState = "working";
            break;
        }

        agents.set(name, {
          ...base,
          state: newState,
          currentTool: event.tool?.name ?? base.currentTool,
          currentTarget: event.tool?.target ?? base.currentTarget,
          message: event.message ?? base.message,
          startedAt: newState === "working" && base.state !== "working" ? Date.now() : base.startedAt,
          updatedAt: Date.now(),
        });
      }

      // PDCA phase change
      if (event.type === "pdca-change" && event.pdca) {
        pdcaPhase = event.pdca.phase;
      }

      // Session lifecycle
      if (event.type === "session-start") sessionActive = true;
      if (event.type === "session-end") sessionActive = false;

      // Add to timeline
      const entry: TimelineEntry = {
        id: `${event.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
        event,
        timestamp: event.timestamp,
      };
      const timeline = [entry, ...state.timeline].slice(0, MAX_TIMELINE);

      return { agents, timeline, pdcaPhase, sessionActive };
    }),
}));
