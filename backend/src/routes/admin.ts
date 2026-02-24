import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { AGENT_FILE_MAP, AGENTS_DIR } from "../lib/agentFileMap.js";

export const adminRouter = Router();

// GET /agents — list all agents
adminRouter.get("/agents", (_req: Request, res: Response) => {
  try {
    const agents = Object.entries(AGENT_FILE_MAP).map(([slug, filename]) => {
      const filePath = path.join(AGENTS_DIR, filename);
      if (!fs.existsSync(filePath)) return null;
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = parseYaml(raw);
      return { ...parsed, slug };
    }).filter(Boolean);
    res.json(agents);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to list agents";
    res.status(500).json({ error: msg });
  }
});

// GET /agents/:slug — get one agent
adminRouter.get("/agents/:slug", (req: Request, res: Response) => {
  const { slug } = req.params;
  const filename = AGENT_FILE_MAP[slug];
  if (!filename) {
    res.status(404).json({ error: `Agent not found: ${slug}` });
    return;
  }
  const filePath = path.join(AGENTS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: `Agent file not found: ${slug}` });
    return;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = parseYaml(raw);
    res.json({ ...parsed, slug });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to read agent";
    res.status(500).json({ error: msg });
  }
});

// PUT /agents/:slug — update an agent
adminRouter.put("/agents/:slug", (req: Request, res: Response) => {
  const { slug } = req.params;
  const filename = AGENT_FILE_MAP[slug];
  if (!filename) {
    res.status(404).json({ error: `Agent not found: ${slug}` });
    return;
  }

  const { displayName, description, model, tools, prompt } = req.body as {
    displayName?: string;
    description?: string;
    model?: string;
    tools?: string[];
    prompt?: string;
  };

  if (!displayName || !prompt) {
    res.status(400).json({ error: "displayName and prompt are required" });
    return;
  }

  const filePath = path.join(AGENTS_DIR, filename);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const existing = parseYaml(raw);

    const updated = {
      ...existing,
      displayName,
      description: description ?? existing.description,
      model: model ?? existing.model,
      tools: tools ?? existing.tools,
      prompt,
    };

    fs.writeFileSync(filePath, stringifyYaml(updated), "utf-8");
    res.json({ ...updated, slug });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update agent";
    res.status(500).json({ error: msg });
  }
});
