import { Router, Request, Response } from "express";
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";

export const reposRouter = Router();

function sanitizePAT(text: string, pat: string): string {
  if (!pat) return text;
  const escaped = pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(escaped, "g"), "***");
}

import os from "os";

const WORK_DIR = process.env.WORK_DIR || path.join(os.homedir(), "work");

function getRepoPath(username: string, repoName: string): string {
  return path.join(WORK_DIR, username, repoName);
}

// POST /api/repos/clone
reposRouter.post("/clone", async (req: Request, res: Response) => {
  const { repoFullName, pat, username } = req.body as {
    repoFullName: string;
    pat: string;
    username: string;
  };

  if (!repoFullName || !pat || !username) {
    res.status(400).json({ error: "repoFullName, pat, and username are required" });
    return;
  }

  const [, repoName] = repoFullName.split("/");
  const repoPath = getRepoPath(username, repoName);

  // Already cloned — fetch latest changes
  if (fs.existsSync(repoPath)) {
    try {
      execSync(`git fetch origin`, { cwd: repoPath, timeout: 30000, stdio: "pipe" });
      execSync(`git reset --hard origin/HEAD`, { cwd: repoPath, timeout: 30000, stdio: "pipe" });
      res.json({ success: true, repoPath, alreadyCloned: true, synced: true });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : "Sync failed";
      const sanitized = sanitizePAT(raw, pat);
      res.status(500).json({ error: sanitized });
    }
    return;
  }

  // Ensure parent dir exists
  const parentDir = path.dirname(repoPath);
  fs.mkdirSync(parentDir, { recursive: true });

  const cloneUrl = `https://${pat}@github.com/${repoFullName}.git`;

  try {
    execSync(`git clone --depth 1 "${cloneUrl}" "${repoPath}"`, {
      timeout: 60000,
      stdio: "pipe",
    });
    res.json({ success: true, repoPath, alreadyCloned: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Clone failed";
    res.status(500).json({ error: message.replace(pat, "***") });
  }
});

// GET /api/repos/status?username=&repoName=
reposRouter.get("/status", (req: Request, res: Response) => {
  const { username, repoName } = req.query as { username: string; repoName: string };

  if (!username || !repoName) {
    res.status(400).json({ error: "username and repoName are required" });
    return;
  }

  const repoPath = getRepoPath(username, repoName);
  const exists = fs.existsSync(repoPath);
  res.json({ exists, repoPath: exists ? repoPath : null });
});

// DELETE /api/repos/remove
reposRouter.delete("/remove", (req: Request, res: Response) => {
  const { username, repoName } = req.body as { username: string; repoName: string };

  if (!username || !repoName) {
    res.status(400).json({ error: "username and repoName are required" });
    return;
  }

  const repoPath = getRepoPath(username, repoName);

  if (!fs.existsSync(repoPath)) {
    res.status(404).json({ error: "Repository not found" });
    return;
  }

  try {
    fs.rmSync(repoPath, { recursive: true, force: true });
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Remove failed";
    res.status(500).json({ error: message });
  }
});

// GET /api/repos/tree?username=&repoName=
reposRouter.get("/tree", (req: Request, res: Response) => {
  const { username, repoName } = req.query as { username: string; repoName: string };

  if (!username || !repoName) {
    res.status(400).json({ error: "username and repoName are required" });
    return;
  }

  const repoPath = getRepoPath(username, repoName);

  if (!fs.existsSync(repoPath)) {
    res.status(404).json({ error: "Repository not found" });
    return;
  }

  function buildTree(dir: string, depth = 0): string[] {
    if (depth > 3) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const result: string[] = [];
    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(repoPath, fullPath);
      result.push(entry.isDirectory() ? `${relativePath}/` : relativePath);
      if (entry.isDirectory()) {
        result.push(...buildTree(fullPath, depth + 1));
      }
    }
    return result;
  }

  res.json({ repoPath, tree: buildTree(repoPath) });
});
