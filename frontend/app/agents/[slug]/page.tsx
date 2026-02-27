"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, FileText, Code, GitPullRequest, CircleDot } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { getAgent, getNextAgent } from "@/lib/agents";
import { ChatInterface } from "@/components/ChatInterface";
import { ActionPanel } from "@/components/ActionPanel";
import type { AgentAction } from "@/lib/agents";
import type { WorkIQResult } from "@/components/WorkIQModal";
import {
  createSession,
  addMessageToSession,
  addActivity,
  getSession,
  Message,
  Session,
} from "@/lib/storage";

const AGENT_ICONS = {
  "deep-research": Search,
  prd: FileText,
  "technical-docs": Code,
};

export default function AgentPage({ params }: { params: { slug: string } }) {
  const { activeRepo, pat, featureFlags } = useApp();
  const router = useRouter();
  const agent = getAgent(params.slug);
  const nextAgent = getNextAgent(params.slug);

  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingReasoning, setStreamingReasoning] = useState("");
  const sessionRef = useRef<Session | null>(null);
  const [actionPanel, setActionPanel] = useState<{
    title: string;
    agentSlug: string;
    prompt: string;
  } | null>(null);

  // Redirect if no active repo
  useEffect(() => {
    if (!activeRepo) router.push("/");
  }, [activeRepo, router]);

  // Init session
  useEffect(() => {
    if (!agent || !activeRepo) return;

    // Check for a session to resume (set by the dashboard via sessionStorage)
    const resumeKey = `web_spec_resume_${params.slug}`;
    const resumeSessionId =
      typeof window !== "undefined" ? sessionStorage.getItem(resumeKey) : null;

    if (resumeSessionId) {
      // NOTE: We intentionally do NOT remove the key here — React Strict Mode
      // double-fires effects, so the second run would miss the value.  The key
      // is cleared in handleSend once the session has been consumed.
      const existing = getSession(resumeSessionId);
      if (existing) {
        setSession(existing);
        sessionRef.current = existing;
        setMessages(existing.messages);
        return;
      }
    }

    // Check for pre-loaded context from handoff (stored in sessionStorage).
    // NOTE: We intentionally do NOT remove the key here — React Strict Mode
    // double-fires effects, so the second run would miss the value.  The key
    // is cleared in handleSend once the context has been consumed.
    const handoffKey = `web_spec_handoff_${params.slug}`;
    const handoffContext = typeof window !== "undefined" ? sessionStorage.getItem(handoffKey) : null;

    const newSession = createSession(agent.slug, agent.name, activeRepo.fullName);

    if (handoffContext) {
      const updatedSession = addMessageToSession(newSession.id, {
        role: "assistant",
        content: `📎 Context from previous agent:\n\n${handoffContext}`,
      });

      if (updatedSession) {
        setSession(updatedSession);
        sessionRef.current = updatedSession;
        setMessages(updatedSession.messages);
        return;
      }
    }

    setSession(newSession);
    sessionRef.current = newSession;
    setMessages(newSession.messages);
  // activeRepo.fullName is intentionally included so the session resets when the repo switches
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug, activeRepo?.fullName]);

  const handleSend = useCallback(
    async (content: string, selectedSpaces: string[], workiqItems?: WorkIQResult[]) => {
      if (!session || !activeRepo) return;

      // Add user message
      const updated = addMessageToSession(session.id, { role: "user", content });
      if (!updated) return;

      setMessages([...updated.messages]);
      sessionRef.current = updated;
      setIsStreaming(true);
      setStreamingContent("");
      setStreamingReasoning("");

      addActivity({
        type: "message_sent",
        agentSlug: params.slug,
        repoFullName: activeRepo.fullName,
        description: `${agent?.name}: "${content.slice(0, 60)}..."`,
      });

      // Build context from previous messages, stripping the UI-only handoff prefix
      const HANDOFF_PREFIX = "📎 Context from previous agent:\n\n";
      const context = updated.messages
        .filter((m) => m.role === "assistant")
        .map((m) =>
          m.content.startsWith(HANDOFF_PREFIX)
            ? m.content.slice(HANDOFF_PREFIX.length)
            : m.content
        )
        .join("\n\n");

      // Clean up session-resume and handoff keys now that context has been consumed
      sessionStorage.removeItem(`web_spec_resume_${params.slug}`);
      sessionStorage.removeItem(`web_spec_handoff_${params.slug}`);

      try {
        const res = await fetch("/api/agent/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(selectedSpaces.length > 0 && pat ? { Authorization: `Bearer ${pat}` } : {}),
          },
          body: JSON.stringify({
            agentSlug: params.slug,
            prompt: content,
            repoPath: activeRepo.localPath,
            context: context || undefined,
            spaceRefs: selectedSpaces.length > 0 ? selectedSpaces : undefined,
            workiqContext: workiqItems?.map((item) => ({
              type: item.type,
              title: item.title,
              summary: item.summary,
            })),
          }),
        });

        if (!res.ok || !res.body) {
          const errData = (await res.json()) as { error?: string };
          throw new Error(errData.error || "Agent request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let accumulatedReasoning = "";
        let currentEvent = "";
        let lineBuffer = "";

        const processLine = (line: string) => {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            if (currentEvent === "chunk") {
              try {
                const data = JSON.parse(line.slice(6)) as string;
                accumulated += data;
                setStreamingContent(accumulated);
              } catch {
                // ignore parse errors
              }
            } else if (currentEvent === "reasoning") {
              try {
                const data = JSON.parse(line.slice(6)) as string;
                accumulatedReasoning += data;
                setStreamingReasoning(accumulatedReasoning);
              } catch {
                // ignore parse errors
              }
            } else if (currentEvent === "error") {
              try {
                const msg = JSON.parse(line.slice(6)) as string;
                throw new Error(msg);
              } catch (e) {
                if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e;
              }
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const combined = lineBuffer + text;
          const lines = combined.split("\n");

          // Process all complete lines; keep last (potentially partial) segment in buffer
          for (let i = 0; i < lines.length - 1; i++) {
            processLine(lines[i]);
          }
          lineBuffer = lines[lines.length - 1];
        }

        // Process any remaining partial line in the buffer
        if (lineBuffer) {
          processLine(lineBuffer);
        }

        // Save assistant response
        const finalSession = addMessageToSession(session.id, {
          role: "assistant",
          content: accumulated || "⚠️ No response received. Check that the Copilot CLI is installed and authenticated (`copilot --version`).",
          reasoning: accumulatedReasoning || undefined,
        });

        if (finalSession) {
          setMessages([...finalSession.messages]);
          sessionRef.current = finalSession;
        }
      } catch (err) {
        const errorContent =
          err instanceof Error
            ? `⚠️ Error: ${err.message}`
            : "⚠️ An unexpected error occurred.";

        const finalSession = addMessageToSession(session.id, {
          role: "assistant",
          content: errorContent,
        });

        if (finalSession) {
          setMessages([...finalSession.messages]);
          sessionRef.current = finalSession;
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
        setStreamingReasoning("");
      }
    },
    [session, activeRepo, params.slug, agent, pat]
  );

  function handleCreatePRD() {
    if (!activeRepo || !sessionRef.current) return;
    const lastAssistant = [...sessionRef.current.messages]
      .reverse()
      .find((m) => m.role === "assistant" && !m.content.startsWith("📎"));
    if (!lastAssistant) return;
    setActionPanel({
      title: "Create PRD on Repo",
      agentSlug: "prd-writer",
      prompt: `Create PRD document in the repository.\n\nRepository path: ${activeRepo.localPath}\nRepository: ${activeRepo.fullName}`,
    });
  }

  function handleCreateSpecs() {
    if (!activeRepo || !sessionRef.current) return;
    const lastAssistant = [...sessionRef.current.messages]
      .reverse()
      .find((m) => m.role === "assistant" && !m.content.startsWith("📎"));
    if (!lastAssistant) return;
    setActionPanel({
      title: "Create Docs on Repo",
      agentSlug: "spec-writer",
      prompt: `Create spec files in the repository.\n\nRepository path: ${activeRepo.localPath}\nRepository: ${activeRepo.fullName}`,
    });
  }

  function handleCreateIssues() {
    if (!activeRepo || !sessionRef.current) return;
    const lastAssistant = [...sessionRef.current.messages]
      .reverse()
      .find((m) => m.role === "assistant" && !m.content.startsWith("📎"));
    if (!lastAssistant) return;
    setActionPanel({
      title: "Create GitHub Issues",
      agentSlug: "issue-creator",
      prompt: `Create GitHub issues from the specification.\n\nRepository: ${activeRepo.fullName}`,
    });
  }

  function handleHandoff() {
    if (!nextAgent || !sessionRef.current) return;

    // Store last assistant message as handoff context
    const lastAssistant = [...sessionRef.current.messages]
      .reverse()
      .find((m) => m.role === "assistant" && !m.content.startsWith("📎"));

    if (lastAssistant) {
      sessionStorage.setItem(`web_spec_handoff_${nextAgent.slug}`, lastAssistant.content);
    }

    addActivity({
      type: "agent_handoff",
      agentSlug: nextAgent.slug,
      repoFullName: activeRepo?.fullName,
      description: `Handed off from ${agent?.name} to ${nextAgent.name}`,
    });

    router.push(`/agents/${nextAgent.slug}`);
  }

  if (!agent) {
    return (
      <div className="text-center py-20 text-muted">
        <p>Agent not found.</p>
        <Link href="/" className="text-accent hover:underline text-sm mt-2 block">
          ← Back to agents
        </Link>
      </div>
    );
  }

  const Icon = AGENT_ICONS[agent.slug as keyof typeof AGENT_ICONS] ?? FileText;

  const agentActions: AgentAction[] | undefined =
    agent.slug === "prd"
      ? [
          ...(featureFlags.generatePrd ? [{ label: "Create PRD on Repo", description: "Create a branch with the PRD document in the repo", icon: GitPullRequest, onClick: handleCreatePRD }] : []),
        ].filter(Boolean) as AgentAction[]
      : agent.slug === "technical-docs"
      ? [
          ...(featureFlags.generateTechSpecs ? [{ label: "Create Docs on Repo", description: "Create a branch with spec files in the repo", icon: GitPullRequest, onClick: handleCreateSpecs }] : []),
          ...(featureFlags.createGithubIssues ? [{ label: "Create GitHub Issues", description: "Create GitHub issues from the spec", icon: CircleDot, onClick: handleCreateIssues }] : []),
        ]
      : undefined;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="p-2 rounded-lg text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>

        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${agent.iconColor}20` }}
        >
          <Icon size={18} style={{ color: agent.iconColor }} />
        </div>

        <div>
          <h1 className="font-semibold text-text-primary text-base">{agent.name}</h1>
          {activeRepo && (
            <p className="text-xs text-muted">{activeRepo.fullName}</p>
          )}
        </div>
      </div>

      {/* Chat */}
      <ChatInterface
        agent={agent}
        messages={messages}
        onSend={handleSend}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        streamingReasoning={streamingReasoning}
        nextAgent={nextAgent}
        onHandoff={handleHandoff}
        disabled={!activeRepo}
        agentActions={agentActions}
      />
      {actionPanel && activeRepo && pat && (
        <ActionPanel
          title={actionPanel.title}
          agentSlug={actionPanel.agentSlug}
          prompt={actionPanel.prompt}
          repoPath={activeRepo.localPath}
          context={
            [...(sessionRef.current?.messages ?? [])]
              .reverse()
              .find((m) => m.role === "assistant" && !m.content.startsWith("📎"))
              ?.content ?? ""
          }
          pat={pat}
          onClose={() => setActionPanel(null)}
        />
      )}
    </div>
  );
}
