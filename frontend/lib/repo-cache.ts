/**
 * Application-wide in-memory cache for GitHub repository listings.
 * Survives modal open/close cycles; cleared on auth change.
 */

interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  private: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

interface CacheEntry {
  repos: GitHubRepo[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const cache = new Map<string, CacheEntry>();

function cacheKey(query: string, username: string): string {
  return `${username}::${query}`;
}

export function getCachedRepos(query: string, username: string): GitHubRepo[] | null {
  const entry = cache.get(cacheKey(query, username));
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    cache.delete(cacheKey(query, username));
    return null;
  }
  return entry.repos;
}

export function setCachedRepos(query: string, username: string, repos: GitHubRepo[]): void {
  cache.set(cacheKey(query, username), { repos, fetchedAt: Date.now() });
}

export function clearRepoCache(): void {
  cache.clear();
}
