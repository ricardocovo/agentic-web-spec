"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Save } from "lucide-react";

const API_BASE = "http://localhost:3001/api/admin/agents";
const AVAILABLE_TOOLS = ["grep", "glob", "view", "bash"];

interface Agent {
  slug: string;
  name: string;
  displayName: string;
  description?: string;
  model?: string;
  tools?: string[];
  prompt: string;
}

interface FormState {
  displayName: string;
  description: string;
  model: string;
  tools: string[];
  prompt: string;
}

function formFromAgent(agent: Agent): FormState {
  return {
    displayName: agent.displayName ?? "",
    description: agent.description ?? "",
    model: agent.model ?? "",
    tools: agent.tools ?? [],
    prompt: agent.prompt ?? "",
  };
}

function formsEqual(a: FormState, b: FormState): boolean {
  return (
    a.displayName === b.displayName &&
    a.description === b.description &&
    a.model === b.model &&
    a.prompt === b.prompt &&
    a.tools.length === b.tools.length &&
    a.tools.every((t) => b.tools.includes(t))
  );
}

export default function AdminPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<FormState>({
    displayName: "",
    description: "",
    model: "",
    tools: [],
    prompt: "",
  });
  const savedForm = useRef<FormState>(form);
  const isDirty = !formsEqual(form, savedForm.current);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch agent list on mount
  useEffect(() => {
    fetch(API_BASE)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load agents (${r.status})`);
        return r.json();
      })
      .then((data: Agent[]) => {
        setAgents(data);
        if (data.length > 0) {
          setSelectedSlug(data[0].slug);
          const initial = formFromAgent(data[0]);
          setForm(initial);
          savedForm.current = initial;
        }
      })
      .catch((e) => setListError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Load full agent when selection changes
  useEffect(() => {
    if (!selectedSlug) return;
    fetch(`${API_BASE}/${selectedSlug}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load agent (${r.status})`);
        return r.json();
      })
      .then((agent: Agent) => {
        const f = formFromAgent(agent);
        setForm(f);
        savedForm.current = f;
        setSaveMsg(null);
      })
      .catch(() => {});
  }, [selectedSlug]);

  const selectAgent = useCallback(
    (slug: string) => {
      if (slug === selectedSlug) return;
      if (isDirty) {
        if (!window.confirm("You have unsaved changes. Discard them?")) return;
      }
      setSelectedSlug(slug);
    },
    [selectedSlug, isDirty],
  );

  const handleSave = useCallback(async () => {
    if (!selectedSlug || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`${API_BASE}/${selectedSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          description: form.description,
          model: form.model,
          tools: form.tools,
          prompt: form.prompt,
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const updated: Agent = await res.json();
      const f = formFromAgent(updated);
      setForm(f);
      savedForm.current = f;
      // Update sidebar list
      setAgents((prev) => prev.map((a) => (a.slug === updated.slug ? updated : a)));
      setSaveMsg({ type: "success", text: "Saved successfully" });
      setTimeout(() => setSaveMsg((m) => (m?.type === "success" ? null : m)), 3000);
    } catch (e: unknown) {
      setSaveMsg({ type: "error", text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }, [selectedSlug, saving, form]);

  const toggleTool = (tool: string) => {
    setForm((f) => ({
      ...f,
      tools: f.tools.includes(tool) ? f.tools.filter((t) => t !== tool) : [...f.tools, tool],
    }));
  };

  const selectedAgent = agents.find((a) => a.slug === selectedSlug);

  return (
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] shrink-0 border-r border-border bg-surface overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Agents
          </h2>
        </div>
        {loading && (
          <div className="flex items-center justify-center p-8 text-muted">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        {listError && (
          <div className="p-4 text-red-400 text-sm">{listError}</div>
        )}
        {!loading &&
          !listError &&
          agents.map((agent) => {
            const isSelected = agent.slug === selectedSlug;
            return (
              <button
                key={agent.slug}
                onClick={() => selectAgent(agent.slug)}
                className={`w-full text-left px-4 py-3 border-l-2 transition-colors ${
                  isSelected
                    ? "border-accent text-accent bg-surface-2"
                    : "border-transparent text-text-primary hover:bg-surface-2"
                }`}
              >
                <div className="font-semibold text-sm truncate">{agent.displayName}</div>
                {agent.description && (
                  <div className="text-xs text-muted mt-0.5 line-clamp-2">
                    {agent.description.length > 100
                      ? agent.description.slice(0, 100) + "…"
                      : agent.description}
                  </div>
                )}
              </button>
            );
          })}
      </aside>

      {/* Editor Panel */}
      <main className="flex-1 overflow-y-auto bg-surface-2 p-6">
        {!selectedAgent ? (
          <div className="text-muted text-sm">Select an agent to edit.</div>
        ) : (
          <div className="max-w-3xl space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {selectedAgent.displayName}
              </h1>
              <p className="text-sm text-muted mt-1">{selectedAgent.name}</p>
            </div>

            {/* Metadata */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Metadata
              </h3>
              <div>
                <label htmlFor="displayName" className="block text-sm text-text-secondary mb-1">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm text-text-secondary mb-1">
                  Description
                </label>
                <input
                  id="description"
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="model" className="block text-sm text-text-secondary mb-1">
                  Model
                </label>
                <input
                  id="model"
                  type="text"
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </section>

            {/* Tools */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                Tools
              </h3>
              <div className="flex flex-wrap gap-4">
                {AVAILABLE_TOOLS.map((tool) => (
                  <label
                    key={tool}
                    className="flex items-center gap-2 text-sm text-text-primary cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.tools.includes(tool)}
                      onChange={() => toggleTool(tool)}
                      className="rounded border-border accent-accent"
                    />
                    <span className="font-mono">{tool}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* System Prompt */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
                System Prompt
              </h3>
              <textarea
                value={form.prompt}
                onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                rows={12}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-accent resize-y"
              />
            </section>

            {/* Save */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving…" : "Save"}
              </button>
              {saveMsg && (
                <span
                  className={`text-sm ${
                    saveMsg.type === "success" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {saveMsg.text}
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
