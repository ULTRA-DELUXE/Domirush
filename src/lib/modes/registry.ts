import type { GameModeDefinition, GameModeId } from "./types";

const registry = new Map<GameModeId, GameModeDefinition>();

export function registerMode(definition: GameModeDefinition): GameModeDefinition {
  registry.set(definition.id, definition);
  return definition;
}

export function getMode(modeId: string): GameModeDefinition | undefined {
  return registry.get(modeId as GameModeId);
}

export function requireMode(modeId: string): GameModeDefinition {
  const mode = getMode(modeId);
  if (!mode) throw new Error(`Unknown game mode: ${modeId}`);
  return mode;
}

export function listModes(options: { includeHidden?: boolean } = {}): GameModeDefinition[] {
  const modes = [...registry.values()];
  return options.includeHidden ? modes : modes.filter((mode) => !mode.hiddenFromMenu);
}

export function isRegisteredModeId(modeId: string): modeId is GameModeId {
  return registry.has(modeId as GameModeId);
}
