import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Delete all wallets (admin cleanup)
export const deleteAll = mutation({
  args: {},
  handler: async (ctx) => {
    const wallets = await ctx.db.query("bridgeWallets").collect();
    for (const wallet of wallets) {
      await ctx.db.delete(wallet._id);
    }
    return { deleted: wallets.length };
  },
});

// Upsert a Bridge wallet (create or update)
export const upsert = mutation({
  args: {
    bridgeWalletId: v.string(),
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")),
    chain: v.union(
      v.literal("solana"),
      v.literal("base"),
      v.literal("ethereum")
    ),
    address: v.string(),
    tags: v.array(v.string()),
    balances: v.array(
      v.object({
        balance: v.string(),
        currency: v.string(),
        chain: v.string(),
        contractAddress: v.string(),
      })
    ),
    bridgeCreatedAt: v.string(),
    bridgeUpdatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bridgeWallets")
      .withIndex("by_bridge_wallet_id", (q) =>
        q.eq("bridgeWalletId", args.bridgeWalletId)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("bridgeWallets", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Link a Bridge wallet to a user
export const linkToUser = mutation({
  args: {
    bridgeWalletId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("bridgeWallets")
      .withIndex("by_bridge_wallet_id", (q) =>
        q.eq("bridgeWalletId", args.bridgeWalletId)
      )
      .first();

    if (!wallet) {
      throw new Error(`Bridge wallet not found: ${args.bridgeWalletId}`);
    }

    await ctx.db.patch(wallet._id, {
      userId: args.userId,
      updatedAt: Date.now(),
    });

    return wallet._id;
  },
});

// Get Bridge wallet by Bridge ID
export const getByBridgeId = query({
  args: { bridgeWalletId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bridgeWallets")
      .withIndex("by_bridge_wallet_id", (q) =>
        q.eq("bridgeWalletId", args.bridgeWalletId)
      )
      .first();
  },
});

// Get Bridge wallets for current user
export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("bridgeWallets")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Get wallets by Bridge customer ID
export const getByCustomerId = query({
  args: { bridgeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bridgeWallets")
      .withIndex("by_bridge_customer_id", (q) =>
        q.eq("bridgeCustomerId", args.bridgeCustomerId)
      )
      .collect();
  },
});

// Get wallet by blockchain address
export const getByAddress = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bridgeWallets")
      .withIndex("by_address", (q) => q.eq("address", args.address))
      .first();
  },
});

// List all Bridge wallets
export const list = query({
  args: {
    chain: v.optional(
      v.union(v.literal("solana"), v.literal("base"), v.literal("ethereum"))
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.chain) {
      const results = ctx.db
        .query("bridgeWallets")
        .withIndex("by_chain", (q) => q.eq("chain", args.chain!))
        .order("desc");

      if (args.limit) {
        return await results.take(args.limit);
      }
      return await results.collect();
    }

    const results = ctx.db.query("bridgeWallets").order("desc");

    if (args.limit) {
      return await results.take(args.limit);
    }

    return await results.collect();
  },
});

// Helper to transform Bridge API wallet response to our format
function transformBridgeWallet(data: any) {
  return {
    bridgeWalletId: data.id,
    bridgeCustomerId: data.customer_id,
    chain: data.chain as "solana" | "base" | "ethereum",
    address: data.address,
    tags: data.tags || [],
    balances: (data.balances || []).map((b: any) => ({
      balance: b.balance,
      currency: b.currency,
      chain: b.chain,
      contractAddress: b.contract_address,
    })),
    bridgeCreatedAt: data.created_at,
    bridgeUpdatedAt: data.updated_at,
  };
}

// Action: Create a wallet via Bridge API
export const create = action({
  args: {
    bridgeCustomerId: v.string(),
    chain: v.union(
      v.literal("solana"),
      v.literal("base"),
      v.literal("ethereum")
    ),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    // Generate idempotency key
    const idempotencyKey = `wallet-${args.bridgeCustomerId}-${args.chain}-${Date.now()}`;

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/wallets`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": bridgeApiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ chain: args.chain }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const transformed = transformBridgeWallet(data);

    // Save to database
    await ctx.runMutation(api.bridgeWallets.upsert, transformed);

    return transformed;
  },
});

// Action: Create a wallet for current user
export const createForCurrentUser = action({
  args: {
    chain: v.union(
      v.literal("solana"),
      v.literal("base"),
      v.literal("ethereum")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from database
    const user = await ctx.runQuery(api.users.getUser, {
      clerkId: identity.subject,
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.bridgeCustomerId) {
      throw new Error("User does not have a Bridge customer ID. Complete KYC first.");
    }

    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    // Generate idempotency key
    const idempotencyKey = `wallet-${user.bridgeCustomerId}-${args.chain}-${Date.now()}`;

    const response = await fetch(
      `${bridgeApiUrl}/customers/${user.bridgeCustomerId}/wallets`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": bridgeApiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ chain: args.chain }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const wallet = transformBridgeWallet(data);

    // Save to database and link to user
    await ctx.runMutation(api.bridgeWallets.upsert, wallet);
    await ctx.runMutation(api.bridgeWallets.linkToUser, {
      bridgeWalletId: wallet.bridgeWalletId,
      userId: user._id,
    });

    return wallet;
  },
});

// Action: Fetch a single wallet from Bridge API and sync to database
export const syncFromBridge = action({
  args: {
    bridgeCustomerId: v.string(),
    bridgeWalletId: v.string(),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/wallets/${args.bridgeWalletId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Api-Key": bridgeApiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const transformed = transformBridgeWallet(data);

    // Upsert to database
    await ctx.runMutation(api.bridgeWallets.upsert, transformed);

    return transformed;
  },
});

// Action: Fetch all wallets for a customer from Bridge and sync
export const syncCustomerWallets = action({
  args: { bridgeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/wallets?limit=100`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Api-Key": bridgeApiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    const wallets = result.data || [];

    // Sync each wallet
    for (const wallet of wallets) {
      const transformed = transformBridgeWallet(wallet);
      await ctx.runMutation(api.bridgeWallets.upsert, transformed);
    }

    return { synced: wallets.length };
  },
});

// Action: Fetch all wallets from Bridge and sync (admin/treasury)
export const syncAllFromBridge = action({
  args: {},
  handler: async (ctx) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    // Fetch all wallets (paginated)
    let allWallets: any[] = [];
    let cursor: string | undefined;

    do {
      const url = cursor
        ? `${bridgeApiUrl}/wallets?limit=100&after=${cursor}`
        : `${bridgeApiUrl}/wallets?limit=100`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Api-Key": bridgeApiKey,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
      }

      const result = await response.json();
      const wallets = result.data || [];
      allWallets = allWallets.concat(wallets);

      // Check for pagination cursor
      cursor = result.cursor;
    } while (cursor);

    // Sync each wallet
    for (const wallet of allWallets) {
      const transformed = transformBridgeWallet(wallet);
      await ctx.runMutation(api.bridgeWallets.upsert, transformed);
    }

    return { synced: allWallets.length };
  },
});

