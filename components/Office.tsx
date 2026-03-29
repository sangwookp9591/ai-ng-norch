"use client";

import { useNorchStore } from "@/lib/store";
import { AGENT_MAP, OFFICE_ROW_1, OFFICE_ROW_2 } from "@/lib/agents";
import AgentDesk from "./AgentDesk";
import PdcaIndicator from "./PdcaIndicator";

interface OfficeProps {
  onSelectAgent: (name: string) => void;
}

export default function Office({ onSelectAgent }: OfficeProps) {
  const agents = useNorchStore((s) => s.agents);
  const pdcaPhase = useNorchStore((s) => s.pdcaPhase);
  const sessionActive = useNorchStore((s) => s.sessionActive);
  const connected = useNorchStore((s) => s.connected);

  const activeCount = Object.values(agents).filter(
    (a) => a.state === "working"
  ).length;

  return (
    <div className="bg-aing-surface rounded-xl border border-aing-border p-3 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-bold text-zinc-400">aing</h2>
          <div className="flex items-center gap-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                connected
                  ? sessionActive
                    ? "bg-emerald-400 animate-work"
                    : "bg-emerald-400"
                  : "bg-zinc-600"
              }`}
            />
            <span className="text-[9px] font-mono text-zinc-500">
              {connected
                ? sessionActive
                  ? `${activeCount}/${OFFICE_ROW_1.length + OFFICE_ROW_2.length}`
                  : "idle"
                : "offline"}
            </span>
          </div>
        </div>
        <PdcaIndicator currentPhase={pdcaPhase} />
      </div>

      {/* Office grid — 6 columns, 2 rows */}
      <div className="space-y-3">
        <div className="grid grid-cols-6 gap-x-1 mx-auto">
          {OFFICE_ROW_1.map((name, i) => {
            const meta = AGENT_MAP[name];
            const status = agents[name];
            return (
              <AgentDesk key={name} agent={meta} status={status} index={i} onSelect={onSelectAgent} />
            );
          })}
        </div>

        <div className="flex justify-center gap-0.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-0.5 h-0.5 rounded-full bg-zinc-800" />
          ))}
        </div>

        <div className="grid grid-cols-6 gap-x-1 mx-auto">
          {OFFICE_ROW_2.map((name, i) => {
            const meta = AGENT_MAP[name];
            const status = agents[name];
            return (
              <AgentDesk key={name} agent={meta} status={status} index={i + 6} onSelect={onSelectAgent} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
