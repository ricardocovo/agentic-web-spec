"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { useState } from "react";
import { PATModal } from "@/components/PATModal";

const NAV_LINKS = [
  { href: "/", label: "Agents" },
  { href: "/kdb", label: "KDB" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Nav() {
  const pathname = usePathname();
  const [showPAT, setShowPAT] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/agents");
    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="border-b border-border bg-surface sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-text-primary">Web</span>
            <span className="text-accent">-Spec</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(href)
                    ? "text-text-primary bg-surface-2"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Settings */}
          <button
            onClick={() => setShowPAT(true)}
            className="p-2 rounded-md text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
            title="Settings / GitHub PAT"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {showPAT && <PATModal onClose={() => setShowPAT(false)} />}
    </>
  );
}
