import type { AgentMeta, AgentName } from "./types";

export const AGENTS: AgentMeta[] = [
  { name: "Sam", icon: "/agents/sam.svg", role: "CTO", dept: "CTO", model: "opus", screenColor: "#a78bfa" },
  { name: "Simon", icon: "/agents/simon.svg", role: "CEO / 제품 전략", dept: "경영", model: "opus", screenColor: "#94a3b8" },
  { name: "Able", icon: "/agents/able.svg", role: "기획", dept: "기획", model: "sonnet", screenColor: "#60a5fa" },
  { name: "Klay", icon: "/agents/klay.svg", role: "설계", dept: "기획", model: "opus", screenColor: "#5eead4" },
  { name: "Ryan", icon: "/agents/ryan.svg", role: "원칙 도출", dept: "기획", model: "sonnet", screenColor: "#84cc16" },
  { name: "Noa", icon: "/agents/noa.svg", role: "합의 검증", dept: "기획", model: "sonnet", screenColor: "#14b8a6" },
  { name: "Critic", icon: "/agents/critic.svg", role: "심의 비평", dept: "기획", model: "opus", screenColor: "#ef4444" },
  { name: "Jay", icon: "/agents/jay.svg", role: "API", dept: "백엔드", model: "sonnet", screenColor: "#fb923c" },
  { name: "Jerry", icon: "/agents/jerry.svg", role: "DB", dept: "백엔드", model: "sonnet", screenColor: "#fbbf24" },
  { name: "Milla", icon: "/agents/milla.svg", role: "보안", dept: "백엔드", model: "sonnet", screenColor: "#4ade80" },
  { name: "Jun", icon: "/agents/jun.svg", role: "성능", dept: "백엔드", model: "sonnet", screenColor: "#f97316" },
  { name: "Kain", icon: "/agents/kain.svg", role: "코드분석", dept: "백엔드", model: "sonnet", screenColor: "#64748b" },
  { name: "Willji", icon: "/agents/willji.svg", role: "디자인", dept: "디자인", model: "sonnet", screenColor: "#f9a8d4" },
  { name: "Iron", icon: "/agents/iron.svg", role: "화면", dept: "프론트", model: "sonnet", screenColor: "#d946ef" },
  { name: "Rowan", icon: "/agents/rowan.svg", role: "모션", dept: "프론트", model: "sonnet", screenColor: "#a3e635" },
  { name: "Derek", icon: "/agents/derek.svg", role: "모바일", dept: "모바일", model: "sonnet", screenColor: "#22d3ee" },
  { name: "Hugg", icon: "/agents/hugg.svg", role: "AI 모델 리서치", dept: "AI", model: "sonnet", screenColor: "#fbbf24" },
  { name: "Jo", icon: "/agents/jo.svg", role: "AI 구현", dept: "AI", model: "sonnet", screenColor: "#818cf8" },
  { name: "Teacher", icon: "/agents/teacher.svg", role: "교육", dept: "교육", model: "sonnet", screenColor: "#8b5cf6" },
  { name: "Progress-Checker", icon: "/agents/progress.svg", role: "진행도 분석", dept: "PDCA", model: "sonnet", screenColor: "#06b6d4" },
  { name: "Figma-Reader", icon: "/agents/figma.svg", role: "Figma 분석", dept: "디자인", model: "sonnet", screenColor: "#f472b6" },
];

export const AGENT_MAP: Record<string, AgentMeta> = Object.fromEntries(
  AGENTS.map((a) => [a.name, a])
);

/** Office grid layout: 3 rows */
export const OFFICE_ROW_1: AgentName[] = ["Sam", "Simon", "Able", "Klay", "Ryan", "Noa", "Critic"];
export const OFFICE_ROW_2: AgentName[] = ["Jay", "Jerry", "Milla", "Jun", "Kain", "Hugg", "Jo"];
export const OFFICE_ROW_3: AgentName[] = ["Willji", "Iron", "Rowan", "Derek", "Teacher", "Progress-Checker", "Figma-Reader"];
