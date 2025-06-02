/**
 * KV cache implementation for Ed Code sections
 */

import { Env, CacheEntry, EdCodeSection } from './types';

export class Cache {
  private kv: KVNamespace;
  private ttl: number;

  constructor(env: Env) {
    this.kv = env.CACHE;
    this.ttl = parseInt(env.CACHE_TTL) || 86400; // 24 hours default
  }

  /**
   * Get a cached section
   */
  async get(section: string): Promise<EdCodeSection | null> {
    const key = this.buildKey(section);
    
    try {
      const cached = await this.kv.get(key, 'json') as CacheEntry | null;
      
      if (!cached) {
        return null;
      }

      // Check if expired
      const age = Date.now() - cached.cachedAt;
      if (age > cached.ttl * 1000) {
        // Expired, delete it
        await this.kv.delete(key);
        return null;
      }

      // Return the section data
      const { section: sec, title, content, url, fetchedAt } = cached;
      return { section: sec, title, content, url, fetchedAt };
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set a cached section
   */
  async set(section: string, data: EdCodeSection): Promise<void> {
    const key = this.buildKey(section);
    
    const entry: CacheEntry = {
      ...data,
      cachedAt: Date.now(),
      ttl: this.ttl
    };

    try {
      await this.kv.put(key, JSON.stringify(entry), {
        expirationTtl: this.ttl
      });
    } catch (error) {
      console.error('Cache set error:', error);
      // Don't throw - caching is not critical
    }
  }

  /**
   * Build cache key
   */
  private buildKey(section: string): string {
    return `edc:${section}`;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number }> {
    // KV doesn't provide easy way to count keys
    // This is a placeholder for future implementation
    return { keys: 0 };
  }
}