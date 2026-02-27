"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Database, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { PATModal } from "@/components/PATModal";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { useApp } from "@/lib/context";

const NAV_LINKS = [
  { href: "/", label: "Agents", icon: Bot, flag: null },
  { href: "/kdb", label: "KDB", icon: Database, flag: "kdb" as const },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, flag: null },
];

export function Nav() {
  const pathname = usePathname();
  const [showPAT, setShowPAT] = useState(false);
  const { featureFlags } = useApp();

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/agents");
    return pathname.startsWith(href);
  }

  const visibleLinks = NAV_LINKS.filter(
    ({ flag }) => flag === null || featureFlags[flag]
  );

  return (
    <>
      <header className="border-b border-border bg-gradient-to-r from-surface to-transparent sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center text-lg">
            <span className="font-display font-bold tracking-wider text-text-primary">Web</span>
            <span className="font-display font-bold tracking-wider text-accent">-Spec</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {visibleLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive(href)
                    ? "border-b-2 border-accent text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Settings */}
          <SettingsDropdown onOpenPAT={() => setShowPAT(true)} />
        </div>
      </header>

      {showPAT && <PATModal onClose={() => setShowPAT(false)} />}
    </>
  );
}
