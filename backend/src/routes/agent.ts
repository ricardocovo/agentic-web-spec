import { Router, Request, Response } from "express";
import { CopilotClient, SessionEvent } from "@github/copilot-sdk";
import fs from "fs";
import path from "path";
import { parse as parseYaml } from "yaml";
import { fileURLToPath } from "url";

export const agentRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.resolve(__dirname, "../../agents");

interface AgentFileConfig {
  name: string;
  displayName: string;
  description?: string;
  model?: string;
  tools?: string[];
  prompt: string;
}

// Slug → filename mapping
const AGENT_FILE_MAP: Record<string, string> = {
  "deep-research": "deep-research.agent.yaml",
  "prd": "prd.agent.yaml",
  "technical-docs": "technical-docs.agent.yaml",
};

function loadAgentConfig(slug: string): AgentFileConfig | null {
  const filename = AGENT_FILE_MAP[slug];
  if (!filename) return null;
  const filePath = path.join(AGENTS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return parseYaml(raw) as AgentFileConfig;
}

// POST /api/agent/run  (SSE streaming)
agentRouter.post("/run", async (req: Request, res: Response) => {
  const { agentSlug, prompt, repoPath, context } = req.body as {
    agentSlug: string;
    prompt: string;
    repoPath: string;
    context?: string;
  };

  if (!agentSlug || !prompt || !repoPath) {
    res.status(400).json({ error: "agentSlug, prompt, and repoPath are required" });
    return;
  }

  if (!fs.existsSync(repoPath)) {
    res.status(404).json({ error: "Repository path not found" });
    return;
  }

  const agentConfig = loadAgentConfig(agentSlug);
  if (!agentConfig) {
    res.status(400).json({ error: `Unknown agent: ${agentSlug}` });
    return;
  }

  const systemPrompt = context
    ? `${agentConfig.prompt}\n\nPrevious context:\n${context}`
    : agentConfig.prompt;

  let client: CopilotClient | null = null;

  // Create client and session BEFORE opening SSE stream so errors return proper HTTP responses
  try {
    client = new CopilotClient({ cwd: repoPath });
    await client.start();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to start Copilot client";
    console.error(`[agent:${agentSlug}] startup error:`, msg);
    res.status(500).json({ error: msg });
    return;
  }

  let session: Awaited<ReturnType<CopilotClient["createSession"]>>;
  try {
    session = await client.createSession({
      model: agentConfig.model ?? "gpt-4.1",
      streaming: true,
      workingDirectory: repoPath,
      systemMessage: { content: systemPrompt },
      availableTools: agentConfig.tools?.includes("*") ? undefined : agentConfig.tools,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create session";
    console.error(`[agent:${agentSlug}] session error:`, msg);
    await client.stop().catch(() => {});
    res.status(500).json({ error: msg });
    return;
  }

  // Now open SSE stream
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (type: string, data: string) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let done = false;

  const finish = async (reason = "unknown") => {
    if (done) return;
    done = true;
    console.log(`[agent:${agentSlug}] finish() called, reason: ${reason}`);
    sendEvent("done", "");
    res.end();
    await client?.stop().catch(() => {});
  };

  req.on("close", () => { void finish("req.close"); });

  let gotContent = false;
  let promptSent = false;

  session.on((event: SessionEvent) => {
    console.log(`[agent:${agentSlug}] event: ${event.type}`);
    if (event.type === "assistant.message_delta") {
      gotContent = true;
      sendEvent("chunk", event.data.deltaContent ?? "");
    }
    if (event.type === "assistant.message") {
      if (!gotContent && event.data.content) {
        gotContent = true;
        sendEvent("chunk", event.data.content);
      }
    }
    if (event.type === "session.idle" && promptSent) {
      void finish("session.idle");
    }
    if (event.type === "session.error") {
      const msg = (event.data as { message?: string })?.message ?? "Session error";
      console.error(`[agent:${agentSlug}] session.error:`, msg);
      sendEvent("error", msg);
      void finish("session.error");
    }
  });

  try {
    await session.send({ prompt });
    promptSent = true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send message";
    console.error(`[agent:${agentSlug}] send error:`, msg);
    sendEvent("error", msg);
    void finish("send-error");
  }
});


