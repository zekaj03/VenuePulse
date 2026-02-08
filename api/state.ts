import { Redis } from '@upstash/redis';

type Dict = Record<string, unknown>;

const normalizeVenueId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'default';

const stateKey = (venueId: string): string => `venuepulse:state:${venueId}`;

const isDict = (value: unknown): value is Dict =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const parseJsonBody = (req: any): Dict => {
  if (isDict(req.body)) return req.body;
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      return isDict(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const readVenueId = (req: any, body?: Dict): string => {
  const fromQuery =
    typeof req.query?.venueId === 'string' ? req.query.venueId : req.query?.venueId?.[0] ?? '';
  const fromBody = typeof body?.venueId === 'string' ? body.venueId : '';
  return normalizeVenueId(fromBody || fromQuery || 'default');
};

const createRedisClient = (): Redis | null => {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
};

export default async function handler(req: any, res: any): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const redis = createRedisClient();
  if (!redis) {
    res.status(503).json({ error: 'Redis backend is not configured' });
    return;
  }

  if (req.method === 'GET') {
    const venueId = readVenueId(req);
    const stored = (await redis.get<Dict>(stateKey(venueId))) ?? {};
    res.status(200).json({ venueId, state: stored });
    return;
  }

  if (req.method === 'PATCH') {
    const body = parseJsonBody(req);
    const venueId = readVenueId(req, body);
    const patch = isDict(body.patch) ? body.patch : {};
    const existing = (await redis.get<Dict>(stateKey(venueId))) ?? {};
    const nextState: Dict = {
      ...existing,
      ...patch,
      _updatedAt: typeof body.updatedAt === 'string' ? body.updatedAt : new Date().toISOString(),
    };

    await redis.set(stateKey(venueId), nextState);
    res.status(200).json({ ok: true, venueId, updatedAt: nextState._updatedAt });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
