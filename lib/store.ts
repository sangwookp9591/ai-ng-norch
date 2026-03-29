"use client";

import { create } from "zustand";
import type { AgentName, AgentState, AgentStatus, NorchEvent, PdcaPhase, TimelineEntry } from "./types";
import { AGENTS } from "./agents";

const MAX_TIMELINE = 200;

type AgentMap = Record<string, AgentStatus>;

interface NorchStore {
  agents: AgentMap;
  timeline: TimelineEntry[];
  pdcaPhase: PdcaPhase | null;
  sessionActive: boolean;
  connected: boolean;

  processEvent: (event: NorchEvent) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

function makeInitialAgents(): AgentMap {
  const map: AgentMap = {};
  for (const agent of AGENTS) {
    map[agent.name] = {
      name: agent.name,
      state: "idle",
      updatedAt: Date.now(),
    };
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
      const agents = { ...state.agents };
      let { pdcaPhase, sessionActive } = state;

      if (event.agent) {
        const name = event.agent.name;
        const base: AgentStatus = agents[name] ?? {
          name,
          state: "idle",
          updatedAt: Date.now(),
        };

        let newState: AgentState = base.state;
        switch (event.type) {
          case "agent-spawn":
          case "agent-working":
          case "tool-use":
            newState = "working";
            break;
          case "agent-idle":
          case "agent-done":
            newState = "idle";
            break;
          case "error":
            newState = "error";
            break;
        }

        agents[name] = {
          ...base,
          state: newState,
          currentTool: event.tool?.name ?? base.currentTool,
          currentTarget: event.tool?.target ?? base.currentTarget,
          message: event.message ?? base.message,
          startedAt: newState === "working" && base.state !== "working" ? Date.now() : base.startedAt,
          updatedAt: Date.now(),
        };
      }

      if (event.type === "pdca-change" && event.pdca) {
        pdcaPhase = event.pdca.phase;
      }
      if (event.type === "session-start") sessionActive = true;
      if (event.type === "session-end") sessionActive = false;

      const entry: TimelineEntry = {
        id: `${event.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
        event,
        timestamp: event.timestamp,
      };
      const timeline = [entry, ...state.timeline].slice(0, MAX_TIMELINE);

      return { agents, timeline, pdcaPhase, sessionActive };
    }),
}));
