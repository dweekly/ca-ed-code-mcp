/**
 * Rate limiting implementation using KV
 */

import { Env, RateLimitEntry } from './types';

export class RateLimiter {
  private kv: KVNamespace;
  private globalLimit: number;
  private sectionLimit: number;
  private windowSeconds: number;

  constructor(env: Env) {
    this.kv = env.RATE_LIMIT;
    this.globalLimit = parseInt(env.GLOBAL_RATE_LIMIT) || 1000;
    this.sectionLimit = parseInt(env.SECTION_RATE_LIMIT) || 10;
    this.windowSeconds = parseInt(env.RATE_LIMIT_WINDOW) || 60;
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(ip: string, section?: string): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    // Check global limit first
    const globalResult = await this.checkAndIncrement(`global:${ip}`, this.globalLimit);
    if (!globalResult.allowed) {
      return globalResult;
    }

    // If section provided, check section-specific limit
    if (section) {
      const sectionResult = await this.checkAndIncrement(
        `section:${section}:${ip}`,
        this.sectionLimit
      );
      if (!sectionResult.allowed) {
        return sectionResult;
      }
    }

    return globalResult;
  }

  /**
   * Check and increment counter
   */
  private async checkAndIncrement(
    key: string,
    limit: number
  ): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const windowStart = Math.floor(now / 1000 / this.windowSeconds) * this.windowSeconds * 1000;
    
    try {
      // Get current count
      const entry = await this.kv.get(key, 'json') as RateLimitEntry | null;
      
      if (!entry || entry.windowStart < windowStart) {
        // New window
        const newEntry: RateLimitEntry = {
          count: 1,
          windowStart
        };
        await this.kv.put(key, JSON.stringify(newEntry), {
          expirationTtl: this.windowSeconds * 2 // Keep for 2 windows
        });
        
        return {
          allowed: true,
          limit,
          remaining: limit - 1,
          reset: windowStart + (this.windowSeconds * 1000)
        };
      }

      // Same window
      if (entry.count >= limit) {
        return {
          allowed: false,
          limit,
          remaining: 0,
          reset: windowStart + (this.windowSeconds * 1000)
        };
      }

      // Increment count
      entry.count++;
      await this.kv.put(key, JSON.stringify(entry), {
        expirationTtl: this.windowSeconds * 2
      });

      return {
        allowed: true,
        limit,
        remaining: limit - entry.count,
        reset: windowStart + (this.windowSeconds * 1000)
      };
    } catch (error) {
      console.error('Rate limit error:', error);
      // On error, allow the request
      return {
        allowed: true,
        limit,
        remaining: limit,
        reset: windowStart + (this.windowSeconds * 1000)
      };
    }
  }
}