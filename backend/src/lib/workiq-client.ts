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

async function callWorkIQ(question: string, timeoutMs = 60_000): Promise<string> {
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

  const result = await Promise.race([
    mcpClient.callTool({ name: searchToolName!, arguments: { [searchParamName]: question } }),
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
      : "WorkIQ request failed";
    throw new Error(errorText);
  }

  if (Array.isArray(result.content)) {
    return result.content
      .filter((c: { type: string }) => c.type === "text")
      .map((c: { text: string }) => c.text)
      .join("");
  }

  return "";
}

export async function search(query: string): Promise<WorkIQResult[]> {
  const structuredPrompt =
    `${query} (from the last 4 weeks). ` +
    `List each result as a numbered item with *Type, *Title, and *Date fields.`;

  const text = await callWorkIQ(structuredPrompt, 90_000);
  console.log("[workiq] Raw search response:\n", text.slice(0, 1000));
  return parseItemizedResponse(text);
}

export async function getDetail(itemTitle: string, itemType: string): Promise<string> {
  const typeHints: Record<string, string> = {
    email: "Provide the full email content, including sender, recipients, and body.",
    meeting: "Provide the meeting summary, transcript, or notes if available. Include attendees and key discussion points.",
    document: "Provide a detailed summary of the document contents.",
    teams_message: "Provide the full message thread and context.",
    person: "Provide relevant recent interactions and context about this person.",
  };

  const hint = typeHints[itemType] || "Provide a detailed summary.";
  const detailPrompt =
    `I need the full details for this ${itemType}: "${itemTitle}"\n\n${hint}\n\n` +
    `Focus on the most recent instance from the last 4 weeks.`;

  return await callWorkIQ(detailPrompt);
}

function parseItemizedResponse(text: string): WorkIQResult[] {
  const results: WorkIQResult[] = [];
  const lines = text.split("\n");
  let currentItem: { title: string; type: string; date: string; summary: string; sourceUrl?: string } | null = null;
  let itemIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    // Detect numbered item headers like "1. **Title**", "- **Title**", "### 1) Title"
    const numberedMatch = trimmed.match(/^(?:#{1,4}\s*)?(?:\*\*)?(\d+)[.)]\s*\*?\*?\s*(.+)/);
    const boldHeaderMatch = !numberedMatch ? trimmed.match(/^[-•]\s*\*\*(.+?)\*\*/) : null;

    if (numberedMatch || boldHeaderMatch) {
      // Save previous item
      if (currentItem) {
        results.push(buildResult(currentItem, itemIndex++));
      }
      const rawTitle = (numberedMatch ? numberedMatch[2] : boldHeaderMatch![1])
        .replace(/\*\*/g, "").replace(/\[.*?\]\(.*?\)/g, "").trim();
      currentItem = { title: rawTitle, type: "document", date: "", summary: "" };
    } else if (currentItem && trimmed) {
      // Parse metadata lines within an item (e.g. "*Type: Meeting", "- Title: ...", "Type: ...")
      const lower = trimmed.toLowerCase().replace(/^\*+\s*/, "").replace(/^[-•]\s*/, "");

      if (lower.startsWith("type:")) {
        currentItem.type = extractValue(trimmed);
      } else if (lower.startsWith("title:") || lower.startsWith("subject:")) {
        // Override the header title with the explicit title metadata
        const val = extractValue(trimmed);
        if (val) currentItem.title = val;
      } else if (lower.startsWith("date:") || lower.startsWith("when:") || lower.startsWith("time:")) {
        currentItem.date = extractValue(trimmed);
      } else if (lower.startsWith("description:") || lower.startsWith("summary:") || lower.startsWith("snippet:")) {
        const val = extractValue(trimmed);
        if (val) currentItem.summary = val;
      } else if (!currentItem.summary) {
        // First non-metadata line becomes the summary
        const cleaned = trimmed.replace(/^[-•*]\s*/, "").replace(/\*\*/g, "").trim();
        if (cleaned && !cleaned.startsWith("---")) {
          currentItem.summary = cleaned;
        }
      }
    }
  }

  // Don't forget the last item
  if (currentItem) {
    results.push(buildResult(currentItem, itemIndex));
  }

  // Fallback: if parsing found nothing, return the whole text as a single result
  if (results.length === 0 && text.trim()) {
    return [{
      id: "workiq-0",
      type: "document",
      title: text.slice(0, 80).replace(/\n/g, " "),
      summary: text.slice(0, 500),
    }];
  }

  return results;
}

function extractValue(line: string): string {
  // Strip leading markdown (bullets, asterisks, bold) and the key label, keeping only the value
  return line
    .replace(/^[-•*_\s]+/, "")        // strip leading bullets/asterisks/spaces
    .replace(/^\*?\*?\w+[:\s*]+/i, "") // strip key label like "Type:", "*Title:", etc.
    .replace(/\*\*/g, "")             // strip bold markers
    .trim();
}

function buildResult(item: { title: string; type: string; date: string; summary: string; sourceUrl?: string }, idx: number): WorkIQResult {
  let type = normalizeType(item.type);
  // If type is still the default "document", try to infer from title context
  if (type === "document") {
    type = inferTypeFromTitle(item.title);
  }
  return {
    id: `workiq-${idx}`,
    type,
    title: item.title.slice(0, 120),
    summary: item.summary.slice(0, 300),
    date: item.date || undefined,
    sourceUrl: item.sourceUrl,
  };
}

function inferTypeFromTitle(title: string): WorkIQResult["type"] {
  const lower = title.toLowerCase();
  // Meeting indicators
  if (lower.includes("sync") || lower.includes("standup") || lower.includes("stand-up") ||
      lower.includes("1:1") || lower.includes("1-on-1") || lower.includes("retrospective") ||
      lower.includes("retro") || lower.includes("sprint") || lower.includes("planning") ||
      lower.includes("review") || lower.includes("townhall") || lower.includes("town hall") ||
      lower.includes("kick-off") || lower.includes("kickoff") || lower.includes("check-in") ||
      lower.includes("huddle") || lower.includes("all-hands") || lower.includes("demo") ||
      lower.includes("workshop") || lower.includes("brainstorm") || lower.includes("office hours")) {
    return "meeting";
  }
  return "document";
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
