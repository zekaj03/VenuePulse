import { z } from 'zod';
import type { Redis } from '@upstash/redis';
import { createRedisClient } from './_lib/redis';
import { resolveUpstashRedisRestConfig } from './_lib/upstashRedisEnv';
import { normalizeVenueId } from './_lib/venueId';

type Dict = Record<string, unknown>;

const stateKey = (venueId: string): string => `venuepulse:state:${venueId}`;
const rateLimitKey = (venueId: string, ip: string): string => `venuepulse:rate:state:${venueId}:${ip}`;

const isDict = (value: unknown): value is Dict =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string | undefined } | undefined;
};

type ResponseLike = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => ResponseLike;
  json: (payload: unknown) => void;
  end: () => void;
};

const MAX_BODY_BYTES = 512 * 1024;
const MAX_PATCH_KEYS = 64;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 600;

const ALLOWED_PATCH_KEYS = new Set<string>([
  'club_counts',
  'club_log',
  'club_max_capacity',
  'club_theme',
  'club_language',
  'club_settings',
  'club_subscription',
  'club_tutorial_complete',
  'club_role_view',
  'club_zones',
  'club_users',
  'club_current_user',
  'club_shifts',
  'club_audit_logs',
  'club_guests',
  'club_reservations',
  'club_waitlist',
  'club_revenue',
  'club_closings',
  'club_security',
  'club_notifications',
  'club_notification_settings',
  'club_incidents',
  'club_handover_reports',
  'club_last_sync',
  'club_api_key',
  // Legacy keys still supported by the client loader.
  'club_revenue_entries',
  'club_daily_closings',
]);

const PatchBodySchema = z
  .object({
    venueId: z.string().optional(),
    patch: z.unknown(),
    updatedAt: z.string().optional(),
  })
  .strict();

const parseJsonBodyStrict = (req: RequestLike): unknown => {
  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }
  if (Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString('utf8'));
  }
  return req.body;
};

const getHeader = (req: RequestLike, name: string): string | null => {
  const value = req.headers[name.toLowerCase()];
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
};

const computeRequestOrigin = (req: RequestLike): string | null => {
  const host = getHeader(req, 'host');
  if (!host) return null;
  const proto =
    getHeader(req, 'x-forwarded-proto') ??
    getHeader(req, 'x-vercel-forwarded-proto') ??
    'https';
  return `${proto}://${host}`;
};

const getAllowedCorsOrigin = (req: RequestLike): string | null => {
  const origin = getHeader(req, 'origin');
  if (!origin) return null;
  if (origin === 'null') return null;

  const configured = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry !== '*');

  try {
    const host = getHeader(req, 'host');
    if (host && new URL(origin).host === host) return origin;
  } catch {
    // Ignore; treat as not same-origin.
  }

  if (configured.length > 0 && configured.includes(origin)) return origin;

  const sameOrigin = computeRequestOrigin(req);
  return sameOrigin && origin === sameOrigin ? origin : null;
};

const applyCors = (req: RequestLike, res: ResponseLike): boolean => {
  const origin = getHeader(req, 'origin');
  if (!origin) return true;

  const allowedOrigin = getAllowedCorsOrigin(req);
  if (!allowedOrigin) return false;

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  return true;
};

const readVenueId = (req: RequestLike, body?: Dict): string => {
  const q = req.query?.venueId;
  const fromQuery = typeof q === 'string' ? q : Array.isArray(q) ? q[0] ?? '' : '';
  const fromBody = typeof body?.venueId === 'string' ? body.venueId : '';
  return normalizeVenueId(fromBody || fromQuery || 'default');
};

const getClientIp = (req: RequestLike): string => {
  const forwarded = getHeader(req, 'x-forwarded-for');
  const raw = forwarded?.split(',')[0]?.trim() || getHeader(req, 'x-real-ip') || req.socket?.remoteAddress || 'unknown';
  // Keep the key short-ish and Redis-safe.
  return raw.replace(/[^a-zA-Z0-9:.]/g, '_').slice(0, 64) || 'unknown';
};

const guardBodySize = (req: RequestLike): { ok: true } | { ok: false; status: 413; error: string } => {
  const contentLength = getHeader(req, 'content-length');
  if (contentLength) {
    const parsed = Number.parseInt(contentLength, 10);
    if (Number.isFinite(parsed) && parsed > MAX_BODY_BYTES) {
      return { ok: false, status: 413, error: 'Payload too large' };
    }
  }

  // Best-effort fallback when content-length is missing.
  if (typeof req.body !== 'undefined') {
    try {
      const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
        return { ok: false, status: 413, error: 'Payload too large' };
      }
    } catch {
      // If it's not serializable, reject rather than risking large payloads.
      return { ok: false, status: 413, error: 'Payload too large' };
    }
  }

  return { ok: true };
};

