import { Router, Request, Response } from "express";
import { search, getDetail, isAvailable, WorkIQResult } from "../lib/workiq-client.js";

export const workiqRouter = Router();

// POST /search — proxy search queries to WorkIQ MCP server
workiqRouter.post("/search", async (req: Request, res: Response) => {
  const { query } = req.body as { query?: string };

  if (!query || typeof query !== "string" || !query.trim()) {
    res.status(400).json({ error: "A non-empty 'query' string is required" });
    return;
  }

  try {
    const results: WorkIQResult[] = await search(query.trim());
    res.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "WorkIQ search failed";
    console.error("[workiq] search error:", message);

    if (message.includes("timed out")) {
      res.status(504).json({ error: "WorkIQ search timed out" });
      return;
    }

    res.status(502).json({ error: message });
  }
});

// GET /status — health-check for WorkIQ availability
workiqRouter.get("/status", async (_req: Request, res: Response) => {
  try {
    const status = await isAvailable();
    res.json(status);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Unknown error";
    res.json({ available: false, reason });
  }
});

// POST /detail — fetch full summary/transcript/notes for a specific item
workiqRouter.post("/detail", async (req: Request, res: Response) => {
  const { title, type } = req.body as { title?: string; type?: string };

  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "A non-empty 'title' string is required" });
    return;
  }

  try {
    const detail = await getDetail(title.trim(), type?.trim() || "document");
    res.json({ detail });
  } catch (err) {
    const message = err instanceof Error ? err.message : "WorkIQ detail fetch failed";
    console.error("[workiq] detail error:", message);

    if (message.includes("timed out")) {
      res.status(504).json({ error: "WorkIQ detail request timed out" });
      return;
    }

    res.status(502).json({ error: message });
  }
});
