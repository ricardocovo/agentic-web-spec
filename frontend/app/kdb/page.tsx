"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useApp } from "@/lib/context";
import {
  CopilotSpace,
  getCachedSpaces,
  fetchSpacesWithCache,
} from "@/lib/spaces-cache";

export default function KDBPage() {
  const { hydrated, pat } = useApp();
  const [spaces, setSpaces] = useState<CopilotSpace[]>([]);
  const [loading, setLoading] = useState(false);
  const [slowLoading, setSlowLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSpaces = useCallback(async () => {
    if (!pat) return;
    setLoading(true);
    setSlowLoading(false);
    setError("");

    const slowTimer = setTimeout(() => setSlowLoading(true), 5000);

    try {
      const result = await fetchSpacesWithCache(pat);
      setSpaces(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Copilot Spaces");
    } finally {
      clearTimeout(slowTimer);
      setSlowLoading(false);
      setLoading(false);
    }
  }, [pat]);

  useEffect(() => {
    if (!pat) return;
    // Show cached data instantly while fetching
    const cached = getCachedSpaces();
    if (cached) setSpaces(cached);
    loadSpaces();
  }, [pat, loadSpaces]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={22} className="text-accent" />
          <h1 className="text-2xl font-bold text-text-primary">Knowledge Base</h1>
        </div>
        <p className="text-text-secondary text-sm">
          Your Copilot Spaces.
        </p>
      </div>

      {/* No PAT */}
      {hydrated && !pat && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            Configure your GitHub PAT in settings to access Copilot Spaces.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10 mb-4">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button
            onClick={loadSpaces}
            className="px-3 py-1 text-xs font-medium rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-2 text-muted py-8">
          <div className="flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Connecting to Copilot Spaces via MCP…</span>
          </div>
          {slowLoading && (
            <span className="text-xs text-muted">
              This may take a moment — querying the MCP server…
            </span>
          )}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && pat && spaces.length === 0 && (
        <div className="text-center py-16 border border-border rounded-xl bg-surface">
          <BookOpen size={32} className="text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm font-medium">No Copilot Spaces found</p>
          <p className="text-muted text-xs mt-1">
            Create a Space at{" "}
            <a
              href="https://github.com/copilot/spaces"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              github.com/copilot/spaces
            </a>
          </p>
        </div>
      )}

      {/* Spaces grid */}
      {!loading && spaces.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {spaces.map((space) => {
            const key = `${space.owner}/${space.name}`;

            return (
              <div
                key={key}
                className="text-left p-4 rounded-xl border border-border bg-surface"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm truncate">
                    {space.owner}/{space.name}
                  </p>
                  {space.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {space.description}
                    </p>
                  )}
                </div>

                {space.url && (
                  <a
                    href={space.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted hover:text-text-secondary mt-2 transition-colors"
                  >
                    <ExternalLink size={10} />
                    View Space
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
