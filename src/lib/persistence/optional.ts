export function normalizeOptional<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      typeof entry === 'string' && entry.trim() === '' ? undefined : entry,
    ]),
  ) as T
}
