"use client";

import { FolderGit2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/context";
import { RepoSelectorModal } from "@/components/RepoSelectorModal";

export function RepoBar() {
  const { activeRepo, pat } = useApp();
  const [showSelector, setShowSelector] = useState(false);

  return (
    <>
      <div className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-9 flex items-center gap-3">
          <FolderGit2 size={14} className="text-muted flex-shrink-0" />

          {activeRepo ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-text-secondary truncate font-mono">
                {activeRepo.fullName}
              </span>
              <span className="text-xs text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                active
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted flex-1">No repository selected</span>
          )}

          <button
            onClick={() => setShowSelector(true)}
            disabled={!pat}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover disabled:text-muted disabled:cursor-not-allowed transition-colors"
            title={!pat ? "Configure GitHub PAT in settings first" : "Change active repository"}
          >
            {activeRepo ? "Change" : "Select repo"}
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {showSelector && <RepoSelectorModal onClose={() => setShowSelector(false)} />}
    </>
  );
}
