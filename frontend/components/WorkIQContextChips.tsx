"use client";

import { X, Mail, Calendar, FileText, MessageSquare, User } from "lucide-react";
import type { WorkIQResult } from "@/components/WorkIQModal";

interface WorkIQContextChipsProps {
  items: WorkIQResult[];
  onRemove: (id: string) => void;
}

const TYPE_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  meeting: Calendar,
  document: FileText,
  teams_message: MessageSquare,
  person: User,
};

export function WorkIQContextChips({ items, onRemove }: WorkIQContextChipsProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {items.map((item) => {
        const Icon = TYPE_ICONS[item.type] ?? FileText;
        const truncatedTitle =
          item.title.length > 30 ? item.title.slice(0, 30) + "…" : item.title;
        return (
          <div
            key={item.id}
            className="flex items-center gap-1.5 bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text-primary hover:border-accent transition-colors group"
            title={`${item.title}\n${item.summary}`}
          >
            <Icon size={11} className="text-muted flex-shrink-0" />
            <span className="truncate max-w-[160px]">{truncatedTitle}</span>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-muted hover:text-text-primary ml-0.5 flex-shrink-0 transition-colors"
              aria-label={`Remove ${item.title}`}
            >
              <X size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
