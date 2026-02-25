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

export interface AgentAction {
  label: string;
  description: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  onClick: () => void;
}

export const AGENTS: AgentConfig[] = [
  {
    slug: "deep-research",
    name: "Deep Research",
    shortName: "Research",
    description: "Performs deep research and detailed information analysis on your codebase and topic.",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
    iconColor: "#4dabff",
    nextAgent: "prd",
  },
  {
    slug: "prd",
    name: "Product Requirements Document",
    shortName: "PRD",
    description: "Generates complete and structured product requirements documents.",
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/20",
    iconColor: "#00e676",
    nextAgent: "technical-docs",
  },
  {
    slug: "technical-docs",
    name: "Technical Documents",
    shortName: "Tech Docs",
    description: "Creates detailed technical documentation and specifications ready for development.",
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/20",
    iconColor: "#ff8c42",
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
