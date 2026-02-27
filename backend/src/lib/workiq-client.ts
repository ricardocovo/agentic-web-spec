import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

export interface WorkIQResult {
  id: string;
  type: "email" | "meeting" | "document" | "teams_message" | "person";
  title: string;
  summary: string;
  date?: string;
  sourceUrl?: string;
}

let client: Client | null = null;
let transport: StdioClientTransport | null = null;
let searchToolName: string | null = null;
let searchParamName: string = "query";

// Availability cache (60s TTL)
let availabilityCache: { available: boolean; reason?: string; ts: number } | null = null;
const AVAILABILITY_TTL = 60_000;

async function ensureClient(): Promise<Client> {
  if (client) return client;

  transport = new StdioClientTransport({
    command: "workiq",
    args: ["mcp"],
  });

  client = new Client({ name: "web-spec-workiq", version: "1.0.0" });

  // Clean up on process exit so next request re-initializes
  transport.onclose = () => {
    console.log("[workiq] MCP transport closed, will reconnect on next request");
    client = null;
    transport = null;
    searchToolName = null;
    searchParamName = "query";
  };

  transport.onerror = (err) => {
    console.error("[workiq] MCP transport error:", err);
    client = null;
    transport = null;
    searchToolName = null;
    searchParamName = "query";
  };

  await client.connect(transport);

  // Discover available tools
  const { tools } = await client.listTools();
  console.log("[workiq] Available MCP tools:", tools.map((t) => t.name));

  // Accept EULA if the tool exists (required before other tools work)
  const eulaTool = tools.find((t) => t.name === "accept_eula");
  if (eulaTool) {
    try {
      await client.callTool({
        name: "accept_eula",
        arguments: { eulaUrl: "https://github.com/microsoft/work-iq-mcp" },
      });
      console.log("[workiq] EULA accepted");
    } catch (err) {
      console.warn("[workiq] EULA acceptance failed:", err);
    }
  }

  // Discover the search tool name
  const searchTool = tools.find(
    (t) =>
      t.name.toLowerCase().includes("search") ||
      t.name.toLowerCase().includes("query") ||
      t.name.toLowerCase().includes("ask")
  );
  searchToolName = searchTool?.name ?? "search";

  // Discover the parameter name the search tool expects (e.g. "question" or "query")
  const searchSchema = searchTool?.inputSchema as { properties?: Record<string, unknown> } | undefined;
  const paramNames = searchSchema?.properties ? Object.keys(searchSchema.properties) : [];
  searchParamName = paramNames.find((p) => p === "question" || p === "query") ?? paramNames[0] ?? "query";

  console.log("[workiq] Using search tool:", searchToolName, "with param:", searchParamName);

  return client;
}

export async function search(query: string): Promise<WorkIQResult[]> {
  let mcpClient: Client;
  try {
    mcpClient = await ensureClient();
  } catch (err) {
    // Auto-restart: reset and try once more
    client = null;
    transport = null;
    searchToolName = null;
    searchParamName = "query";
    mcpClient = await ensureClient();
  }

  const timeoutMs = 60_000;
  const result = await Promise.race([
    mcpClient.callTool({ name: searchToolName!, arguments: { [searchParamName]: query } }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("WorkIQ search timed out")), timeoutMs)
    ),
  ]);

  // Check for MCP-level errors
  if (result.isError) {
    const errorText = Array.isArray(result.content)
      ? result.content
          .filter((c: { type: string }) => c.type === "text")
          .map((c: { text: string }) => c.text)
          .join("")
      : "WorkIQ search failed";
    throw new Error(errorText);
  }

  // Parse MCP tool result into WorkIQResult[]
  const content = result.content;
  if (Array.isArray(content)) {
    // MCP returns content as array of { type: "text", text: string }
    const textParts = content
      .filter((c: { type: string }) => c.type === "text")
      .map((c: { text: string }) => c.text);
    const joined = textParts.join("");
    try {
      const parsed = JSON.parse(joined);
      if (Array.isArray(parsed)) {
        return parsed.map((item: Record<string, unknown>, idx: number) => ({
          id: String(item.id ?? `workiq-${idx}`),
          type: normalizeType(String(item.type ?? "document")),
          title: String(item.title ?? item.subject ?? "Untitled"),
          summary: String(item.summary ?? item.snippet ?? item.description ?? ""),
          date: item.date ? String(item.date) : undefined,
          sourceUrl: item.sourceUrl ?? item.url ? String(item.sourceUrl ?? item.url) : undefined,
        }));
      }
    } catch {
      // Not JSON — return as single document result
    }
    return textParts.map((text: string, idx: number) => ({
      id: `workiq-${idx}`,
      type: "document" as const,
      title: text.slice(0, 80),
      summary: text.slice(0, 500),
    }));
  }

  return [];
}

function normalizeType(raw: string): WorkIQResult["type"] {
  const lower = raw.toLowerCase();
  if (lower.includes("email") || lower.includes("mail")) return "email";
  if (lower.includes("meeting") || lower.includes("calendar") || lower.includes("event")) return "meeting";
  if (lower.includes("team") || lower.includes("message") || lower.includes("chat")) return "teams_message";
  if (lower.includes("person") || lower.includes("people") || lower.includes("contact")) return "person";
  return "document";
}

export async function isAvailable(): Promise<{ available: boolean; reason?: string }> {
  // Return cached result if fresh
  if (availabilityCache && Date.now() - availabilityCache.ts < AVAILABILITY_TTL) {
    return availabilityCache;
  }

  try {
    // Check if workiq CLI exists by spawning it
    await new Promise<void>((resolve, reject) => {
      const proc = spawn("workiq", ["--version"], { stdio: "pipe", shell: true });
      proc.on("error", () => reject(new Error("WorkIQ CLI not found")));
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error("WorkIQ CLI exited with non-zero code"));
      });
    });
    availabilityCache = { available: true, ts: Date.now() };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "WorkIQ CLI not found";
    availabilityCache = { available: false, reason, ts: Date.now() };
  }

  return availabilityCache!;
}
