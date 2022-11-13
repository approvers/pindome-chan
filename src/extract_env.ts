export function extractEnv<K extends string>(
  keys: readonly K[],
  { defaults, emptyStrAsUnspecified = true }: {
    defaults?: Readonly<Partial<Record<K, string>>>;
    emptyStrAsUnspecified?: boolean;
  },
): Record<K, string> {
  const env: Partial<Record<K, string>> = {};
  for (const key of keys) {
    const value = Deno.env.get(key);
    if (value !== undefined && (!emptyStrAsUnspecified || value !== "")) {
      env[key] = value;
    } else if (defaults && defaults[key] !== undefined) {
      env[key] = defaults[key];
    } else {
      throw new Error(`env is not set: ${key}`);
    }
  }
  return env as Record<K, string>;
}
