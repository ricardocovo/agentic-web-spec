import { Router, Request, Response } from "express";
import { CopilotClient, SessionEvent } from "@github/copilot-sdk";
import fs from "fs";
import path from "path";
import { parse as parseYaml } from "yaml";
import { AGENT_FILE_MAP, AGENTS_DIR } from "../lib/agentFileMap.js";

export const agentRouter = Router();

interface AgentFileConfig {
  name: string;
  displayName: string;
  description?: string;
  model?: string;
  tools?: string[];
  prompt: string;
}

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
  const { agentSlug, prompt, repoPath, context, spaceRef, spaceRefs: rawSpaceRefs } = req.body as {
    agentSlug: string;
    prompt: string;
    repoPath: string;
    context?: string;
    spaceRef?: string;
    spaceRefs?: string[];
  };

  // Normalize: prefer spaceRefs array; fall back to wrapping legacy spaceRef
  const spaceRefs: string[] = rawSpaceRefs && rawSpaceRefs.length > 0
    ? rawSpaceRefs
    : spaceRef
      ? [spaceRef]
      : [];

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

  const THINK_GUIDANCE =
    "\n\nWhen reasoning through a problem before answering, enclose your internal thinking in <think>...</think> tags at the very beginning of your response. Your answer must follow after the closing </think> tag with no extra preamble.";

  const spaceInstruction = spaceRefs.length > 0
    ? `\n\nYou have access to these Copilot Spaces: ${spaceRefs.map(s => `"${s}"`).join(", ")}. Use the github-get_copilot_space tool for each space to retrieve its context and incorporate it into your analysis.`
    : "";

  const systemPrompt = (context
    ? `${agentConfig.prompt}\n\nPrevious context:\n${context}`
    : agentConfig.prompt) + spaceInstruction + THINK_GUIDANCE;

  let client: CopilotClient | null = null;

  // Extract PAT from Authorization header for MCP server auth
  const authHeader = req.headers.authorization;
  const pat = authHeader ? authHeader.replace(/^Bearer\s+/i, "") : undefined;

  // Create client and session BEFORE opening SSE stream so errors return proper HTTP responses
  try {
    const clientOpts: Record<string, unknown> = { cwd: repoPath };
    if (pat) {
      clientOpts.env = {
        ...process.env,
        GH_TOKEN: pat,
        GITHUB_PERSONAL_ACCESS_TOKEN: pat,
      };
      if (spaceRefs.length > 0) {
        (clientOpts.env as Record<string, string>).COPILOT_MCP_COPILOT_SPACES_ENABLED = "true";
      }
    }
    client = new CopilotClient(clientOpts);
    await client.start();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to start Copilot client";
    console.error(`[agent:${agentSlug}] startup error:`, msg);
    res.status(500).json({ error: msg });
    return;
  }

  let session: Awaited<ReturnType<CopilotClient["createSession"]>>;
  try {
    const MCP_URL = "https://api.githubcopilot.com/mcp/readonly";

    session = await client.createSession({
      model: agentConfig.model ?? "gpt-4.1",
      streaming: true,
      workingDirectory: repoPath,
      systemMessage: { content: systemPrompt },
      availableTools: agentConfig.tools?.includes("*")
        ? undefined
        : spaceRefs.length > 0 && pat
          ? [...(agentConfig.tools ?? []), "github-get_copilot_space", "github-list_copilot_spaces"]
          : agentConfig.tools,
      ...(spaceRefs.length > 0 && pat
        ? {
            mcpServers: {
              github: {
                type: "http" as const,
                url: MCP_URL,
                headers: {
                  Authorization: `Bearer ${pat}`,
                  "X-MCP-Toolsets": "copilot_spaces",
                },
                tools: ["get_copilot_space", "list_copilot_spaces"],
              },
            },
            onPermissionRequest: () => {
              return { kind: "approved" as const };
            },
          }
        : {}),
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

  // State for <think>...</think> tag-based reasoning extraction.
  // Used when the model doesn't emit native assistant.reasoning_delta events.
  let hasNativeReasoning = false;
  let thinkState: "waiting" | "in_think" | "answering" = "waiting";
  let thinkBuffer = "";
  const THINK_OPEN = "<think>";
  const THINK_CLOSE = "</think>";

  session.on((event: SessionEvent) => {
    console.log(`[agent:${agentSlug}] event: ${event.type}`);
    if (event.type === "assistant.reasoning_delta") {
      hasNativeReasoning = true;
      sendEvent("reasoning", event.data.deltaContent ?? "");
    }
    if (event.type === "assistant.message_delta") {
      const delta = event.data.deltaContent ?? "";

      // Fast path: already past <think> block
      if (thinkState === "answering") {
        gotContent = true;
        sendEvent("chunk", delta);
        return;
      }

      // Accumulate into buffer and parse <think> block
      thinkBuffer += delta;

      if (thinkState === "waiting") {
        if (thinkBuffer.startsWith(THINK_OPEN)) {
          thinkState = "in_think";
          thinkBuffer = thinkBuffer.slice(THINK_OPEN.length);
        } else if (thinkBuffer.length >= THINK_OPEN.length) {
          // No <think> tag — treat entire buffer as answer content
          thinkState = "answering";
          gotContent = true;
          sendEvent("chunk", thinkBuffer);
          thinkBuffer = "";
          return;
        }
        // else: buffer too short to decide yet — keep waiting
      }

      if (thinkState === "in_think") {
        const closeIdx = thinkBuffer.indexOf(THINK_CLOSE);
        if (closeIdx !== -1) {
          // Found end of think block — emit reasoning (if not already covered by native events) then switch to answering
          if (closeIdx > 0 && !hasNativeReasoning) sendEvent("reasoning", thinkBuffer.slice(0, closeIdx));
          thinkState = "answering";
          const rest = thinkBuffer.slice(closeIdx + THINK_CLOSE.length).replace(/^\n+/, "");
          thinkBuffer = "";
          if (rest.length > 0) {
            gotContent = true;
            sendEvent("chunk", rest);
          }
        } else {
          // Still inside think block — flush safe portion (keep THINK_CLOSE.length chars
          // buffered in case the closing tag spans multiple deltas)
          const safeEnd = thinkBuffer.length - THINK_CLOSE.length;
          if (safeEnd > 0) {
            if (!hasNativeReasoning) sendEvent("reasoning", thinkBuffer.slice(0, safeEnd));
            thinkBuffer = thinkBuffer.slice(safeEnd);
          }
        }
      }
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


