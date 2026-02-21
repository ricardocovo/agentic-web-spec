"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, ArrowRight, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Message } from "@/lib/storage";
import { AgentConfig } from "@/lib/agents";

interface ChatInterfaceProps {
  agent: AgentConfig;
  messages: Message[];
  onSend: (content: string) => Promise<void>;
  isStreaming: boolean;
  streamingContent: string;
  nextAgent?: AgentConfig;
  onHandoff?: () => void;
  disabled?: boolean;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

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
        className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
          isUser
            ? "bg-accent/15 text-text-primary rounded-tr-sm whitespace-pre-wrap"
            : "bg-surface-2 border border-border text-text-primary rounded-tl-sm"
        }`}
      >
        {isUser ? (
          msg.content
        ) : (
          <div className="md-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
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
  nextAgent,
  onHandoff,
  disabled,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming || disabled) return;
    setInput("");
    await onSend(text);
  }, [input, isStreaming, disabled, onSend]);

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
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
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

        {isStreaming && streamingContent && (
          <StreamingBubble content={streamingContent} agentColor={agent.iconColor} />
        )}

        {isStreaming && !streamingContent && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-surface-2">
              <Loader2 size={14} className="text-text-secondary animate-spin" />
            </div>
            <div className="px-4 py-3 rounded-xl rounded-tl-sm bg-surface-2 border border-border text-muted text-sm">
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Handoff button */}
      {showHandoff && (
        <div className="py-3 flex justify-center">
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
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border pt-4">
        <div className="flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Select a repository to start chatting" : `Message ${agent.shortName}...`}
            disabled={disabled || isStreaming}
            rows={1}
            className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted resize-none focus:outline-none focus:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ maxHeight: "120px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
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
    </div>
  );
}
