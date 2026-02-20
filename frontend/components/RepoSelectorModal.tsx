"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, GitFork, Star, Loader2, Lock, Globe } from "lucide-react";
import { useApp } from "@/lib/context";
import { ActiveRepo } from "@/lib/storage";

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  private: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

interface RepoSelectorModalProps {
  onClose: () => void;
}

export function RepoSelectorModal({ onClose }: RepoSelectorModalProps) {
  const { pat, username, setActiveRepo } = useApp();
  const [query, setQuery] = useState("");
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [cloning, setCloningRepo] = useState<string | null>(null);
  const [error, setError] = useState("");

  const searchRepos = useCallback(
    async (q: string) => {
      if (!pat) return;
      setLoading(true);
      setError("");

      try {
        const url = q
          ? `https://api.github.com/search/repositories?q=${encodeURIComponent(q + " user:" + username)}&sort=updated&per_page=20`
          : `https://api.github.com/user/repos?sort=updated&per_page=20`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${pat}` },
        });

        if (!res.ok) throw new Error("Failed to fetch repositories");

        const data = await res.json();
        setRepos(q ? (data as { items: GitHubRepo[] }).items : (data as GitHubRepo[]));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }
    },
    [pat, username]
  );

  useEffect(() => {
    searchRepos("");
  }, [searchRepos]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) searchRepos(query);
      else searchRepos("");
    }, 400);
    return () => clearTimeout(timer);
  }, [query, searchRepos]);

  async function handleSelect(repo: GitHubRepo) {
    if (!pat || !username || cloning) return;
    setCloningRepo(repo.full_name);
    setError("");

    try {
      const res = await fetch("/api/backend/repos/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoFullName: repo.full_name,
          pat,
          username,
        }),
      });

      const data = (await res.json()) as { success?: boolean; repoPath?: string; error?: string };

      if (!res.ok || !data.success) {
        setError(data.error || "Clone failed");
        return;
      }

      const activeRepo: ActiveRepo = {
        fullName: repo.full_name,
        username,
        repoName: repo.name,
        localPath: data.repoPath!,
        clonedAt: Date.now(),
      };

      setActiveRepo(activeRepo);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Backend unreachable — make sure the Web-Spec backend is running on port 3001"
      );
    } finally {
      setCloningRepo(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl w-full max-w-2xl mx-4 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-text-primary">Select Repository</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search repositories..."
              className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">Loading repositories...</span>
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-red-400 bg-red-500/10 m-4 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          {!loading && repos.length === 0 && !error && (
            <div className="text-center py-12 text-muted text-sm">No repositories found</div>
          )}

          {!loading && repos.map((repo) => (
            <button
              key={repo.id}
              onClick={() => handleSelect(repo)}
              disabled={!!cloning}
              className="w-full text-left px-4 py-3 hover:bg-surface-2 border-b border-border/50 last:border-0 transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {repo.private ? (
                      <Lock size={12} className="text-muted flex-shrink-0" />
                    ) : (
                      <Globe size={12} className="text-muted flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-text-primary truncate">
                      {repo.full_name}
                    </span>
                    {cloning === repo.full_name && (
                      <Loader2 size={12} className="animate-spin text-accent flex-shrink-0" />
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-text-secondary truncate">{repo.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    {repo.language && (
                      <span className="text-xs text-muted">{repo.language}</span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Star size={10} />
                      {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <GitFork size={10} />
                      {repo.forks_count}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
