"use client";

import { useState, useEffect } from "react";
import { useNorchWebSocket } from "@/lib/useWebSocket";
import { useNorchStore } from "@/lib/store";
import Office from "@/components/Office";
import ActivityTimeline from "@/components/ActivityTimeline";
import AgentDetailPanel from "@/components/AgentDetailPanel";
import type { AgentName } from "@/lib/types";

export default function NorchPage() {
  useNorchWebSocket();
  const [selectedAgent, setSelectedAgent] = useState<AgentName | null>(null);

  // ?expanded=true 쿼리 감지 — Swift WKWebView에서 확장 모드로 열림
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsExpanded(params.get("expanded") === "true");
  }, []);

  // 확장 모드: Office + Timeline
  if (isExpanded) {
    return (
      <main className="h-screen w-full overflow-hidden flex flex-col text-zinc-100 rounded-2xl" style={{ background: "#09090b" }}>
        {/* 상단 핸들 */}
        <div className="h-8 shrink-0 flex items-center justify-center">
          <div className="w-8 h-1 rounded-full bg-zinc-700" />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-0">
          {!selectedAgent ? (
            <Office onSelectAgent={(name) => setSelectedAgent(name as AgentName)} />
          ) : (
            <AgentDetailPanel
              agentName={selectedAgent}
              onClose={() => setSelectedAgent(null)}
            />
          )}

          <div className="h-52">
            <ActivityTimeline />
          </div>
        </div>
      </main>
    );
  }

  // 기본: 빈 페이지 (Swift 네이티브 NotchBar가 표시됨)
  return <main className="h-screen w-full bg-transparent" />;
}
