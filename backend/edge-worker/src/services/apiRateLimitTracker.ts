/**
 * API Rate Limit Tracker
 *
 * Tracks API usage across providers to:
 * 1. Skip providers that are at capacity (avoid wasted latency)
 * 2. Know when rate limits reset
 * 3. Provide usage analytics
 * 4. Enable smart provider selection based on remaining quota
 *
 * Source-of-truth for limits (verified against provider docs 2026-02):
 *   Serper     – 2,500/mo free, 300 req/s, resets 1st of month
 *   Brave      – 2,000/mo free, no daily cap, ~50 req/s, resets 1st of month
 *   Tavily     – 1,000 credits/mo free (1 credit = basic search), 100 RPM dev, resets 1st of month
 *   Nominatim  – 1 req/sec (policy, not quota), no monthly cap, requires custom User-Agent
 *   Workers AI – 10,000 neurons/day, resets daily 00:00 UTC, ~100 neurons per short LLM call
 *   Tessie     – No published limits; enforced via 429 + Retry-After; conservative empirical defaults
 */

import { logger } from '../utils/log';

export interface RateLimitConfig {
  provider: string;
  monthlyLimit?: number;       // Monthly cap (omit if daily-only or policy-based)
  dailyLimit?: number;         // Daily cap
  minuteLimit?: number;        // Per-minute cap
  resetDay?: number;           // Day of month limits reset (1-31, default 1)
  resetHour?: number;          // Hour limits reset (0-23, default 0 UTC)
  resetCycle?: 'monthly' | 'daily'; // 'daily' = resets every day at resetHour UTC
}

export interface ProviderStatus {
  provider: string;
  isAvailable: boolean;
  monthlyUsed: number;
  monthlyLimit: number;
  monthlyRemaining: number;
  dailyUsed: number;
  dailyLimit: number | null;
  dailyRemaining: number | null;
  minuteUsed: number;
  minuteLimit: number | null;
  lastRequestAt: string | null;
  nextResetAt: string;
  percentUsed: number;
  estimatedDaysRemaining: number | null;
}

export interface UsageRecord {
  provider: string;
  timestamp: string;
  success: boolean;
  latencyMs: number;
  errorCode?: string;
}

// ── Verified default configs ──────────────────────────────────────────
// Sources documented in file header comment.
const DEFAULT_CONFIGS: RateLimitConfig[] = [
  // Serper: 2,500 free searches/month, 300 req/s burst, resets 1st of month.
  { provider: 'serper', monthlyLimit: 2500, resetDay: 1, resetCycle: 'monthly' },

  // Brave Search: 2,000 queries/month free. No documented daily cap.
  { provider: 'brave', monthlyLimit: 2000, resetDay: 1, resetCycle: 'monthly' },

  // Tavily: 1,000 credits/month free (basic search = 1 credit, advanced = 2).
  // Dev environment: 100 RPM hard limit.
  { provider: 'tavily', monthlyLimit: 1000, minuteLimit: 100, resetDay: 1, resetCycle: 'monthly' },

  // Nominatim (OSM): Usage-policy, NOT quota.  1 req/sec absolute max on public API.
  // No monthly number exists — we use a generous ceiling for dashboard display only.
  { provider: 'nominatim', minuteLimit: 60, dailyLimit: 5000, monthlyLimit: 100000, resetCycle: 'daily' },

  // Cloudflare Workers AI: 10,000 neurons/day (free), resets daily at 00:00 UTC.
  // ~100 neurons per short LLM call (llama-3.1-8b, <200 tokens).
  { provider: 'cloudflare_ai', dailyLimit: 10000, monthlyLimit: 300000, resetCycle: 'daily', resetHour: 0 },

  // Tessie: No published limits. Enforced via 429 + Retry-After.
  // Conservative empirical defaults; adjust after observing real 429 patterns.
  { provider: 'tessie', dailyLimit: 500, monthlyLimit: 15000, minuteLimit: 10, resetCycle: 'monthly', resetDay: 1 },
];

