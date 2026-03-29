import type { AgentMeta, AgentName } from "./types";

export const AGENTS: AgentMeta[] = [
  { name: "Sam", icon: "/agents/sam.svg", role: "CTO", dept: "CTO", model: "opus", screenColor: "#a78bfa" },
  { name: "Able", icon: "/agents/able.svg", role: "기획", dept: "기획", model: "sonnet", screenColor: "#60a5fa" },
  { name: "Klay", icon: "/agents/klay.svg", role: "설계", dept: "기획", model: "opus", screenColor: "#5eead4" },
  { name: "Jay", icon: "/agents/jay.svg", role: "API", dept: "백엔드", model: "sonnet", screenColor: "#fb923c" },
  { name: "Jerry", icon: "/agents/jerry.svg", role: "DB", dept: "백엔드", model: "sonnet", screenColor: "#fbbf24" },
  { name: "Milla", icon: "/agents/milla.svg", role: "보안", dept: "백엔드", model: "sonnet", screenColor: "#4ade80" },
  { name: "Jun", icon: "/agents/jun.svg", role: "성능", dept: "백엔드", model: "sonnet", screenColor: "#f97316" },
  { name: "Willji", icon: "/agents/willji.svg", role: "디자인", dept: "디자인", model: "sonnet", screenColor: "#f9a8d4" },
  { name: "Iron", icon: "/agents/iron.svg", role: "화면", dept: "프론트", model: "sonnet", screenColor: "#d946ef" },
  { name: "Rowan", icon: "/agents/rowan.svg", role: "모션", dept: "프론트", model: "sonnet", screenColor: "#a3e635" },
  { name: "Derek", icon: "/agents/derek.svg", role: "모바일", dept: "모바일", model: "sonnet", screenColor: "#22d3ee" },
  { name: "Simon", icon: "/agents/simon.svg", role: "코드분석", dept: "분석", model: "sonnet", screenColor: "#94a3b8" },
  { name: "Progress-Checker", icon: "/agents/progress-checker.svg", role: "진행점검", dept: "분석", model: "sonnet", screenColor: "#cbd5e1" },
  { name: "Figma-Reader", icon: "/agents/figma-reader.svg", role: "피그마분석", dept: "디자인", model: "sonnet", screenColor: "#c084fc" },
];

export const AGENT_MAP: Record<string, AgentMeta> = Object.fromEntries(
  AGENTS.map((a) => [a.name, a])
);

/** Office grid layout: row 1 (management + design), row 2 (backend + frontend) */
export const OFFICE_ROW_1: AgentName[] = ["Sam", "Able", "Klay", "Willji", "Iron", "Rowan", "Figma-Reader"];
export const OFFICE_ROW_2: AgentName[] = ["Jay", "Jerry", "Milla", "Jun", "Derek", "Simon", "Progress-Checker"];
