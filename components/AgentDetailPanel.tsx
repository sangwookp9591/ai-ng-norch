"use client";

import { useNorchStore } from "@/lib/store";
import { AGENT_MAP } from "@/lib/agents";
import type { AgentName } from "@/lib/types";

interface AgentDetailPanelProps {
  agentName: AgentName;
  onClose: () => void;
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}m ${rem}s`;
}

export default function AgentDetailPanel({ agentName, onClose }: AgentDetailPanelProps) {
  const status = useNorchStore((s) => s.agents.get(agentName));
  const timeline = useNorchStore((s) =>
    s.timeline.filter((e) => e.event.agent?.name === agentName)
  );
  const meta = AGENT_MAP.get(agentName);

  if (!status || !meta) return null;

  const elapsed = status.startedAt ? Date.now() - status.startedAt : null;

  return (
    <div className="bg-aing-surface rounded-2xl border border-aing-border p-5 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={meta.icon}
            alt={meta.name}
            width={32}
            height={32}
            style={{ imageRendering: "pixelated" }}
          />
          <div>
            <h3 className="text-sm font-bold text-zinc-200">{meta.name}</h3>
            <p className="text-[10px] text-zinc-500">
              {meta.role} · {meta.dept} · {meta.model}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Status card */}
      <div
        className="rounded-lg p-3 mb-4 border"
        style={{
          backgroundColor: meta.screenColor + "10",
          borderColor: meta.screenColor + "30",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                status.state === "working"
                  ? "bg-blue-400 animate-work"
                  : status.state === "error"
                    ? "bg-red-400"
                    : "bg-zinc-600"
              }`}
            />
            <span className="text-xs font-bold text-zinc-300">
              {status.state === "idle" && "대기 중"}
              {status.state === "working" && "작업 중"}
              {status.state === "waiting" && "대기 중"}
              {status.state === "error" && "오류 발생"}
              {status.state === "done" && "완료"}
            </span>
          </div>
          {elapsed !== null && status.state === "working" && (
            <span className="text-[10px] font-mono text-zinc-500">
              {formatDuration(elapsed)}
            </span>
          )}
        </div>
        {status.currentTool && (
          <p className="text-[10px] font-mono text-zinc-400 mt-1.5">
            {status.currentTool}
            {status.currentTarget && ` → ${status.currentTarget}`}
          </p>
        )}
        {status.message && (
          <p className="text-[10px] text-zinc-500 mt-1">{status.message}</p>
        )}
      </div>

      {/* Recent activity */}
      <div>
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
          최근 활동
        </h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {timeline.length === 0 ? (
            <p className="text-[10px] text-zinc-600">활동 기록 없음</p>
          ) : (
            timeline.slice(0, 20).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 text-[10px] py-1"
              >
                <span className="font-mono text-zinc-600 w-14 shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span className="text-zinc-400">{entry.event.type}</span>
                {entry.event.tool && (
                  <span className="text-zinc-500 font-mono truncate">
                    {entry.event.tool.name}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
