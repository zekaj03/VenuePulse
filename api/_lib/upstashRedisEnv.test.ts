// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { resolveUpstashRedisRestConfig } from './upstashRedisEnv';

describe('resolveUpstashRedisRestConfig', () => {
  it('prefers UPSTASH_REDIS_REST_* when both are set', () => {
    const env: NodeJS.ProcessEnv = {
      UPSTASH_REDIS_REST_URL: 'https://upstash.example',
      UPSTASH_REDIS_REST_TOKEN: 'upstash-token',
      KV_REST_API_URL: 'https://kv.example',
      KV_REST_API_TOKEN: 'kv-token',
    };

    expect(resolveUpstashRedisRestConfig(env)).toEqual({
      url: 'https://upstash.example',
      token: 'upstash-token',
    });
  });

  it('falls back to KV_REST_API_* when UPSTASH_REDIS_REST_* is incomplete', () => {
    const env: NodeJS.ProcessEnv = {
      UPSTASH_REDIS_REST_URL: 'https://upstash.example',
      // Missing UPSTASH_REDIS_REST_TOKEN
      KV_REST_API_URL: 'https://kv.example',
      KV_REST_API_TOKEN: 'kv-token',
    };

    expect(resolveUpstashRedisRestConfig(env)).toEqual({
      url: 'https://kv.example',
      token: 'kv-token',
    });
  });

  it('resolves prefixed Vercel integration variables (PREFIX_KV_REST_API_*)', () => {
    const env: NodeJS.ProcessEnv = {
      MYREDIS_KV_REST_API_URL: 'https://prefixed.example',
      MYREDIS_KV_REST_API_TOKEN: 'prefixed-token',
    };

    expect(resolveUpstashRedisRestConfig(env)).toEqual({
      url: 'https://prefixed.example',
      token: 'prefixed-token',
    });
  });

  it('requires the same prefix for _KV_REST_API_URL and _KV_REST_API_TOKEN', () => {
    const env: NodeJS.ProcessEnv = {
      A_KV_REST_API_URL: 'https://a.example',
      B_KV_REST_API_TOKEN: 'b-token',
    };

    expect(resolveUpstashRedisRestConfig(env)).toBeNull();
  });

  it('chooses a deterministic prefixed match when multiple prefixes exist', () => {
    const env: NodeJS.ProcessEnv = {
      B_KV_REST_API_URL: 'https://b.example',
      B_KV_REST_API_TOKEN: 'b-token',
      A_KV_REST_API_URL: 'https://a.example',
      A_KV_REST_API_TOKEN: 'a-token',
    };

    expect(resolveUpstashRedisRestConfig(env)).toEqual({
      url: 'https://a.example',
      token: 'a-token',
    });
  });

  it('trims env values and treats empty strings as missing', () => {
    const env: NodeJS.ProcessEnv = {
      UPSTASH_REDIS_REST_URL: ' https://upstash.example ',
      UPSTASH_REDIS_REST_TOKEN: '   ',
      KV_REST_API_URL: 'https://kv.example',
      KV_REST_API_TOKEN: ' kv-token ',
    };

    expect(resolveUpstashRedisRestConfig(env)).toEqual({
      url: 'https://kv.example',
      token: 'kv-token',
    });
  });
});

