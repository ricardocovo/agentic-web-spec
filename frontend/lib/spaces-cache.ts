/**
 * Application-wide in-memory cache for Copilot Spaces listings.
 * Shared across KDB page and SpaceSelector to avoid redundant MCP round-trips.
 */

export interface CopilotSpace {
  name: string;
  owner: string;
  description?: string;
  url?: string;
}

interface CacheEntry {
  spaces: CopilotSpace[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes (spaces change infrequently)

let cached: CacheEntry | null = null;
let inflightRequest: Promise<CopilotSpace[]> | null = null;

export function getCachedSpaces(): CopilotSpace[] | null {
  if (!cached) return null;
  if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    cached = null;
    return null;
  }
  return cached.spaces;
}

export function setCachedSpaces(spaces: CopilotSpace[]): void {
  cached = { spaces, fetchedAt: Date.now() };
}

export function clearSpacesCache(): void {
  cached = null;
  inflightRequest = null;
}

/**
 * Fetch spaces with deduplication — concurrent callers share one request.
 * Returns cached data instantly when available.
 */
export async function fetchSpacesWithCache(pat: string): Promise<CopilotSpace[]> {
  const fromCache = getCachedSpaces();
  if (fromCache) return fromCache;

  // Deduplicate concurrent requests
  if (inflightRequest) return inflightRequest;

  inflightRequest = (async () => {
    try {
      const res = await fetch("/api/backend/kdb/spaces", {
        headers: { Authorization: `Bearer ${pat}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch spaces (${res.status})`);
      const data = await res.json();
      const typed = data as CopilotSpace[] | { spaces: CopilotSpace[] };
      const spaces: CopilotSpace[] = Array.isArray(typed) ? typed : typed.spaces ?? [];
      setCachedSpaces(spaces);
      return spaces;
    } finally {
      inflightRequest = null;
    }
  })();

  return inflightRequest;
}
