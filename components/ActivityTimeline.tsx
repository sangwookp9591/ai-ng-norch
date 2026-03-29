"use client";

import { useState } from "react";
import { useNorchStore } from "@/lib/store";
import { AGENT_MAP } from "@/lib/agents";
import type { AgentName, NorchEvent } from "@/lib/types";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function eventLabel(event: NorchEvent): string {
  switch (event.type) {
    case "agent-spawn": return "투입";
    case "agent-working": return "작업 시작";
    case "agent-idle": return "대기";
    case "agent-done": return "완료";
    case "tool-use": return event.tool?.name ?? "도구 사용";
    case "pdca-change": return `PDCA → ${event.pdca?.phase}`;
    case "error": return "오류 발생";
    case "session-start": return "세션 시작";
    case "session-end": return "세션 종료";
    default: return event.type;
  }
}

function eventIcon(type: NorchEvent["type"]): string {
  switch (type) {
    case "agent-spawn": return "+";
    case "agent-working": return ">";
    case "agent-idle": return "-";
    case "agent-done": return "o";
    case "tool-use": return "*";
    case "pdca-change": return "~";
    case "error": return "!";
    case "session-start": return ">";
    case "session-end": return "x";
    default: return "•";
  }
}

export default function ActivityTimeline() {
  const timeline = useNorchStore((s) => s.timeline);
  const [filter, setFilter] = useState<AgentName | "all">("all");

  const filtered =
    filter === "all"
      ? timeline
      : timeline.filter((e) => e.event.agent?.name === filter);

  const activeAgents = new Set(
    timeline
      .map((e) => e.event.agent?.name)
      .filter(Boolean) as AgentName[]
  );

  return (
    <div className="bg-aing-surface rounded-2xl border border-aing-border p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-zinc-300">활동 타임라인</h3>
        <span className="text-[10px] font-mono text-zinc-600">
          {timeline.length} events
        </span>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1 mb-3 flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
            filter === "all"
              ? "bg-aing-primary text-white"
              : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
          }`}
        >
          전체
        </button>
        {Array.from(activeAgents).map((name) => {
          const meta = AGENT_MAP[name];
          return (
            <button
              key={name}
              onClick={() => setFilter(name)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                filter === name
                  ? "text-white"
                  : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
              style={filter === name ? { backgroundColor: meta?.screenColor ?? "#3b82f6" } : {}}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Timeline list */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <span className="text-xs text-zinc-600">no events yet</span>
          </div>
        ) : (
          filtered.map((entry) => {
            const { event } = entry;
            const agentMeta = event.agent
              ? AGENT_MAP[event.agent.name]
              : null;

            return (
              <div
                key={entry.id}
                className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors animate-slide-in"
              >
                {/* Time */}
                <span className="text-[10px] font-mono text-zinc-600 w-16 shrink-0 pt-0.5">
                  {formatTime(entry.timestamp)}
                </span>

                {/* Icon */}
                <span className="text-xs shrink-0">{eventIcon(event.type)}</span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {agentMeta && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: agentMeta.screenColor + "20",
                          color: agentMeta.screenColor,
                        }}
                      >
                        {agentMeta.name}
                      </span>
                    )}
                    <span className="text-xs text-zinc-300">
                      {eventLabel(event)}
                    </span>
                  </div>
                  {event.message && (
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {event.message}
                    </p>
                  )}
                  {event.tool?.target && (
                    <p className="text-[10px] font-mono text-zinc-600 truncate mt-0.5">
                      {event.tool.target}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
