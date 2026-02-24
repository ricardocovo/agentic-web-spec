import { Router, Request, Response } from "express";
import { CopilotClient } from "@github/copilot-sdk";

export const kdbRouter = Router();

const MCP_URL = "https://api.githubcopilot.com/mcp/readonly";

/** Auto-approve MCP permission requests; deny all others. */
function mcpPermissionHandler(req: { kind: string }) {
  if (req.kind === "mcp") return { kind: "approved" as const };
  return { kind: "denied-by-rules" as const };
}

/**
 * Try to parse a JSON array from text that may be wrapped in markdown code blocks.
 */
function parseJsonResponse(text: string): unknown[] {
  // Try direct parse first
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.spaces)) return parsed.spaces;
  } catch {
    // fall through to regex extraction
  }

  // Extract from markdown code blocks (```json ... ``` or ``` ... ```)
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through
    }
  }

  return [];
}

// GET /api/kdb/spaces
kdbRouter.get("/spaces", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(400).json({ error: "Authorization header is required" });
    return;
  }

  // Disable ETag caching — each listing is a fresh MCP query
  res.set("Cache-Control", "no-store");

  const pat = authHeader.replace(/^Bearer\s+/i, "");
  let client: CopilotClient | null = null;

  try {
    client = new CopilotClient({
      githubToken: pat,
      env: {
        ...process.env,
        COPILOT_MCP_COPILOT_SPACES_ENABLED: "true",
        GITHUB_PERSONAL_ACCESS_TOKEN: pat,
      },
    });
    await client.start();

    const session = await client.createSession({
      model: "gpt-4.1",
      systemMessage: {
        content: "You are a JSON API. Only output valid JSON arrays. Never use markdown.",
      },
      mcpServers: {
        github: {
          type: "http",
          url: MCP_URL,
          headers: {
            Authorization: `Bearer ${pat}`,
            "X-MCP-Toolsets": "copilot_spaces",
          },
          tools: ["*"],
        },
      },
      onPermissionRequest: mcpPermissionHandler,
    });

    const response = await session.sendAndWait(
      {
        prompt:
          "Use the list_copilot_spaces tool to list all my Copilot Spaces. Return ONLY a JSON array where each element has fields: name, owner, description. No markdown, no explanation.",
      },
      90_000,
    );

    const content = response?.data?.content ?? "";
    const spaces = parseJsonResponse(content);

    res.status(200).json(spaces);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch spaces via MCP";
    console.error("[kdb] MCP spaces error:", message);
    res.status(500).json({ error: message });
  } finally {
    await client?.stop().catch(() => {});
  }
});
