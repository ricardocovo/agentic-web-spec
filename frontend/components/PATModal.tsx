"use client";

import { useState } from "react";
import { X, Key, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useApp } from "@/lib/context";

interface PATModalProps {
  onClose: () => void;
}

export function PATModal({ onClose }: PATModalProps) {
  const { pat, username, setPat, clearAuth } = useApp();
  const [value, setValue] = useState(pat ? "••••••••••••••••••••" : "");
  const [isEditing, setIsEditing] = useState(!pat);
  const [newPat, setNewPat] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleVerify() {
    if (!newPat.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${newPat}` },
      });

      if (!res.ok) {
        setStatus("error");
        setErrorMsg("Invalid token. Make sure it has 'repo' and 'read:user' scopes.");
        return;
      }

      const data = (await res.json()) as { login: string };
      setPat(newPat, data.login);
      setStatus("success");
      setIsEditing(false);
      setValue("••••••••••••••••••••");

      setTimeout(onClose, 1200);
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  function handleClear() {
    clearAuth();
    setNewPat("");
    setValue("");
    setIsEditing(true);
    setStatus("idle");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border/60 rounded-xl w-full max-w-md mx-4 shadow-[0_0_60px_rgba(0,207,255,0.08)]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-accent" />
            <h2 className="font-semibold text-text-primary">GitHub Authentication</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {username && !isEditing && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
              <span className="text-sm text-green-300">
                Authenticated as <strong>{username}</strong>
              </span>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-3">
              <label className="block text-sm text-text-secondary">
                Personal Access Token (PAT)
              </label>
              <input
                type="password"
                value={newPat}
                onChange={(e) => setNewPat(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-accent focus:shadow-glow-sm transition-colors"
                autoFocus
              />
              <p className="text-xs text-muted">
                Requires{" "}
                <code className="text-text-secondary">repo</code> and{" "}
                <code className="text-text-secondary">read:user</code> scopes.{" "}
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Create token →
                </a>
              </p>

              {status === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle size={14} />
                  {errorMsg}
                </div>
              )}

              {status === "success" && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle size={14} />
                  Token verified!
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm text-text-secondary">Token</label>
              <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-muted font-mono">
                {value}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border">
          {pat && !isEditing ? (
            <>
              <button
                onClick={handleClear}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Remove token
              </button>
              <button
                onClick={() => { setIsEditing(true); setNewPat(""); setStatus("idle"); }}
                className="px-4 py-2 text-sm font-medium bg-surface-2 hover:bg-border text-text-primary rounded-lg transition-colors"
              >
                Update token
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="text-sm text-muted hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                disabled={!newPat.trim() || status === "loading"}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-background rounded-lg transition-colors"
              >
                {status === "loading" && <Loader2 size={14} className="animate-spin" />}
                Verify & Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
