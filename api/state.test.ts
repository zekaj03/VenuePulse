// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { normalizeVenueId } from './_lib/venueId';

let testRedis: MockRedis | null = null;

vi.mock('./_lib/redis', () => ({
  createRedisClient: () => testRedis,
}));

import handler from './state';

type MockReq = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string | undefined } | undefined;
};

const createRes = () => {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let jsonBody: unknown = undefined;
  let ended = false;

  const res = {
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: unknown) {
      jsonBody = payload;
    },
    end() {
      ended = true;
    },
  };

  return { res, headers, get statusCode() { return statusCode; }, get jsonBody() { return jsonBody; }, get ended() { return ended; } };
};

class MockPipeline {
  constructor(private readonly redis: MockRedis) {}

  zadd(_key: string, _scoreMember: { score: number; member: string }) {
    return this;
  }

  zremrangebyscore(_key: string, _min: number, _max: number) {
    return this;
  }

  zcard(_key: string) {
    return this;
  }

  expire(_key: string, _seconds: number) {
    return this;
  }

  async exec<T extends unknown[]>(): Promise<T> {
    return [1, 0, this.redis.zcardCount, 1] as unknown as T;
  }
}

class MockRedis {
  public readonly store = new Map<string, unknown>();
  public zcardCount = 1;

  pipeline() {
    return new MockPipeline(this);
  }

  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) ?? null;
  }

  async set(key: string, value: unknown): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }
}

describe('/api/state', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    testRedis = new MockRedis();
  });

  afterEach(() => {
    process.env = originalEnv;
    testRedis = null;
    vi.restoreAllMocks();
  });

  const getTestRedis = (): MockRedis => {
    if (!testRedis) {
      throw new Error('testRedis is not initialized');
    }
    return testRedis;
  };

  it('rejects disallowed patch keys', async () => {
    const ctx = createRes();
    const redis = getTestRedis();
    const setSpy = vi.spyOn(redis, 'set');

    const req: MockReq = {
      method: 'PATCH',
      headers: {
        origin: 'https://example.com',
        host: 'example.com',
        'content-type': 'application/json',
      },
      body: {
        venueId: 'venue-a',
        patch: { not_allowed: 123 },
        updatedAt: new Date().toISOString(),
      },
    };

    await handler(req, ctx.res);
    expect(ctx.statusCode).toBe(400);
    expect(ctx.jsonBody).toMatchObject({ error: 'Patch contains disallowed keys' });
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('enforces max patch key count', async () => {
    const ctx = createRes();

    const patch: Record<string, unknown> = {};
    for (let i = 0; i < 65; i += 1) {
      patch[`club_counts_${i}`] = i;
    }

    const req: MockReq = {
      method: 'PATCH',
      headers: {
        origin: 'https://example.com',
        host: 'example.com',
        'content-type': 'application/json',
      },
      body: { venueId: 'venue-a', patch, updatedAt: new Date().toISOString() },
    };

    await handler(req, ctx.res);
    expect(ctx.statusCode).toBe(413);
    expect(ctx.jsonBody).toMatchObject({ error: 'Patch has too many keys' });
  });

  it('requires application/json for PATCH', async () => {
    const ctx = createRes();

    const req: MockReq = {
      method: 'PATCH',
      headers: {
        origin: 'https://example.com',
        host: 'example.com',
        'content-type': 'text/plain',
      },
      body: 'not json',
    };

    await handler(req, ctx.res);
    expect(ctx.statusCode).toBe(415);
    expect(ctx.jsonBody).toMatchObject({ error: 'Unsupported media type' });
  });

  it('rejects oversized payloads using content-length', async () => {
    const ctx = createRes();

    const req: MockReq = {
      method: 'PATCH',
      headers: {
        origin: 'https://example.com',
        host: 'example.com',
        'content-type': 'application/json',
        'content-length': String(512 * 1024 + 1),
      },
      body: { venueId: 'venue-a', patch: { club_counts: { Male: 1 } } },
    };

    await handler(req, ctx.res);
    expect(ctx.statusCode).toBe(413);
    expect(ctx.jsonBody).toMatchObject({ error: 'Payload too large' });
  });

  it('blocks cross-origin by default', async () => {
    const ctx = createRes();

    const req: MockReq = {
      method: 'GET',
      headers: {
        origin: 'https://evil.com',
        host: 'example.com',
      },
      query: { venueId: 'venue-a' },
    };

    await handler(req, ctx.res);
    expect(ctx.statusCode).toBe(403);
    expect(ctx.jsonBody).toMatchObject({ error: 'CORS origin not allowed' });
  });

  it('merges allowed patch keys into stored state', async () => {
    const ctx = createRes();
    const redis = getTestRedis();

    const venueId = normalizeVenueId('Venue A');
    const key = `venuepulse:state:${venueId}`;
    redis.store.set(key, { club_theme: 'system', club_counts: { Male: 0 } });

    const req: MockReq = {
      method: 'PATCH',
      headers: {
        origin: 'https://example.com',
        host: 'example.com',
        'content-type': 'application/json',
      },
      body: {
        venueId: 'Venue A',
        patch: { club_counts: { Male: 5 }, club_theme: 'dark' },
        updatedAt: new Date().toISOString(),
      },
    };

    await handler(req, ctx.res);
    expect(ctx.statusCode).toBe(200);
    expect(ctx.jsonBody).toMatchObject({ ok: true, venueId });

    const stored = redis.store.get(key) as Record<string, unknown>;
    expect(stored.club_counts).toEqual({ Male: 5 });
    expect(stored.club_theme).toBe('dark');
    expect(typeof stored._updatedAt).toBe('string');
  });

  it('returns 429 when rate limited', async () => {
    const ctx = createRes();
    const redis = getTestRedis();
    redis.zcardCount = 601;

    const req: MockReq = {
      method: 'GET',
      headers: {
        origin: 'https://example.com',
        host: 'example.com',
      },
      query: { venueId: 'venue-a' },
    };

    await handler(req, ctx.res);
    expect(ctx.statusCode).toBe(429);
    expect(ctx.jsonBody).toMatchObject({ error: 'Rate limit exceeded' });
    expect(ctx.headers['Retry-After']).toBeTruthy();
  });
});
