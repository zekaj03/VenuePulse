export type UpstashRedisRestConfig = Readonly<{
  url: string;
  token: string;
}>;

const readNonEmpty = (env: NodeJS.ProcessEnv, key: string): string | null => {
  const value = env[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const resolveUpstashRedisRestConfig = (
  env: NodeJS.ProcessEnv = process.env,
): UpstashRedisRestConfig | null => {
  const upstashUrl = readNonEmpty(env, 'UPSTASH_REDIS_REST_URL');
  const upstashToken = readNonEmpty(env, 'UPSTASH_REDIS_REST_TOKEN');
  if (upstashUrl && upstashToken) {
    return { url: upstashUrl, token: upstashToken };
  }

  const kvUrl = readNonEmpty(env, 'KV_REST_API_URL');
  const kvToken = readNonEmpty(env, 'KV_REST_API_TOKEN');
  if (kvUrl && kvToken) {
    return { url: kvUrl, token: kvToken };
  }

  const urlSuffix = '_KV_REST_API_URL';
  const tokenSuffix = '_KV_REST_API_TOKEN';

  const prefixes = Object.keys(env)
    .filter((key) => key.endsWith(urlSuffix))
    .map((key) => key.slice(0, -urlSuffix.length))
    .filter((prefix) => prefix.length > 0)
    .sort((a, b) => a.localeCompare(b));

  for (const prefix of prefixes) {
    const url = readNonEmpty(env, `${prefix}${urlSuffix}`);
    const token = readNonEmpty(env, `${prefix}${tokenSuffix}`);
    if (url && token) {
      return { url, token };
    }
  }

  return null;
};

