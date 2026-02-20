export interface AgentConfig {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  nextAgent?: string;
}

export const AGENTS: AgentConfig[] = [
  {
    slug: "deep-research",
    name: "Deep Research",
    shortName: "Research",
    description: "Performs deep research and detailed information analysis on your codebase and topic.",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    iconColor: "#3b82f6",
    nextAgent: "prd",
  },
  {
    slug: "prd",
    name: "Product Requirements Document",
    shortName: "PRD",
    description: "Generates complete and structured product requirements documents.",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    iconColor: "#22c55e",
    nextAgent: "technical-docs",
  },
  {
    slug: "technical-docs",
    name: "Technical Documents",
    shortName: "Tech Docs",
    description: "Creates detailed technical documentation and specifications ready for development.",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    iconColor: "#f97316",
    nextAgent: undefined,
  },
];

export function getAgent(slug: string): AgentConfig | undefined {
  return AGENTS.find((a) => a.slug === slug);
}

export function getNextAgent(slug: string): AgentConfig | undefined {
  const current = getAgent(slug);
  return current?.nextAgent ? getAgent(current.nextAgent) : undefined;
}