export class ApiRateLimitTracker {
  private db: D1Database;
  private configs: Map<string, RateLimitConfig>;

  // In-memory cache for hot path (minute-level tracking)
  private minuteCache: Map<string, { count: number; windowStart: number }> = new Map();

  constructor(db: D1Database, customConfigs?: RateLimitConfig[]) {
    this.db = db;
    this.configs = new Map();

    // Load default configs
    for (const config of DEFAULT_CONFIGS) {
      this.configs.set(config.provider, config);
    }

    // Override with custom configs
    if (customConfigs) {
      for (const config of customConfigs) {
        this.configs.set(config.provider, config);
      }
    }
  }

  /**
   * Record an API request (call after each API call)
   */
  async recordRequest(
    provider: string,
    success: boolean,
    latencyMs: number,
    errorCode?: string
  ): Promise<void> {
    const now = new Date();

    // Update minute cache
    this.updateMinuteCache(provider);

    // Record to database
    try {
      await this.db.prepare(`
        INSERT INTO api_rate_limits (
          provider, request_date, request_hour, request_minute,
          success_count, error_count, total_latency_ms, last_error_code, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(provider, request_date, request_hour, request_minute) DO UPDATE SET
          success_count = success_count + ?,
          error_count = error_count + ?,
          total_latency_ms = total_latency_ms + ?,
          last_error_code = COALESCE(?, last_error_code),
          updated_at = ?
      `).bind(
        provider,
        now.toISOString().split('T')[0], // YYYY-MM-DD
        now.getUTCHours(),
        now.getUTCMinutes(),
        success ? 1 : 0,
        success ? 0 : 1,
        latencyMs,
        errorCode || null,
        now.toISOString(),
        // ON CONFLICT values
        success ? 1 : 0,
        success ? 0 : 1,
        latencyMs,
        errorCode || null,
        now.toISOString()
      ).run();
    } catch (error) {
      logger.warn('Failed to record API request', { error, provider });
    }
  }

  /**
   * Check if a provider is available (not rate limited)
   */
  async isProviderAvailable(provider: string): Promise<boolean> {
    const status = await this.getProviderStatus(provider);
    return status.isAvailable;
  }

