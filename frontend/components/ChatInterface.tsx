"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, ArrowRight, User, Bot, Brain, ChevronDown, ChevronUp, Sparkles, BrainCircuit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/lib/storage";
import { AgentConfig, AgentAction } from "@/lib/agents";
import { SpaceSelector } from "@/components/SpaceSelector";
import { WorkIQModal, WorkIQResult } from "@/components/WorkIQModal";
import { WorkIQContextChips } from "@/components/WorkIQContextChips";
import { checkWorkIQStatus } from "@/lib/workiq";

interface ChatInterfaceProps {
  agent: AgentConfig;
  messages: Message[];
  onSend: (content: string, selectedSpaces: string[], workiqItems?: WorkIQResult[]) => Promise<void>;
  isStreaming: boolean;
  streamingContent: string;
  streamingReasoning?: string;
  nextAgent?: AgentConfig;
  onHandoff?: () => void;
  disabled?: boolean;
  agentActions?: AgentAction[];
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const [reasoningOpen, setReasoningOpen] = useState(false);

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isUser ? "bg-accent/20" : "bg-surface-2"
        }`}
      >
        {isUser ? (
          <User size={14} className="text-accent" />
        ) : (
          <Bot size={14} className="text-text-secondary" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-xl text-sm leading-relaxed ${
          isUser
            ? "px-4 py-3 border-l-4 border-accent bg-surface-2 text-text-primary rounded-tr-sm whitespace-pre-wrap"
            : "bg-surface-2 border border-border text-text-primary rounded-tl-sm"
        }`}
      >
        {isUser ? (
          msg.content
        ) : (
          <>
            {msg.reasoning && (
              <div className="border-b border-border">
                <button
                  onClick={() => setReasoningOpen((o) => !o)}
                  aria-expanded={reasoningOpen}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Brain size={12} className="flex-shrink-0" />
                  <span className="flex-1 text-left font-medium">
                    Thinking · {msg.reasoning.length} chars
                  </span>
                  {reasoningOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {reasoningOpen && (
                  <div className="max-h-64 overflow-y-auto px-4 pb-3 font-mono text-xs text-text-secondary whitespace-pre-wrap border-t border-border pt-2">
                    {msg.reasoning}
                  </div>
                )}
              </div>
            )}
            <div className="md-content px-4 py-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StreamingBubble({ content, agentColor }: { content: string; agentColor: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-surface-2">
        <Bot size={14} className="text-text-secondary" />
      </div>
      <div className="max-w-[80%] px-4 py-3 rounded-xl rounded-tl-sm text-sm leading-relaxed bg-surface-2 border border-border text-text-primary">
        <div className="md-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
        <span
          className="inline-block w-1.5 h-4 ml-0.5 align-text-bottom animate-pulse rounded-sm"
          style={{ backgroundColor: agentColor }}
        />
      </div>
    </div>
  );
}

export function ChatInterface({
  agent,
  messages,
  onSend,
  isStreaming,
  streamingContent,
  streamingReasoning,
  nextAgent,
  onHandoff,
  disabled,
  agentActions,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);
  const [isReasoningOpen, setIsReasoningOpen] = useState(true);
  const [workiqAvailable, setWorkiqAvailable] = useState(false);
  const [workiqModalOpen, setWorkiqModalOpen] = useState(false);
  const [workiqItems, setWorkiqItems] = useState<WorkIQResult[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check WorkIQ availability on mount
  useEffect(() => {
    checkWorkIQStatus().then(setWorkiqAvailable);
  }, []);

  // Auto-collapse reasoning block when first answer chunk arrives
  useEffect(() => {
    if (streamingContent && streamingContent.length > 0) {
      setIsReasoningOpen(false);
    }
  }, [streamingContent]);

  // Reset reasoning open state at the start of each new streaming session
  useEffect(() => {
    if (isStreaming && !streamingContent && !streamingReasoning) {
      setIsReasoningOpen(true);
    }
  }, [isStreaming, streamingContent, streamingReasoning]);

  useEffect(() => {
    // When the only message is the handoff context (assistant), scroll to top so
    // the "📎 Context from previous agent:" header is visible rather than the end
    // of a potentially very long deep-research response.
    if (messages.length === 1 && messages[0].role === "assistant" && !isStreaming) {
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent, isStreaming]);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming || disabled) return;
    setInput("");
    const itemsToSend = workiqItems.length > 0 ? [...workiqItems] : undefined;
    setWorkiqItems([]);
    await onSend(text, selectedSpaces, itemsToSend);
  }, [input, isStreaming, disabled, onSend, selectedSpaces, workiqItems]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const hasMessages = messages.length > 0;
  const showHandoff = hasMessages && !isStreaming && nextAgent && onHandoff;

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)]">
      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-16 text-muted text-sm">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: `${agent.iconColor}20` }}
            >
              <Bot size={24} style={{ color: agent.iconColor }} />
            </div>
            <p>Start a conversation with the {agent.name} agent.</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Reasoning block — shown during streaming whenever reasoning content exists */}
        {isStreaming && streamingReasoning && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-surface-2">
              <Brain size={14} className="text-text-secondary" />
            </div>
            <div className="flex-1 max-w-[80%] rounded-xl rounded-tl-sm bg-surface-2 border border-border overflow-hidden">
              <button
                onClick={() => setIsReasoningOpen((o) => !o)}
                aria-expanded={isReasoningOpen}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
              >
                <Brain size={12} className="flex-shrink-0" />
                <span className="flex-1 text-left font-medium">
                  Thinking · {streamingReasoning.length} chars
                </span>
                {isReasoningOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {isReasoningOpen && (
                <div className="max-h-64 overflow-y-auto px-4 pb-3 font-mono text-xs text-text-secondary whitespace-pre-wrap border-t border-border pt-2">
                  {streamingReasoning}
                </div>
              )}
            </div>
          </div>
        )}

        {isStreaming && streamingContent && (
          <StreamingBubble content={streamingContent} agentColor={agent.iconColor} />
        )}

        {isStreaming && !streamingContent && !streamingReasoning && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-2">
              <Loader2 size={14} className="text-text-secondary animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-surface-2 border border-border text-muted text-sm flex items-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: agent.iconColor }}
              />
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Handoff + Action buttons */}
      {hasMessages && !isStreaming && (showHandoff || (agentActions && agentActions.length > 0)) && (
        <div className="py-3 flex justify-center gap-3 flex-wrap">
          {agentActions?.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              title={action.description}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-surface-2 text-text-primary hover:border-accent hover:text-accent transition-colors"
            >
              {action.icon && <action.icon size={16} />}
              {action.label}
            </button>
          ))}
          {showHandoff && (
            <button
              onClick={onHandoff}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{
                borderColor: `${nextAgent.iconColor}40`,
                backgroundColor: `${nextAgent.iconColor}10`,
                color: nextAgent.iconColor,
              }}
            >
              Send to {nextAgent.name}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border pt-4">
        <WorkIQContextChips
          items={workiqItems}
          onRemove={(id) => setWorkiqItems((prev) => prev.filter((i) => i.id !== id))}
        />
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "Select a repository to start chatting" : `Message ${agent.shortName}...`}
              disabled={disabled || isStreaming}
              rows={1}
              className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 pr-10 text-sm text-text-primary placeholder:text-muted resize-none focus:outline-none focus:border-accent focus:shadow-glow-sm font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
            />
            {agent.quickPrompt && !input.trim() && !isStreaming && !disabled && (
              <button
                onClick={() => setInput(agent.quickPrompt!)}
                aria-label="Fill prompt suggestion"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:brightness-125"
                style={{ backgroundColor: `${agent.iconColor}20`, color: agent.iconColor }}
              >
                <Sparkles size={14} />
              </button>
            )}
          </div>
          {workiqAvailable && (
            <button
              type="button"
              onClick={() => setWorkiqModalOpen(true)}
              disabled={disabled || isStreaming}
              className="relative w-10 h-10 flex items-center justify-center bg-surface-2 border border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="Search Microsoft 365"
            >
              <BrainCircuit size={18} />
              {workiqItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {workiqItems.length}
                </span>
              )}
            </button>
          )}
          <SpaceSelector
            onSelectionChange={setSelectedSpaces}
            disabled={disabled || isStreaming}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming || disabled}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: agent.iconColor }}
          >
            {isStreaming ? (
              <Loader2 size={16} className="text-white animate-spin" />
            ) : (
              <Send size={16} className="text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted mt-2 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
      {workiqModalOpen && (
        <WorkIQModal
          onClose={() => setWorkiqModalOpen(false)}
          onAttach={(items) => setWorkiqItems((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newItems = items.filter((i) => !existingIds.has(i.id));
            return [...prev, ...newItems];
          })}
        />
      )}
    </div>
  );
}
