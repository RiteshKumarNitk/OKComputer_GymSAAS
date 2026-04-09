import { createClient } from 'redis';
import logger from './logger.js';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Simple Memory Store fallback for development
class MemoryStore {
    private store = new Map<string, any>();
    private expiries = new Map<string, NodeJS.Timeout>();

    async get(key: string) { return this.store.get(key) || null; }
    async setEx(key: string, seconds: number, value: string) {
        this.store.set(key, value);
        if (this.expiries.has(key)) clearTimeout(this.expiries.get(key)!);
        this.expiries.set(key, setTimeout(() => this.store.delete(key), seconds * 1000));
    }
    async del(key: string) { 
        this.store.delete(key); 
        if (this.expiries.has(key)) clearTimeout(this.expiries.get(key)!);
    }
    async incr(key: string) {
        const val = parseInt(this.store.get(key) || '0') + 1;
        this.store.set(key, val.toString());
        return val;
    }
    async expire(key: string, seconds: number) {
        if (!this.store.has(key)) return;
        if (this.expiries.has(key)) clearTimeout(this.expiries.get(key)!);
        this.expiries.set(key, setTimeout(() => this.store.delete(key), seconds * 1000));
    }
}

const memoryStore = new MemoryStore();
let useMemoryFallback = false;

const redisClient = createClient({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 3) {
                if (!useMemoryFallback) {
                    logger.warn('⚠️ Redis unreachable after 3 attempts. Falling back to Memory Store.');
                    useMemoryFallback = true;
                }
                return false; // Stop retrying
            }
            return 5000; // Retry every 5s
        }
    }
});

redisClient.on('error', (err) => {
    if (!useMemoryFallback) {
        logger.error('Redis Client Error', { message: err.message, code: err.code });
    }
});

redisClient.on('connect', () => {
    logger.info('✅ Redis Client Connected');
    useMemoryFallback = false;
});

// Initialize connection
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        // Error handled by reconnectStrategy/on('error')
    }
})();

// Export a proxy that switches between Redis and Memory
const proxy = new Proxy(redisClient, {
    get(target, prop: string) {
        if (useMemoryFallback && (memoryStore as any)[prop]) {
            return (memoryStore as any)[prop].bind(memoryStore);
        }
        const val = (target as any)[prop];
        return typeof val === 'function' ? val.bind(target) : val;
    }
});

export default proxy as any;
