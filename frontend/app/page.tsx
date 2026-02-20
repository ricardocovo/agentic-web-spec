"use client";

import { ArrowRight, Search, FileText, Code, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { AGENTS, AgentConfig } from "@/lib/agents";

const AGENT_ICONS = {
  "deep-research": Search,
  prd: FileText,
  "technical-docs": Code,
};

function AgentCard({ agent, disabled }: { agent: AgentConfig; disabled: boolean }) {
  const Icon = AGENT_ICONS[agent.slug as keyof typeof AGENT_ICONS] ?? FileText;

  const card = (
    <div
      className={`group relative flex flex-col h-full p-6 rounded-xl border transition-all duration-200 ${
        disabled
          ? "border-border bg-surface opacity-50 cursor-not-allowed"
          : `${agent.borderColor} ${agent.bgColor} hover:scale-[1.02] hover:shadow-xl cursor-pointer`
      }`}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: `${agent.iconColor}20` }}
      >
        <Icon size={22} style={{ color: agent.iconColor }} />
      </div>

      {/* Content */}
      <h3 className="font-semibold text-text-primary text-base mb-2">{agent.name}</h3>
      <p className="text-sm text-text-secondary leading-relaxed flex-1">{agent.description}</p>

      {/* Arrow */}
      {!disabled && (
        <div className="flex justify-end mt-4">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ backgroundColor: `${agent.iconColor}20`, color: agent.iconColor }}
          >
            <ArrowRight size={16} />
          </span>
        </div>
      )}
    </div>
  );

  if (disabled) return card;

  return (
    <Link href={`/agents/${agent.slug}`} className="block h-full">
      {card}
    </Link>
  );
}

export default function AgentsPage() {
  const { activeRepo } = useApp();
  const disabled = !activeRepo;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Heading */}
      <div className="text-center mb-12 pt-8">
        <h1 className="text-4xl font-bold mb-3">
          <span className="text-text-primary">Welcome to </span>
          <span className="text-text-primary">Web</span>
          <span className="text-accent">-Spec</span>
        </h1>
        <p className="text-text-secondary text-lg">
          Select the agent that best fits your needs to start your work session.
        </p>
      </div>

      {/* No repo warning */}
      {disabled && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 mb-8 max-w-xl mx-auto">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            Select a GitHub repository above before starting an agent session.
          </p>
        </div>
      )}

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {AGENTS.map((agent) => (
          <AgentCard key={agent.slug} agent={agent} disabled={disabled} />
        ))}
      </div>
    </div>
  );
}
