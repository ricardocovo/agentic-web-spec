"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard, MessageSquare, GitBranch, Search, FileText, Code, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSessions, getActivity, Session, ActivityEvent } from "@/lib/storage";
import { getAgent } from "@/lib/agents";

const AGENT_ICONS = {
  "deep-research": Search,
  prd: FileText,
  "technical-docs": Code,
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActivityIcon({ type }: { type: ActivityEvent["type"] }) {
  switch (type) {
    case "session_created":
      return <MessageSquare size={12} className="text-blue-400" />;
    case "agent_handoff":
      return <ArrowRight size={12} className="text-purple-400" />;
    case "repo_cloned":
      return <GitBranch size={12} className="text-green-400" />;
    default:
      return <MessageSquare size={12} className="text-muted" />;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    setSessions(getSessions());
    setActivity(getActivity());
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard size={22} className="text-accent" />
        <h1 className="text-2xl font-display font-bold text-text-primary">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions list — 2/3 width */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Recent Sessions
          </h2>

          {sessions.length === 0 ? (
            <div className="border border-border rounded-xl bg-surface p-8 text-center">
              <MessageSquare size={28} className="text-muted mx-auto mb-2" />
              <p className="text-text-secondary text-sm font-medium">No sessions yet</p>
              <p className="text-muted text-xs mt-1">
                Start a conversation with an agent to see it here.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-3"
              >
                Go to Agents
                <ArrowRight size={10} />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => {
                const agent = getAgent(session.agentSlug);
                const Icon = agent
                  ? (AGENT_ICONS[agent.slug as keyof typeof AGENT_ICONS] ?? FileText)
                  : FileText;

                return (
                  <a
                    key={session.id}
                    href={`/agents/${session.agentSlug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      sessionStorage.setItem(
                        `web_spec_resume_${session.agentSlug}`,
                        session.id
                      );
                      router.push(`/agents/${session.agentSlug}`);
                    }}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface hover:bg-surface-2 hover:border-l-2 hover:border-accent transition-all group"
                  >
                    {/* Agent icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${agent?.iconColor ?? "#666"}20` }}
                    >
                      <Icon size={15} style={{ color: agent?.iconColor ?? "#666" }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {session.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted">{agent?.shortName ?? session.agentSlug}</span>
                        <span className="text-muted text-xs">·</span>
                        <span className="text-xs text-muted">{session.repoFullName}</span>
                        <span className="text-muted text-xs">·</span>
                        <span className="text-xs text-muted">{formatDate(session.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Message count */}
                    <div className="flex items-center gap-1 text-xs text-muted flex-shrink-0">
                      <MessageSquare size={11} />
                      {session.messages.length}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity log — 1/3 width */}
        <div>
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Activity
          </h2>

          {activity.length === 0 ? (
            <div className="border border-border rounded-xl bg-surface p-6 text-center">
              <p className="text-muted text-xs">No activity yet</p>
            </div>
          ) : (
            <div className="border border-border rounded-xl bg-surface divide-y divide-border/50 overflow-hidden font-mono text-xs">
              {activity.slice(0, 30).map((event) => (
                <div key={event.id} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <ActivityIcon type={event.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {event.description}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{formatDate(event.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
