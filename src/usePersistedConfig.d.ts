export function usePersistedConfig<T extends Record<string, unknown>>(
  key: string,
  defaultConfig: T
): [T, (updater: T | ((prev: T) => T)) => void, () => void];

export function getShareableUrl(config: Record<string, unknown>): string;
