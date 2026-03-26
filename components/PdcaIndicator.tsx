"use client";

import type { PdcaPhase } from "@/lib/types";

const PHASES: { key: PdcaPhase; label: string }[] = [
  { key: "plan", label: "P" },
  { key: "do", label: "D" },
  { key: "check", label: "C" },
  { key: "act", label: "A" },
  { key: "review", label: "R" },
];

interface PdcaIndicatorProps {
  currentPhase: PdcaPhase | null;
}

export default function PdcaIndicator({ currentPhase }: PdcaIndicatorProps) {
  return (
    <div className="flex items-center gap-0.5">
      {PHASES.map((phase, i) => {
        const isActive = phase.key === currentPhase;
        const isPast =
          currentPhase !== null &&
          PHASES.findIndex((p) => p.key === currentPhase) > i;

        return (
          <div key={phase.key} className="flex items-center">
            <div
              className={`w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold transition-all duration-300 ${
                isActive
                  ? "bg-aing-primary text-white"
                  : isPast
                    ? "bg-zinc-700 text-zinc-400"
                    : "bg-zinc-800/50 text-zinc-600"
              }`}
            >
              {phase.label}
            </div>
            {i < PHASES.length - 1 && (
              <div className={`w-1.5 h-px ${isPast ? "bg-zinc-600" : "bg-zinc-800"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
