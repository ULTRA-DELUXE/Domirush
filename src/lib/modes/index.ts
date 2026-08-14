import { practiceMode } from "./practice/practiceMode";
import { registerMode } from "./registry";
import { streakModes } from "./streak/streakMode";

let registered = false;

/** Idempotent so both server and client renders can call it freely. */
export function ensureModesRegistered(): void {
  if (registered) return;
  streakModes.forEach(registerMode);
  registerMode(practiceMode);
  registered = true;
}

ensureModesRegistered();

export { getMode, listModes, requireMode, isRegisteredModeId, registerMode } from "./registry";
export type * from "./types";