// Action: Fetch live balance for current user's wallet from Bridge API
export const fetchLiveBalanceForCurrentUser = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.runQuery(api.users.getUser, {
      clerkId: identity.subject,
    });

    if (!user || !user.bridgeCustomerId) {
      return null;
    }

    // Get user's wallet from DB to get the bridgeWalletId
    const wallets = await ctx.runQuery(api.bridgeWallets.getForCurrentUser, {});
    const primaryWallet = wallets.find((w: any) => w.chain === "solana" && w.userId);

    if (!primaryWallet) {
      return null;
    }

    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    // Fetch live wallet data from Bridge
    const response = await fetch(
      `${bridgeApiUrl}/customers/${user.bridgeCustomerId}/wallets/${primaryWallet.bridgeWalletId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Api-Key": bridgeApiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const transformed = transformBridgeWallet(data);

    // Update the database with fresh data
    await ctx.runMutation(api.bridgeWallets.upsert, transformed);

    return transformed;
  },
});

// Action: Get total balances across all wallets
export const getTotalBalances = action({
  args: {},
  handler: async (ctx) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(`${bridgeApiUrl}/wallets/total_balances`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Api-Key": bridgeApiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const balances = await response.json();

    // Transform to our format
    return (balances || []).map((b: any) => ({
      balance: b.balance,
      currency: b.currency,
      chain: b.chain,
      contractAddress: b.contract_address,
    }));
  },
});
