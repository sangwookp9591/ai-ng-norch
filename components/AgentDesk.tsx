"use client";

import { useState } from "react";
import type { AgentMeta, AgentStatus } from "@/lib/types";
import StatusBubble from "./StatusBubble";

interface AgentDeskProps {
  agent: AgentMeta;
  status: AgentStatus;
  index: number;
  onSelect: (name: string) => void;
}

export default function AgentDesk({ agent, status, index, onSelect }: AgentDeskProps) {
  const [hovered, setHovered] = useState(false);
  const isWorking = status.state === "working";
  const isError = status.state === "error";
  const isWaiting = status.state === "waiting";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(agent.name)}
      className={`group relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
        hovered ? "-translate-y-1" : ""
      }`}
      style={{ animation: `fadeInUp 0.4s ease-out ${index * 0.06}s both` }}
    >
      {/* Status bubble */}
      <StatusBubble state={status.state} tool={status.currentTool} />

      {/* Character */}
      <div
        className={`relative transition-all duration-300 ${
          isWorking ? "animate-bob" : ""
        } ${hovered ? "-translate-y-1" : ""}`}
      >
        <img
          src={agent.icon}
          alt={agent.name}
          width={32}
          height={32}
          className={`relative z-10 transition-all duration-300 ${
            isError ? "saturate-0 brightness-75" : ""
          } ${isWaiting ? "opacity-60" : ""}`}
          style={{ imageRendering: "pixelated" }}
        />
        {/* Working glow */}
        {isWorking && (
          <div
            className="absolute inset-0 rounded-full blur-md opacity-30 -z-0"
            style={{ backgroundColor: agent.screenColor }}
          />
        )}
      </div>

      {/* Desk with monitor */}
      <svg
        width="56"
        height="28"
        viewBox="0 0 18 9"
        className={`-mt-1 transition-all duration-300 ${hovered ? "drop-shadow-lg" : ""}`}
        style={{ imageRendering: "pixelated" as never }}
      >
        {/* Monitor */}
        <rect x="4" y="0" width="10" height="5" rx="0.5" fill="#374151" />
        <rect
          x="5"
          y="1"
          width="8"
          height="3"
          fill={isError ? "#ef4444" : agent.screenColor}
          opacity={isWorking || hovered ? 1 : 0.35}
          className={isWorking ? "animate-flicker" : ""}
        />
        {/* Monitor stand */}
        <rect x="8" y="5" width="2" height="1" fill="#4b5563" />
        <rect x="6" y="6" width="6" height="0.5" fill="#6b7280" />
        {/* Desk surface */}
        <rect x="0" y="7" width="18" height="2" rx="0.3" fill="#78350f" />
        <rect x="0" y="7" width="18" height="0.5" fill="#92400e" />
      </svg>

      {/* Name tag */}
      <span
        className={`mt-0.5 text-[10px] font-bold transition-colors duration-200 ${
          hovered ? "text-aing-primary" : isWorking ? "text-zinc-200" : "text-zinc-500"
        }`}
      >
        {agent.name}
      </span>
      <span className="text-[10px] text-zinc-600">{agent.role}</span>

      {/* Hover tooltip: model info */}
      {hovered && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bubble">
          <span className="text-[9px] font-mono text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 whitespace-nowrap">
            {agent.model} · {agent.dept}
          </span>
        </div>
      )}
    </div>
  );
}
