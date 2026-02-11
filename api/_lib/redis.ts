import { Redis } from '@upstash/redis';

import type { UpstashRedisRestConfig } from './upstashRedisEnv';

export const createRedisClient = (config: UpstashRedisRestConfig): Redis => new Redis(config);
