"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Key, SlidersHorizontal, Flag } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

interface SettingsDropdownProps {
  onOpenPAT: () => void;
}

export function SettingsDropdown({ onOpenPAT }: SettingsDropdownProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Focus first menu item when opened
  useEffect(() => {
    if (open) {
      firstItemRef.current?.focus();
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  const isAdmin = pathname.startsWith("/admin");
  const isSettings = pathname.startsWith("/settings");

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-md text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Settings"
      >
        <Settings size={18} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 bg-surface-2 border border-border rounded-lg shadow-lg z-50 min-w-[160px] py-1"
          role="menu"
          aria-label="Settings menu"
        >
          <button
            ref={firstItemRef}
            role="menuitem"
            tabIndex={0}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
            onClick={() => {
              setOpen(false);
              onOpenPAT();
            }}
          >
            <Key size={16} />
            GitHub PAT
          </button>
          <Link
            href="/admin"
            role="menuitem"
            tabIndex={0}
            className={`flex items-center gap-2.5 px-3 py-2 text-sm hover:text-text-primary hover:bg-background transition-colors ${
              isAdmin ? "text-accent" : "text-text-secondary"
            }`}
            onClick={() => setOpen(false)}
          >
            <SlidersHorizontal size={16} />
            Admin
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            tabIndex={0}
            className={`flex items-center gap-2.5 px-3 py-2 text-sm hover:text-text-primary hover:bg-background transition-colors ${
              isSettings ? "text-accent" : "text-text-secondary"
            }`}
            onClick={() => setOpen(false)}
          >
            <Flag size={16} />
            Feature Flags
          </Link>
        </div>
      )}
    </div>
  );
}
