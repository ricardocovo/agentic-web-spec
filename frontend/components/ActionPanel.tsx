"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, CheckCircle, XCircle, X, GitBranch, FileText, GitPullRequest, Upload, Terminal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const PROGRESS_HINTS: { pattern: RegExp; label: string; icon: "branch" | "file" | "push" | "pr" | "terminal" }[] = [
  { pattern: /git checkout -b|creating.*branch|new branch/i, label: "Creating branch", icon: "branch" },
  { pattern: /mkdir|writing.*spec|write.*spec|creating.*directory|specs\//i, label: "Writing spec files", icon: "file" },
  { pattern: /git add|git commit|staging|committing/i, label: "Committing changes", icon: "terminal" },
  { pattern: /git push|pushing/i, label: "Pushing to remote", icon: "push" },
  { pattern: /gh pr create|pull request|creating.*pr/i, label: "Opening pull request", icon: "pr" },
  { pattern: /gh issue|creating.*issue/i, label: "Creating issues", icon: "terminal" },
];

const STEP_ICONS = {
  branch: GitBranch,
  file: FileText,
  push: Upload,
  pr: GitPullRequest,
  terminal: Terminal,
};

interface ActionPanelProps {
  title: string;
  agentSlug: string;
  prompt: string;
  repoPath: string;
  context: string;
  pat: string;
  onClose: () => void;
}

export function ActionPanel({ title, agentSlug, prompt, repoPath, context, pat, onClose }: ActionPanelProps) {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"streaming" | "done" | "error">("streaming");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressSteps, setProgressSteps] = useState<{ label: string; icon: keyof typeof STEP_ICONS }[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const seenStepsRef = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/agent/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${pat}`,
          },
          body: JSON.stringify({ agentSlug, prompt, repoPath, context }),
        });

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          setErrorMsg(err.error || "Request failed");
          setStatus("error");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let currentEvent = "";
        let lineBuffer = "";

        const processLine = (line: string) => {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            if (currentEvent === "chunk") {
              try {
                const data = JSON.parse(line.slice(6));
                accumulated += data;
                if (!cancelled) setContent(accumulated);
              } catch {}
            } else if (currentEvent === "reasoning") {
              try {
                const data = JSON.parse(line.slice(6)) as string;
                for (const hint of PROGRESS_HINTS) {
                  if (hint.pattern.test(data) && !seenStepsRef.current.has(hint.label)) {
                    seenStepsRef.current.add(hint.label);
                    if (!cancelled) setProgressSteps((prev) => [...prev, { label: hint.label, icon: hint.icon }]);
                  }
                }
              } catch {}
            } else if (currentEvent === "error") {
              try {
                const msg = JSON.parse(line.slice(6));
                if (!cancelled) { setErrorMsg(msg); setStatus("error"); }
              } catch {}
            } else if (currentEvent === "done") {
              if (!cancelled) setStatus("done");
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const combined = lineBuffer + text;
          const lines = combined.split("\n");
          for (let i = 0; i < lines.length - 1; i++) processLine(lines[i]);
          lineBuffer = lines[lines.length - 1];
        }
        if (lineBuffer) processLine(lineBuffer);
        if (!cancelled && status === "streaming") setStatus("done");
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : "Connection failed");
          setStatus("error");
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, []); // intentionally run once on mount

  // Auto-scroll
  useEffect(() => {
    contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight });
  }, [content, progressSteps]);

  // Escape key to close (only when not streaming)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && status !== "streaming") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [status, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-2 border border-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {status === "streaming" && <Loader2 size={18} className="text-accent animate-spin" />}
            {status === "done" && <CheckCircle size={18} className="text-green-400" />}
            {status === "error" && <XCircle size={18} className="text-red-400" />}
            <h2 className="text-sm font-semibold text-text-primary">
              {status === "streaming" ? `Creating…` : status === "done" ? `Done ✓` : `Failed ✗`}
              {" — "}{title}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={status === "streaming"}
            className="p-1.5 rounded-md text-muted hover:text-text-primary hover:bg-surface-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Close panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-5 py-4">
          {content ? (
            <div className="md-content text-sm text-text-primary">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children, ...props }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  ),
                }}
              >{content}</ReactMarkdown>
            </div>
          ) : status === "streaming" ? (
            <div className="flex flex-col gap-3 py-6">
              {progressSteps.length === 0 ? (
                <div className="flex items-center gap-3 text-muted text-sm animate-[fadeIn_0.4s_ease-in-out]">
                  <Loader2 size={16} className="text-accent animate-spin" />
                  Starting up…
                </div>
              ) : (
                progressSteps.map((step, i) => {
                  const StepIcon = STEP_ICONS[step.icon];
                  const isLatest = i === progressSteps.length - 1;
                  return (
                    <div
                      key={step.label}
                      className="flex items-center gap-3 text-sm animate-[fadeIn_0.4s_ease-in-out]"
                    >
                      {isLatest ? (
                        <Loader2 size={16} className="text-accent animate-spin flex-shrink-0" />
                      ) : (
                        <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                      )}
                      <StepIcon size={14} className={isLatest ? "text-accent flex-shrink-0" : "text-green-400 flex-shrink-0"} />
                      <span className={isLatest ? "text-text-primary" : "text-muted"}>
                        {step.label}{isLatest ? "…" : ""}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
          {status === "error" && errorMsg && (
            <div className="mt-3 p-3 rounded-lg bg-red-400/10 border border-red-400/20 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            disabled={status === "streaming"}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-surface-2 border border-border text-text-primary hover:bg-surface-2/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
