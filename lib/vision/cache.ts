import crypto from 'crypto'
import type { ComparisonResult, CachedComparison } from './types'

/**
 * Vision Analysis Cache
 * Reduces API calls and costs by caching results
 */
export class VisionCache {
  private cache: Map<string, CachedComparison> = new Map()
  private ttl: number = 86400 // 24 hours

  /**
   * Generate hash for image pair
   */
  generateHash(image1: string | Buffer, image2: string | Buffer, context?: string): string {
    const combined = [
      typeof image1 === 'string' ? image1 : image1.toString('base64'),
      typeof image2 === 'string' ? image2 : image2.toString('base64'),
      context || '',
    ].join('|')

    return crypto.createHash('sha256').update(combined).digest('hex')
  }

  /**
   * Get cached result
   */
  get(hash: string): ComparisonResult | null {
    const cached = this.cache.get(hash)
    if (!cached) return null

    // Check if expired
    if (Date.now() > cached.timestamp + cached.ttl * 1000) {
      this.cache.delete(hash)
      return null
    }

    return cached.result
  }

  /**
   * Set cached result
   */
  set(hash: string, result: ComparisonResult, ttl: number = this.ttl): void {
    this.cache.set(hash, {
      hash,
      result,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Check if hash exists and is valid
   */
  has(hash: string): boolean {
    const cached = this.cache.get(hash)
    if (!cached) return false

    if (Date.now() > cached.timestamp + cached.ttl * 1000) {
      this.cache.delete(hash)
      return false
    }

    return true
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  getStats() {
    const now = Date.now()
    const valid = Array.from(this.cache.values()).filter(
      (item) => now <= item.timestamp + item.ttl * 1000
    )

    return {
      totalEntries: this.cache.size,
      validEntries: valid.length,
      expiredEntries: this.cache.size - valid.length,
      estimatedSavings: valid.length,
    }
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    return {
      entries: this.cache.size,
      estimatedBytes: this.cache.size * 5000, // Rough estimate
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now()
    const expired: string[] = []

    for (const [hash, item] of this.cache) {
      if (now > item.timestamp + item.ttl * 1000) {
        expired.push(hash)
      }
    }

    expired.forEach((hash) => this.cache.delete(hash))
  }
}

export const createVisionCache = () => new VisionCache()

/**
 * Redis-backed cache for production (optional)
 * Allows cache sharing across instances
 */
export class VisionRedisCache {
  private client: any

  constructor(redisClient: any) {
    this.client = redisClient
  }

  /**
   * Get from Redis
   */
  async get(hash: string): Promise<any | null> {
    try {
      const cached = await this.client.get(`vision:${hash}`)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('[v0] Redis get error:', error)
      return null
    }
  }

  /**
   * Set in Redis
   */
  async set(hash: string, result: any, ttl: number = 86400): Promise<void> {
    try {
      await this.client.set(`vision:${hash}`, JSON.stringify(result), 'EX', ttl)
    } catch (error) {
      console.error('[v0] Redis set error:', error)
    }
  }

  /**
   * Check if exists
   */
  async has(hash: string): Promise<boolean> {
    try {
      return (await this.client.exists(`vision:${hash}`)) > 0
    } catch (error) {
      console.error('[v0] Redis exists error:', error)
      return false
    }
  }
}

export const createVisionRedisCache = (client: any) => new VisionRedisCache(client)
