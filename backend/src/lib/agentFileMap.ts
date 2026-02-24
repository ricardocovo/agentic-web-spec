import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const AGENTS_DIR = path.resolve(__dirname, "../../agents");

// Slug → filename mapping
export const AGENT_FILE_MAP: Record<string, string> = {
  "deep-research": "deep-research.agent.yaml",
  "prd": "prd.agent.yaml",
  "technical-docs": "technical-docs.agent.yaml",
  "spec-writer": "spec-writer.agent.yaml",
  "issue-creator": "issue-creator.agent.yaml",
};
