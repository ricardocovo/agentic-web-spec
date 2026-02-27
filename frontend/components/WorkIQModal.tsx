"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Search,
  Loader2,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  User,
  Check,
} from "lucide-react";

export interface WorkIQResult {
  id: string;
  type: string;
  title: string;
  summary: string;
  date?: string;
  sourceUrl?: string;
}

interface WorkIQModalProps {
  onClose: () => void;
  onAttach: (items: WorkIQResult[]) => void;
}

const TYPE_CONFIG: Record<string, { icon: typeof Mail; label: string }> = {
  email: { icon: Mail, label: "Emails" },
  meeting: { icon: Calendar, label: "Meetings" },
  document: { icon: FileText, label: "Documents" },
  teams_message: { icon: MessageSquare, label: "Teams Messages" },
  person: { icon: User, label: "People" },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? { icon: FileText, label: type };
}

export function WorkIQModal({ onClose, onAttach }: WorkIQModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WorkIQResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const fetchIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const searchWorkIQ = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const id = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/backend/workiq/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim() }),
      });

      if (id !== fetchIdRef.current) return;

      if (!res.ok) {
        let errorMessage = `Search failed (${res.status})`;
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) errorMessage = data.error;
        } catch {
          // Response body is not JSON (e.g. proxy error)
        }
        throw new Error(errorMessage);
      }

      const data = (await res.json()) as { results: WorkIQResult[] };
      setResults(data.results);
    } catch (err) {
      if (id === fetchIdRef.current) {
        setError(err instanceof Error ? err.message : "Search failed");
      }
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setHasSearched(false);
  }, [query]);

  const handleSearch = useCallback(() => {
    if (!query.trim() || loading) return;
    setSelected(new Set());
    searchWorkIQ(query).then(() => setHasSearched(true));
  }, [query, loading, searchWorkIQ]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAttach = useCallback(async () => {
    const selectedItems = results.filter((r) => selected.has(r.id));
    if (selectedItems.length === 0) return;

    setAttaching(true);
    setError(null);

    try {
      // Fetch detail for each selected item
      const enriched = await Promise.all(
        selectedItems.map(async (item) => {
          try {
            const res = await fetch("/api/backend/workiq/detail", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: item.title, type: item.type }),
            });
            if (res.ok) {
              const data = (await res.json()) as { detail: string };
              return { ...item, summary: data.detail || item.summary };
            }
          } catch {
            // Fall back to original summary
          }
          return item;
        })
      );

      onAttach(enriched);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch details");
    } finally {
      setAttaching(false);
    }
  }, [results, selected, onAttach, onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !attaching) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, attaching]);

  // Group results by type
  const grouped = results.reduce<Record<string, WorkIQResult[]>>((acc, item) => {
    const key = item.type || "document";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const typeOrder = ["email", "meeting", "document", "teams_message", "person"];
  const sortedGroups = Object.entries(grouped).sort(
    ([a], [b]) => (typeOrder.indexOf(a) === -1 ? 99 : typeOrder.indexOf(a)) - (typeOrder.indexOf(b) === -1 ? 99 : typeOrder.indexOf(b))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !attaching) onClose();
      }}
    >
      <div className="bg-surface border border-border/60 rounded-xl w-full max-w-2xl mx-4 shadow-[0_0_60px_rgba(0,207,255,0.08)] flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <h2 className="font-semibold text-text-primary">Search Work IQ</h2>
          <button
            onClick={onClose}
            disabled={attaching}
            className="p-1.5 rounded-md text-muted hover:text-text-primary hover:bg-surface-2 transition-colors disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                placeholder="Search emails, meetings, documents, Teams..."
                disabled={attaching}
                className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-muted focus:outline-none focus:border-accent focus:shadow-glow-sm transition-colors disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={!query.trim() || loading || attaching}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted">
              <Loader2 size={20} className="animate-spin mr-2" />
              <span className="text-sm">Searching Work IQ...</span>
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-red-400 bg-red-500/10 m-4 rounded-lg border border-red-500/20">
              {error}
            </div>
          )}

          {!loading && !error && hasSearched && query.trim() && results.length === 0 && (
            <div className="text-center py-12 text-muted text-sm">
              <Search size={24} className="mx-auto mb-2 opacity-40" />
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && !error && !hasSearched && results.length === 0 && (
            <div className="text-center py-12 text-muted text-sm">
              <Search size={24} className="mx-auto mb-2 opacity-40" />
              Enter a query and press Search to find your Microsoft 365 data
            </div>
          )}

          {!loading &&
            !error &&
            sortedGroups.map(([type, items]) => {
              const config = getTypeConfig(type);
              const Icon = config.icon;
              return (
                <div key={type}>
                  <div className="px-4 py-2 flex items-center gap-2 text-xs font-medium text-text-secondary uppercase tracking-wider bg-surface-2/50">
                    <Icon size={13} />
                    {config.label}
                  </div>
                  {items.map((item) => {
                    const isSelected = selected.has(item.id);
                    const ItemIcon = getTypeConfig(item.type).icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleSelect(item.id)}
                        disabled={attaching}
                        className="w-full text-left px-4 py-3 hover:bg-surface-2 border-b border-border/50 last:border-0 transition-all flex items-start gap-3 disabled:opacity-60"
                      >
                        <div
                          className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border mt-0.5 ${
                            isSelected
                              ? "bg-accent border-accent"
                              : "border-border bg-transparent"
                          }`}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <ItemIcon size={12} className="text-muted flex-shrink-0" />
                            <span className="text-sm font-medium text-text-primary truncate">
                              {item.title}
                            </span>
                          </div>
                          {item.summary && (
                            <p className="text-xs text-text-secondary line-clamp-2">
                              {item.summary}
                            </p>
                          )}
                          {item.date && (
                            <span className="text-xs text-muted mt-0.5 block">
                              {item.date}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
        </div>

        {/* Footer */}
        {selected.size > 0 && (
          <div className="p-4 border-t border-border flex-shrink-0">
            <button
              type="button"
              onClick={handleAttach}
              disabled={attaching}
              className="w-full py-2 rounded-lg text-sm font-medium bg-accent text-white hover:brightness-110 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {attaching ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Fetching details...
                </>
              ) : (
                <>Attach {selected.size} item{selected.size !== 1 ? "s" : ""}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
