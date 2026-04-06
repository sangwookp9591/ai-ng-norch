export type AgentName =
  | "Sam" | "Able" | "Klay" | "Jay" | "Jerry"
  | "Milla" | "Jun" | "Willji" | "Iron" | "Rowan"
  | "Derek" | "Simon" | "Kain" | "Ryan" | "Noa"
  | "Critic" | "Hugg" | "Jo" | "Teacher"
  | "Progress-Checker" | "Figma-Reader";

export type AgentState = "idle" | "working" | "waiting" | "error" | "done";

export type PdcaPhase = "plan" | "do" | "check" | "act" | "review";

export interface AgentMeta {
  name: AgentName;
  icon: string;
  role: string;
  dept: string;
  model: "opus" | "sonnet" | "haiku";
  screenColor: string;
}

export interface AgentStatus {
  name: AgentName;
  state: AgentState;
  currentTool?: string;
  currentTarget?: string;
  message?: string;
  startedAt?: number;
  updatedAt: number;
}

export interface NorchEvent {
  type:
    | "agent-spawn"
    | "agent-working"
    | "agent-idle"
    | "agent-done"
    | "tool-use"
    | "pdca-change"
    | "error"
    | "session-start"
    | "session-end"
    | "review-pipeline"
    | "ship-workflow"
    | "cso-audit"
    | "benchmark";
  sessionId: string;
  timestamp: number;
  agent?: {
    name: AgentName;
    role: string;
    model: string;
  };
  tool?: {
    name: string;
    target?: string;
  };
  pdca?: {
    phase: PdcaPhase;
    step?: string;
  };
  message?: string;
}

export interface TimelineEntry {
  id: string;
  event: NorchEvent;
  timestamp: number;
}
