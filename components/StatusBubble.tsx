"use client";

import type { AgentState } from "@/lib/types";

const STATE_CONFIG: Record<AgentState, { label: string; icon: string; color: string }> = {
  idle: { label: "", icon: "", color: "" },
  working: { label: "working", icon: "", color: "bg-blue-500" },
  waiting: { label: "waiting", icon: "", color: "bg-amber-500" },
  error: { label: "error", icon: "", color: "bg-red-500" },
  done: { label: "done", icon: "", color: "bg-emerald-500" },
};

interface StatusBubbleProps {
  state: AgentState;
  tool?: string;
}

export default function StatusBubble({ state, tool }: StatusBubbleProps) {
  if (state === "idle") return null;

  const config = STATE_CONFIG[state];
  const label = tool ? tool : config.label;

  return (
    <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 animate-bubble">
      <div
        className={`${config.color} text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-lg relative`}
      >
        {label}
        {/* Bubble tail */}
        <div
          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${config.color} rotate-45 rounded-[1px]`}
        />
      </div>
    </div>
  );
}