  /**
   * Get detailed status for a provider
   */
  async getProviderStatus(provider: string): Promise<ProviderStatus> {
    const config = this.configs.get(provider) || {
      provider,
      monthlyLimit: 1000,
      resetDay: 1,
      resetCycle: 'monthly' as const,
    };

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Get monthly usage
    const monthlyResult = await this.db.prepare(`
      SELECT COALESCE(SUM(success_count + error_count), 0) as total
      FROM api_rate_limits
      WHERE provider = ? AND request_date LIKE ?
    `).bind(provider, `${currentMonth}%`).first<{ total: number }>();

    const monthlyUsed = monthlyResult?.total || 0;

    // Get daily usage
    const dailyResult = await this.db.prepare(`
      SELECT COALESCE(SUM(success_count + error_count), 0) as total
      FROM api_rate_limits
      WHERE provider = ? AND request_date = ?
    `).bind(provider, currentDate).first<{ total: number }>();

    const dailyUsed = dailyResult?.total || 0;

    // Get minute usage from cache
    const minuteUsed = this.getMinuteUsage(provider);

    // Get last request time
    const lastRequest = await this.db.prepare(`
      SELECT MAX(updated_at) as last_at
      FROM api_rate_limits
      WHERE provider = ?
    `).bind(provider).first<{ last_at: string | null }>();

    // Calculate next reset
    const nextReset = this.calculateNextReset(config);

    // Determine availability — check daily limit for daily-cycle providers
    const effectiveMonthlyLimit = config.monthlyLimit ?? Infinity;
    const monthlyRemaining = effectiveMonthlyLimit - monthlyUsed;
    const dailyRemaining = config.dailyLimit ? config.dailyLimit - dailyUsed : null;
    const minuteRemaining = config.minuteLimit ? config.minuteLimit - minuteUsed : null;

    const isAvailable =
      monthlyRemaining > 0 &&
      (dailyRemaining === null || dailyRemaining > 0) &&
      (minuteRemaining === null || minuteRemaining > 0);

    // Estimate days remaining at current usage rate
    const dayOfMonth = now.getDate();
    const avgDailyUsage = monthlyUsed / Math.max(dayOfMonth, 1);
    const estimatedDaysRemaining = avgDailyUsage > 0
      ? Math.floor(monthlyRemaining / avgDailyUsage)
      : null;

    return {
      provider,
      isAvailable,
      monthlyUsed,
      monthlyLimit: effectiveMonthlyLimit === Infinity ? 0 : effectiveMonthlyLimit,
      monthlyRemaining: effectiveMonthlyLimit === Infinity ? 0 : monthlyRemaining,
      dailyUsed,
      dailyLimit: config.dailyLimit || null,
      dailyRemaining,
      minuteUsed,
      minuteLimit: config.minuteLimit || null,
      lastRequestAt: lastRequest?.last_at || null,
      nextResetAt: nextReset.toISOString(),
      percentUsed: effectiveMonthlyLimit !== Infinity && effectiveMonthlyLimit > 0
        ? Math.round((monthlyUsed / effectiveMonthlyLimit) * 100)
        : (config.dailyLimit ? Math.round((dailyUsed / config.dailyLimit) * 100) : 0),
      estimatedDaysRemaining,
    };
  }

  /**
   * Get status for all configured providers
   */
  async getAllProviderStatuses(): Promise<ProviderStatus[]> {
    const statuses: ProviderStatus[] = [];
    for (const provider of this.configs.keys()) {
      statuses.push(await this.getProviderStatus(provider));
    }
    return statuses.sort((a, b) => a.percentUsed - b.percentUsed);
  }

  /**
   * Get the best available provider (most remaining quota)
   */
  async getBestAvailableProvider(preferredOrder?: string[]): Promise<string | null> {
    const statuses = await this.getAllProviderStatuses();
    const available = statuses.filter(s => s.isAvailable);

    if (available.length === 0) return null;

    // If preferred order specified, use first available from that list
    if (preferredOrder) {
      for (const provider of preferredOrder) {
        const status = available.find(s => s.provider === provider);
        if (status) return status.provider;
      }
    }

    // Otherwise return the one with most remaining quota
    return available.sort((a, b) => b.monthlyRemaining - a.monthlyRemaining)[0].provider;
  }

  /**
   * Get usage analytics for a time period
   */
  async getUsageAnalytics(days: number = 30): Promise<{
    byProvider: Record<string, { total: number; success: number; errors: number; avgLatency: number }>;
    byDay: { date: string; total: number }[];
    totalRequests: number;
    successRate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // By provider
    const byProviderResult = await this.db.prepare(`
      SELECT
        provider,
        SUM(success_count) as success,
        SUM(error_count) as errors,
        SUM(success_count + error_count) as total,
        AVG(total_latency_ms / NULLIF(success_count + error_count, 0)) as avg_latency
      FROM api_rate_limits
      WHERE request_date >= ?
      GROUP BY provider
    `).bind(startDateStr).all();

    // By day
    const byDayResult = await this.db.prepare(`
      SELECT
        request_date as date,
        SUM(success_count + error_count) as total
      FROM api_rate_limits
      WHERE request_date >= ?
      GROUP BY request_date
      ORDER BY request_date
    `).bind(startDateStr).all();

    const byProvider: Record<string, any> = {};
    let totalRequests = 0;
    let totalSuccess = 0;

    for (const row of (byProviderResult.results || []) as any[]) {
      byProvider[row.provider] = {
        total: row.total,
        success: row.success,
        errors: row.errors,
        avgLatency: Math.round(row.avg_latency || 0),
      };
      totalRequests += row.total;
      totalSuccess += row.success;
    }

    return {
      byProvider,
      byDay: (byDayResult.results || []) as { date: string; total: number }[],
      totalRequests,
      successRate: totalRequests > 0 ? Math.round((totalSuccess / totalRequests) * 100) : 100,
    };
  }

