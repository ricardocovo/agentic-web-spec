"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, FileText, Code } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/context";
import { getAgent, getNextAgent } from "@/lib/agents";
import { ChatInterface } from "@/components/ChatInterface";
import {
  createSession,
  addMessageToSession,
  getSession,
  addActivity,
  Message,
  Session,
} from "@/lib/storage";

const AGENT_ICONS = {
  "deep-research": Search,
  prd: FileText,
  "technical-docs": Code,
};

export default function AgentPage({ params }: { params: { slug: string } }) {
  const { activeRepo, pat } = useApp();
  const router = useRouter();
  const agent = getAgent(params.slug);
  const nextAgent = getNextAgent(params.slug);

  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const sessionRef = useRef<Session | null>(null);

  // Redirect if no active repo
  useEffect(() => {
    if (!activeRepo) router.push("/");
  }, [activeRepo, router]);

  // Init session
  useEffect(() => {
    if (!agent || !activeRepo) return;

    // Check for pre-loaded context from handoff (stored in sessionStorage)
    const handoffKey = `web_spec_handoff_${params.slug}`;
    const handoffContext = typeof window !== "undefined" ? sessionStorage.getItem(handoffKey) : null;

    const newSession = createSession(agent.slug, agent.name, activeRepo.fullName);

    if (handoffContext) {
      const contextMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `📎 Context from previous agent:\n\n${handoffContext}`,
        createdAt: Date.now(),
      };
      newSession.messages = [contextMsg];
      addMessageToSession(newSession.id, { role: "assistant", content: contextMsg.content });
      sessionStorage.removeItem(handoffKey);
    }

    setSession(newSession);
    sessionRef.current = newSession;
    setMessages(newSession.messages);
  // activeRepo.fullName is intentionally included so the session resets when the repo switches
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug, activeRepo?.fullName]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!session || !activeRepo) return;

      // Add user message
      const updated = addMessageToSession(session.id, { role: "user", content });
      if (!updated) return;

      setMessages([...updated.messages]);
      sessionRef.current = updated;
      setIsStreaming(true);
      setStreamingContent("");

      addActivity({
        type: "message_sent",
        agentSlug: params.slug,
        repoFullName: activeRepo.fullName,
        description: `${agent?.name}: "${content.slice(0, 60)}..."`,
      });

      // Build context from previous messages
      const context = updated.messages
        .filter((m) => m.role === "assistant" && !m.content.startsWith("📎"))
        .map((m) => m.content)
        .join("\n\n");

      try {
        const res = await fetch("/api/backend/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentSlug: params.slug,
            prompt: content,
            repoPath: activeRepo.localPath,
            context: context || undefined,
          }),
        });

        if (!res.ok || !res.body) {
          const errData = (await res.json()) as { error?: string };
          throw new Error(errData.error || "Agent request failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let currentEvent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
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
              } else if (currentEvent === "error") {
                try {
                  const msg = JSON.parse(line.slice(6)) as string;
                  throw new Error(msg);
                } catch (e) {
                  if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e;
                }
              }
            }
          }
        }

        // Save assistant response
        const finalSession = addMessageToSession(session.id, {
          role: "assistant",
          content: accumulated || "⚠️ No response received. Check that the Copilot CLI is installed and authenticated (`copilot --version`).",
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
      }
    },
    [session, activeRepo, params.slug, agent]
  );

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
        nextAgent={nextAgent}
        onHandoff={handleHandoff}
        disabled={!activeRepo}
      />
    </div>
  );
}
