import redis from 'redis';
import { config } from '../config';

export class CacheService {
  private client: any;
  private isConnected: boolean = false;

  constructor() {
    this.client = redis.createClient({ url: config.redisUrl });
    this.client.on('error', (err: any) => console.log('Redis Client Error:', err));
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.client.connect();
      this.isConnected = true;
      console.log('Redis connected');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set<T = any>(key: string, value: T, expirySeconds?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (expirySeconds) {
        await this.client.setEx(key, expirySeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      return result === 1;
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.client.mGet(keys);
      return values.map((v: any) => (v ? JSON.parse(v) : null));
    } catch (error) {
      console.error(`Error getting multiple cache keys:`, error);
      return keys.map(() => null);
    }
  }

  async mset<T = any>(keyValues: Array<[string, T]>, expirySeconds?: number): Promise<boolean> {
    try {
      for (const [key, value] of keyValues) {
        await this.set(key, value, expirySeconds);
      }
      return true;
    } catch (error) {
      console.error(`Error setting multiple cache keys:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error checking cache key existence:`, error);
      return false;
    }
  }

  async clear(pattern: string = '*'): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      return await this.client.del(keys);
    } catch (error) {
      console.error(`Error clearing cache:`, error);
      return 0;
    }
  }

  /**
   * Cache decorator for methods
   */
  static cacheKey(prefix: string, ...args: any[]): string {
    return `${prefix}:${args.join(':')}`;
  }
}
