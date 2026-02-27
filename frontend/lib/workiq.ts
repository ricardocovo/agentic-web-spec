// WorkIQ availability check with 5-minute frontend cache

let cachedStatus: { available: boolean; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function checkWorkIQStatus(): Promise<boolean> {
  if (cachedStatus && Date.now() - cachedStatus.ts < CACHE_TTL) {
    return cachedStatus.available;
  }

  try {
    const res = await fetch("/api/backend/workiq/status");
    if (!res.ok) {
      cachedStatus = { available: false, ts: Date.now() };
      return false;
    }
    const data = (await res.json()) as { available: boolean; reason?: string };
    if (!data.available && data.reason) {
      console.debug("[WorkIQ] Not available:", data.reason);
    }
    cachedStatus = { available: data.available, ts: Date.now() };
    return data.available;
  } catch {
    cachedStatus = { available: false, ts: Date.now() };
    return false;
  }
}
