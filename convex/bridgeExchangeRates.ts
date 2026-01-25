import { v } from "convex/values";
import { query, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Rate cache duration in milliseconds (30 seconds - matches Bridge update frequency)
const RATE_CACHE_DURATION_MS = 30 * 1000;

// Default currency pairs to fetch
const DEFAULT_PAIRS = [
  { from: "usd", to: "gbp" },
  { from: "usd", to: "eur" },
  { from: "usd", to: "mxn" },
  { from: "usd", to: "brl" },
  { from: "usd", to: "usdt" },
  { from: "btc", to: "usd" },
  { from: "eth", to: "usd" },
  { from: "sol", to: "usd" },
];

// Internal mutation to upsert exchange rate
export const upsertRate = internalMutation({
  args: {
    fromCurrency: v.string(),
    toCurrency: v.string(),
    midmarketRate: v.string(),
    buyRate: v.string(),
    sellRate: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("exchangeRates")
      .withIndex("by_pair", (q) =>
        q.eq("fromCurrency", args.fromCurrency).eq("toCurrency", args.toCurrency)
      )
      .first();

    const data = {
      fromCurrency: args.fromCurrency,
      toCurrency: args.toCurrency,
      midmarketRate: args.midmarketRate,
      buyRate: args.buyRate,
      sellRate: args.sellRate,
      fetchedAt: now,
      expiresAt: now + RATE_CACHE_DURATION_MS,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    }

    return await ctx.db.insert("exchangeRates", data);
  },
});

// Query to get a single exchange rate
export const getRate = query({
  args: {
    fromCurrency: v.string(),
    toCurrency: v.string(),
  },
  handler: async (ctx, args) => {
    const rate = await ctx.db
      .query("exchangeRates")
      .withIndex("by_pair", (q) =>
        q
          .eq("fromCurrency", args.fromCurrency.toLowerCase())
          .eq("toCurrency", args.toCurrency.toLowerCase())
      )
      .first();

    if (!rate) return null;

    return {
      ...rate,
      isStale: Date.now() > rate.expiresAt,
    };
  },
});

// Query to get all cached rates
export const getAllRates = query({
  args: {},
  handler: async (ctx) => {
    const rates = await ctx.db.query("exchangeRates").collect();
    const now = Date.now();

    return rates.map((rate) => ({
      ...rate,
      isStale: now > rate.expiresAt,
    }));
  },
});

// Query to get display rates for wallet cards (USD -> GBP, EUR, etc.)
export const getDisplayRates = query({
  args: {},
  handler: async (ctx) => {
    const displayCurrencies = ["gbp", "eur", "mxn", "brl"];
    const rates: Record<string, { midmarket: number; buy: number; sell: number; isStale: boolean }> = {};

    for (const currency of displayCurrencies) {
      const rate = await ctx.db
        .query("exchangeRates")
        .withIndex("by_pair", (q) => q.eq("fromCurrency", "usd").eq("toCurrency", currency))
        .first();

      if (rate) {
        rates[currency] = {
          midmarket: parseFloat(rate.midmarketRate),
          buy: parseFloat(rate.buyRate),
          sell: parseFloat(rate.sellRate),
          isStale: Date.now() > rate.expiresAt,
        };
      }
    }

    return rates;
  },
});

// Action to fetch a single exchange rate from Bridge API
export const fetchRate = action({
  args: {
    fromCurrency: v.string(),
    toCurrency: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) {
      throw new Error("BRIDGE_API_KEY not configured");
    }

    const from = args.fromCurrency.toLowerCase();
    const to = args.toCurrency.toLowerCase();

    const response = await fetch(
      `${apiUrl}/exchange_rates?from=${from}&to=${to}`,
      {
        headers: {
          Accept: "application/json",
          "Api-Key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch exchange rate: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Save to database
    await ctx.runMutation(internal.bridgeExchangeRates.upsertRate, {
      fromCurrency: from,
      toCurrency: to,
      midmarketRate: data.midmarket_rate,
      buyRate: data.buy_rate,
      sellRate: data.sell_rate,
    });

    return {
      from,
      to,
      midmarketRate: data.midmarket_rate,
      buyRate: data.buy_rate,
      sellRate: data.sell_rate,
    };
  },
});

// Action to fetch all common exchange rates from Bridge API
export const fetchAllRates = action({
  args: {
    pairs: v.optional(
      v.array(
        v.object({
          from: v.string(),
          to: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) {
      throw new Error("BRIDGE_API_KEY not configured");
    }

    const pairs = args.pairs || DEFAULT_PAIRS;
    const results: Array<{
      from: string;
      to: string;
      midmarketRate?: string;
      buyRate?: string;
      sellRate?: string;
      error?: string;
    }> = [];

    // Fetch all rates in parallel
    const fetchPromises = pairs.map(async ({ from, to }) => {
      try {
        const response = await fetch(
          `${apiUrl}/exchange_rates?from=${from}&to=${to}`,
          {
            headers: {
              Accept: "application/json",
              "Api-Key": apiKey,
            },
          }
        );

        if (!response.ok) {
          const error = await response.text();
          return { from, to, error: `${response.status}: ${error}` };
        }

        const data = await response.json();

        // Save to database
        await ctx.runMutation(internal.bridgeExchangeRates.upsertRate, {
          fromCurrency: from,
          toCurrency: to,
          midmarketRate: data.midmarket_rate,
          buyRate: data.buy_rate,
          sellRate: data.sell_rate,
        });

        return {
          from,
          to,
          midmarketRate: data.midmarket_rate,
          buyRate: data.buy_rate,
          sellRate: data.sell_rate,
        };
      } catch (error) {
        return {
          from,
          to,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const fetchResults = await Promise.all(fetchPromises);
    results.push(...fetchResults);

    return {
      fetchedAt: new Date().toISOString(),
      rates: results,
      successCount: results.filter((r) => !r.error).length,
      errorCount: results.filter((r) => r.error).length,
    };
  },
});

// Internal query to check if rates need refresh
export const checkRatesStatus = query({
  args: {},
  handler: async (ctx) => {
    const rates = await ctx.db.query("exchangeRates").collect();
    const now = Date.now();
    const staleRates = rates.filter((r) => now > r.expiresAt);

    return {
      totalCount: rates.length,
      staleCount: staleRates.length,
      needsRefresh: rates.length === 0 || staleRates.length > 0,
    };
  },
});
