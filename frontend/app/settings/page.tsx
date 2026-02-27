"use client";

import { useApp } from "@/lib/context";
import { FeatureFlags } from "@/lib/storage";

const FLAG_LABELS: { key: keyof FeatureFlags; label: string; description: string }[] = [
  { key: "kdb", label: "KDB / Spaces", description: "Show the KDB navigation link and Space Selector in chat" },
  { key: "workiq", label: "WorkIQ", description: "Show the WorkIQ context button in chat" },
  { key: "generatePrd", label: "Generate PRD", description: "Show the 'Create PRD on Repo' action button" },
  { key: "generateTechSpecs", label: "Generate Tech Specs", description: "Show the 'Create Docs on Repo' action button" },
  { key: "createGithubIssues", label: "Create GitHub Issues", description: "Show the 'Create GitHub Issues' action button" },
];

export default function SettingsPage() {
  const { featureFlags, setFeatureFlags } = useApp();

  function toggle(key: keyof FeatureFlags) {
    setFeatureFlags({ ...featureFlags, [key]: !featureFlags[key] });
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-xl font-semibold text-text-primary mb-1">Feature Flags</h1>
      <p className="text-sm text-muted mb-8">Toggle features on or off. Changes are saved automatically.</p>

      <div className="space-y-3">
        {FLAG_LABELS.map(({ key, label, description }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-2"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">{label}</p>
              <p className="text-xs text-muted mt-0.5">{description}</p>
            </div>
            <button
              role="switch"
              aria-checked={featureFlags[key]}
              onClick={() => toggle(key)}
              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                featureFlags[key] ? "bg-accent" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  featureFlags[key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
