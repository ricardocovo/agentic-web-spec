"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BookOpen, Check, Loader2, X } from "lucide-react";
import { useApp } from "@/lib/context";

interface CopilotSpace {
  name: string;
  owner: string;
  description?: string;
  url?: string;
}

interface SpaceSelectorProps {
  onSelectionChange: (selectedSpaces: string[]) => void;
  disabled?: boolean;
}

export function SpaceSelector({ onSelectionChange, disabled }: SpaceSelectorProps) {
  const { pat } = useApp();
  const [open, setOpen] = useState(false);
  const [spaces, setSpaces] = useState<CopilotSpace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [slowLoad, setSlowLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSpaces = useCallback(async () => {
    if (!pat) return;
    setLoading(true);
    setError(null);
    setSlowLoad(false);
    const timer = setTimeout(() => setSlowLoad(true), 5000);
    try {
      const res = await fetch("/api/backend/kdb/spaces", {
        headers: { Authorization: `Bearer ${pat}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch spaces (${res.status})`);
      const data = await res.json();
      const typed = data as CopilotSpace[] | { spaces: CopilotSpace[] };
      setSpaces(Array.isArray(typed) ? typed : typed.spaces ?? []);
      setHasFetched(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch spaces");
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setSlowLoad(false);
    }
  }, [pat]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    const next = !open;
    setOpen(next);
    if (next && !hasFetched) fetchSpaces();
  }, [disabled, open, hasFetched, fetchSpaces]);

  const toggleSpace = useCallback(
    (key: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        onSelectionChange(Array.from(next));
        return next;
      });
    },
    [onSelectionChange],
  );

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    onSelectionChange([]);
  }, [onSelectionChange]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!pat) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={`w-10 h-10 flex items-center justify-center bg-surface-2 border border-border rounded-xl text-text-secondary hover:text-text-primary hover:border-accent transition-colors ${
          disabled ? "opacity-40 cursor-not-allowed" : ""
        }`}
      >
        <BookOpen size={18} />
        {selected.size > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
            {selected.size}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-72 bg-surface-2 border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">Copilot Spaces</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Loader2 size={20} className="animate-spin text-text-secondary" />
                {slowLoad && (
                  <span className="text-xs text-muted">This may take a moment…</span>
                )}
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <span className="text-xs text-red-400">{error}</span>
                <button
                  type="button"
                  onClick={fetchSpaces}
                  className="text-xs text-accent hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && hasFetched && spaces.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <span className="text-xs text-muted">No Copilot Spaces found</span>
              </div>
            )}

            {!loading &&
              !error &&
              spaces.map((space) => {
                const key = `${space.owner}/${space.name}`;
                const isSelected = selected.has(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleSpace(key)}
                    className="w-full px-4 py-2.5 hover:bg-surface-3 cursor-pointer flex items-start gap-3 transition-colors text-left"
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
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text-primary truncate">
                        {key}
                      </div>
                      {space.description && (
                        <div className="text-xs text-muted mt-0.5 line-clamp-2">
                          {space.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>

          {selected.size > 0 && (
            <div className="px-4 py-2 border-t border-border">
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-accent hover:underline"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
