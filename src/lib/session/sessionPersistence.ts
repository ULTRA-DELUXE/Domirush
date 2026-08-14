import type { SessionResults } from "../modes/types";
import type { GameSession } from "./types";

const SESSION_KEY = "domirush:session:v2";
const RESULTS_KEY = "domirush:results:v2";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function read<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A run that can't be persisted is still fully playable in memory.
  }
}

function clear(key: string): void {
  if (!isBrowser()) return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}

export function readStoredSession(): GameSession | null {
  const session = read<GameSession>(SESSION_KEY);
  if (!session?.puzzles?.length || typeof session.currentPuzzleIndex !== "number") return null;
  return session;
}

export const writeStoredSession = (session: GameSession) => write(SESSION_KEY, session);
export const clearStoredSession = () => clear(SESSION_KEY);

/** Results outlive the session so the results screen survives a refresh (§9.4). */
export function readStoredResults(): SessionResults | null {
  return read<SessionResults>(RESULTS_KEY);
}

export const writeStoredResults = (results: SessionResults) => write(RESULTS_KEY, results);
export const clearStoredResults = () => clear(RESULTS_KEY);
