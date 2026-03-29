"use client";

import { useState } from "react";
import { useNorchStore } from "@/lib/store";
import { AGENTS } from "@/lib/agents";
import type { AgentMeta } from "@/lib/types";

declare global {
  interface Window {
    norch?: {
      toggle: () => void;
      collapse: () => void;
      mouseEnter: () => void;
      mouseLeave: () => void;
      onExpand: (cb: (expanded: boolean) => void) => void;
      onEvent: (cb: (event: unknown) => void) => void;
    };
    webkit?: { messageHandlers: { norch: { postMessage: (msg: string) => void } } };
  }
}

const SPRITE_SIZE = 36;

export default function NotchBar({ onExpand }: { onExpand: () => void }) {
  const agents = useNorchStore((s) => s.agents);
  const sessionActive = useNorchStore((s) => s.sessionActive);
  const [hovered, setHovered] = useState(false);

  const leftAgents = AGENTS.slice(0, 5);
  const rightAgents = AGENTS.slice(5, 10);

  const pickSentinel = (list: AgentMeta[]) => {
    const working = list.find((a) => agents[a.name]?.state === "working");
    return working ?? list[0];
  };

  const handleMouseEnter = () => {
    setHovered(true);
    window.norch?.mouseEnter();
  };
  const handleMouseLeave = () => {
    setHovered(false);
    window.norch?.mouseLeave();
  };

  const leftDisplay = hovered ? leftAgents : [pickSentinel(leftAgents)];
  const rightDisplay = hovered ? rightAgents : [pickSentinel(rightAgents)];

  return (
    <div
      className="w-full h-full flex items-start justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onExpand}
      style={{ cursor: "pointer" }}
    >
      {/* Left panel */}
      <Panel agents={leftDisplay} side="left" sessionActive={sessionActive} expanded={hovered} />

      {/* Notch gap — 186px transparent */}
      <div style={{ width: 186, flexShrink: 0 }} />

      {/* Right panel */}
      <Panel agents={rightDisplay} side="right" sessionActive={sessionActive} expanded={hovered} />
    </div>
  );
}

function Panel({
  agents,
  side,
  sessionActive,
  expanded,
}: {
  agents: AgentMeta[];
  side: "left" | "right";
  sessionActive: boolean;
  expanded: boolean;
}) {
  const statuses = useNorchStore((s) => s.agents);

  // border-radius: 노치 쪽(안쪽)은 작게, 바깥쪽은 크게
  // 상단은 0 (노치에 붙어야 하니까)
  const radius = side === "left" ? "0 0 8px 20px" : "0 0 20px 8px";

  return (
    <div
      className="transition-all duration-300 ease-out flex items-end justify-center gap-1"
      style={{
        background: "#000",
        borderRadius: radius,
        padding: "8px 12px 12px",
        minHeight: 56,
      }}
    >
      {agents.map((agent) => {
        const status = statuses[agent.name];
        const isWorking = status?.state === "working";

        return (
          <div key={agent.name} className="relative flex flex-col items-center">
            {isWorking && (
              <div
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full animate-work z-10"
                style={{
                  backgroundColor: agent.screenColor,
                  boxShadow: `0 0 8px 2px ${agent.screenColor}`,
                }}
              />
            )}
            <img
              src={agent.icon}
              alt={agent.name}
              width={SPRITE_SIZE}
              height={SPRITE_SIZE}
              className={`transition-all duration-300 ${
                isWorking
                  ? "animate-bob"
                  : sessionActive
                    ? ""
                    : "opacity-40 grayscale-[50%]"
              }`}
              style={{
                imageRendering: "pixelated",
                filter: isWorking
                  ? `drop-shadow(0 0 6px ${agent.screenColor}60)`
                  : undefined,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