const enforceRateLimit = async (redis: Redis, venueId: string, ip: string): Promise<{ ok: true } | { ok: false; status: 429; retryAfterSeconds: number }> => {
  const key = rateLimitKey(venueId, ip);
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;
  const member = `${now}-${crypto.randomUUID()}`;

  const [, , count] = await redis
    .pipeline()
    .zadd(key, { score: now, member })
    .zremrangebyscore(key, 0, windowStart)
    .zcard(key)
    .expire(key, Math.ceil(RATE_WINDOW_MS / 1000))
    .exec<[number, number, number, number]>();

  if (count > RATE_LIMIT) {
    return { ok: false, status: 429, retryAfterSeconds: Math.ceil(RATE_WINDOW_MS / 1000) };
  }

  return { ok: true };
};

export default async function handler(req: RequestLike, res: ResponseLike): Promise<void> {
  if (!applyCors(req, res)) {
    res.status(403).json({ error: 'CORS origin not allowed' });
    return;
  }

  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method === 'PATCH') {
    const contentType = getHeader(req, 'content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      res.status(415).json({ error: 'Unsupported media type' });
      return;
    }

    const sizeGuard = guardBodySize(req);
    if (!sizeGuard.ok) {
      res.status(sizeGuard.status).json({ error: sizeGuard.error });
      return;
    }
  }

  const redisConfig = resolveUpstashRedisRestConfig();
  const redis = redisConfig ? createRedisClient(redisConfig) : null;
  if (!redis) {
    res.status(503).json({ error: 'Redis backend is not configured' });
    return;
  }

  const venueIdForRate = req.method === 'PATCH' ? (() => {
    try {
      const parsed = parseJsonBodyStrict(req);
      if (isDict(parsed) && typeof parsed.venueId === 'string') return normalizeVenueId(parsed.venueId);
    } catch {
      // Ignore; we will validate later for PATCH and default for GET.
    }
    return readVenueId(req);
  })() : readVenueId(req);

  const rateResult = await enforceRateLimit(redis, venueIdForRate, getClientIp(req));
  if (!rateResult.ok) {
    res.setHeader('Retry-After', String(rateResult.retryAfterSeconds));
    res.status(rateResult.status).json({ error: 'Rate limit exceeded' });
    return;
  }

  if (req.method === 'GET') {
    const venueId = venueIdForRate;
    const storedRaw = (await redis.get<unknown>(stateKey(venueId))) ?? {};
    const stored = isDict(storedRaw) ? storedRaw : {};
    res.status(200).json({ venueId, state: stored });
    return;
  }

  if (req.method === 'PATCH') {
    let rawBody: unknown;
    try {
      rawBody = parseJsonBodyStrict(req);
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }

    const parsedBody = PatchBodySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      res.status(400).json({ error: 'Invalid request body', details: parsedBody.error.flatten() });
      return;
    }

    const body = parsedBody.data;
    if (!isDict(body.patch)) {
      res.status(400).json({ error: 'Invalid request body', details: { patch: ['Expected object'] } });
      return;
    }

    const patchKeys = Object.keys(body.patch);
    if (patchKeys.length > MAX_PATCH_KEYS) {
      res.status(413).json({ error: 'Patch has too many keys' });
      return;
    }

    const invalidKeys = patchKeys.filter((key) => !ALLOWED_PATCH_KEYS.has(key));
    if (invalidKeys.length > 0) {
      res.status(400).json({ error: 'Patch contains disallowed keys', invalidKeys });
      return;
    }

    const venueId = normalizeVenueId(body.venueId ?? venueIdForRate);
    const patch: Dict = body.patch;
    const existingRaw = (await redis.get<unknown>(stateKey(venueId))) ?? {};
    const existing = isDict(existingRaw) ? existingRaw : {};
    const updatedAt =
      body.updatedAt && Number.isFinite(Date.parse(body.updatedAt)) ? body.updatedAt : new Date().toISOString();

    const nextState: Dict = {
      ...existing,
      ...patch,
      _updatedAt: updatedAt,
    };

    await redis.set(stateKey(venueId), nextState);
    res.status(200).json({ ok: true, venueId, updatedAt: nextState._updatedAt });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