  /**
   * Predict when quota will be exhausted at current rate
   */
  async predictQuotaExhaustion(provider: string): Promise<{
    willExhaust: boolean;
    exhaustionDate: string | null;
    daysUntilExhaustion: number | null;
    recommendation: string;
  }> {
    const status = await this.getProviderStatus(provider);

    if (status.estimatedDaysRemaining === null) {
      return {
        willExhaust: false,
        exhaustionDate: null,
        daysUntilExhaustion: null,
        recommendation: 'Not enough data to predict',
      };
    }

    const now = new Date();
    const resetDate = new Date(status.nextResetAt);
    const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const willExhaust = status.estimatedDaysRemaining < daysUntilReset;

    let exhaustionDate: string | null = null;
    if (willExhaust && status.estimatedDaysRemaining > 0) {
      const exhaustDate = new Date();
      exhaustDate.setDate(exhaustDate.getDate() + status.estimatedDaysRemaining);
      exhaustionDate = exhaustDate.toISOString().split('T')[0];
    }

    let recommendation = 'Usage is sustainable';
    if (willExhaust) {
      if (status.percentUsed > 80) {
        recommendation = 'Consider adding additional search providers';
      } else {
        recommendation = 'Monitor usage - may need to reduce search frequency';
      }
    }

    return {
      willExhaust,
      exhaustionDate,
      daysUntilExhaustion: status.estimatedDaysRemaining,
      recommendation,
    };
  }

  // Private helpers

  private updateMinuteCache(provider: string): void {
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000; // Start of current minute

    const cached = this.minuteCache.get(provider);
    if (cached && cached.windowStart === windowStart) {
      cached.count++;
    } else {
      this.minuteCache.set(provider, { count: 1, windowStart });
    }
  }

  private getMinuteUsage(provider: string): number {
    const now = Date.now();
    const windowStart = Math.floor(now / 60000) * 60000;

    const cached = this.minuteCache.get(provider);
    if (cached && cached.windowStart === windowStart) {
      return cached.count;
    }
    return 0;
  }

  private calculateNextReset(config: RateLimitConfig): Date {
    const now = new Date();
    const resetHour = config.resetHour || 0;

    // Daily-cycle providers reset tomorrow at resetHour UTC
    if (config.resetCycle === 'daily') {
      const todayReset = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        resetHour, 0, 0
      ));
      if (now < todayReset) return todayReset;
      // Already past today's reset → next one is tomorrow
      const tomorrow = new Date(todayReset);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      return tomorrow;
    }

    // Monthly-cycle providers reset on resetDay at resetHour UTC
    const resetDay = config.resetDay || 1;
    let nextReset = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      resetDay,
      resetHour, 0, 0
    ));

    // If we're past the reset day this month, move to next month
    if (now >= nextReset) {
      nextReset = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        resetDay,
        resetHour, 0, 0
      ));
    }

    return nextReset;
  }
}

/**
 * Create the rate limit tracking table
 */
export const RATE_LIMIT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  request_date TEXT NOT NULL,        -- YYYY-MM-DD
  request_hour INTEGER NOT NULL,     -- 0-23
  request_minute INTEGER NOT NULL,   -- 0-59
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  total_latency_ms INTEGER DEFAULT 0,
  last_error_code TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(provider, request_date, request_hour, request_minute)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_provider_date ON api_rate_limits(provider, request_date);
CREATE INDEX IF NOT EXISTS idx_rate_limits_date ON api_rate_limits(request_date);
`;
