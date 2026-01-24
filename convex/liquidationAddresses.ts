import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// ============= MUTATIONS =============

// Upsert a liquidation address
export const upsert = mutation({
  args: {
    bridgeLiquidationAddressId: v.string(),
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")),
    chain: v.string(),
    address: v.string(),
    currency: v.string(),
    state: v.string(),
    destinationPaymentRail: v.string(),
    destinationCurrency: v.string(),
    destinationAddress: v.optional(v.string()),
    bridgeWalletId: v.optional(v.string()),
    externalAccountId: v.optional(v.string()),
    destinationWireMessage: v.optional(v.string()),
    blockchainMemo: v.optional(v.string()),
    customDeveloperFeePercent: v.optional(v.string()),
    bridgeCreatedAt: v.string(),
    bridgeUpdatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("liquidationAddresses")
      .withIndex("by_bridge_liquidation_address_id", (q) =>
        q.eq("bridgeLiquidationAddressId", args.bridgeLiquidationAddressId)
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

    return await ctx.db.insert("liquidationAddresses", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Upsert a drain record
export const upsertDrain = mutation({
  args: {
    bridgeDrainId: v.string(),
    bridgeLiquidationAddressId: v.string(),
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")),
    amount: v.string(),
    currency: v.string(),
    state: v.string(),
    sourcePaymentRail: v.optional(v.string()),
    fromAddress: v.optional(v.string()),
    destination: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      toAddress: v.optional(v.string()),
      externalAccountId: v.optional(v.string()),
      imad: v.optional(v.string()),
      traceNumber: v.optional(v.string()),
    }),
    destinationTxHash: v.optional(v.string()),
    depositTxHash: v.optional(v.string()),
    depositTxTimestamp: v.optional(v.string()),
    receipt: v.optional(
      v.object({
        initialAmount: v.string(),
        developerFee: v.string(),
        subtotalAmount: v.string(),
        exchangeRate: v.string(),
        convertedAmount: v.string(),
        destinationCurrency: v.string(),
        outgoingAmount: v.string(),
        url: v.optional(v.string()),
      })
    ),
    bridgeCreatedAt: v.string(),
    bridgeUpdatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("liquidationDrains")
      .withIndex("by_bridge_drain_id", (q) =>
        q.eq("bridgeDrainId", args.bridgeDrainId)
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

    return await ctx.db.insert("liquidationDrains", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Link a liquidation address to a user
export const linkToUser = mutation({
  args: {
    bridgeLiquidationAddressId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const address = await ctx.db
      .query("liquidationAddresses")
      .withIndex("by_bridge_liquidation_address_id", (q) =>
        q.eq("bridgeLiquidationAddressId", args.bridgeLiquidationAddressId)
      )
      .first();

    if (!address) {
      throw new Error(
        `Liquidation address not found: ${args.bridgeLiquidationAddressId}`
      );
    }

    await ctx.db.patch(address._id, {
      userId: args.userId,
      updatedAt: Date.now(),
    });

    return address._id;
  },
});

// Delete all (admin cleanup)
export const deleteAll = mutation({
  args: {},
  handler: async (ctx) => {
    const addresses = await ctx.db.query("liquidationAddresses").collect();
    const drains = await ctx.db.query("liquidationDrains").collect();

    for (const addr of addresses) {
      await ctx.db.delete(addr._id);
    }
    for (const drain of drains) {
      await ctx.db.delete(drain._id);
    }

    return { deletedAddresses: addresses.length, deletedDrains: drains.length };
  },
});

// ============= QUERIES =============

// Get liquidation address by Bridge ID
export const getByBridgeId = query({
  args: { bridgeLiquidationAddressId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liquidationAddresses")
      .withIndex("by_bridge_liquidation_address_id", (q) =>
        q.eq("bridgeLiquidationAddressId", args.bridgeLiquidationAddressId)
      )
      .first();
  },
});

// Get liquidation addresses for current user
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
      .query("liquidationAddresses")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Get liquidation addresses by customer ID
export const getByCustomerId = query({
  args: { bridgeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liquidationAddresses")
      .withIndex("by_bridge_customer_id", (q) =>
        q.eq("bridgeCustomerId", args.bridgeCustomerId)
      )
      .collect();
  },
});

// Get liquidation address by blockchain address
export const getByAddress = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liquidationAddresses")
      .withIndex("by_address", (q) => q.eq("address", args.address))
      .first();
  },
});

// List all liquidation addresses
export const list = query({
  args: {
    chain: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.chain) {
      const results = ctx.db
        .query("liquidationAddresses")
        .withIndex("by_chain", (q) => q.eq("chain", args.chain!))
        .order("desc");

      if (args.limit) {
        return await results.take(args.limit);
      }
      return await results.collect();
    }

    const results = ctx.db.query("liquidationAddresses").order("desc");

    if (args.limit) {
      return await results.take(args.limit);
    }

    return await results.collect();
  },
});

// Get drains for a liquidation address
export const getDrains = query({
  args: { bridgeLiquidationAddressId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("liquidationDrains")
      .withIndex("by_bridge_liquidation_address_id", (q) =>
        q.eq("bridgeLiquidationAddressId", args.bridgeLiquidationAddressId)
      )
      .order("desc")
      .collect();
  },
});

// Get drains for current user
export const getDrainsForCurrentUser = query({
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
      .query("liquidationDrains")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// List all drains
export const listDrains = query({
  args: {
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.state) {
      const results = ctx.db
        .query("liquidationDrains")
        .withIndex("by_state", (q) => q.eq("state", args.state!))
        .order("desc");

      if (args.limit) {
        return await results.take(args.limit);
      }
      return await results.collect();
    }

    const results = ctx.db.query("liquidationDrains").order("desc");

    if (args.limit) {
      return await results.take(args.limit);
    }

    return await results.collect();
  },
});

// ============= HELPERS =============

function transformLiquidationAddress(data: any) {
  return {
    bridgeLiquidationAddressId: data.id,
    bridgeCustomerId: data.customer_id,
    chain: data.chain,
    address: data.address,
    currency: data.currency,
    state: data.state || "active",
    destinationPaymentRail: data.destination_payment_rail,
    destinationCurrency: data.destination_currency,
    destinationAddress: data.destination_address,
    bridgeWalletId: data.bridge_wallet_id,
    externalAccountId: data.external_account_id,
    destinationWireMessage: data.destination_wire_message,
    blockchainMemo: data.blockchain_memo,
    customDeveloperFeePercent: data.custom_developer_fee_percent,
    bridgeCreatedAt: data.created_at,
    bridgeUpdatedAt: data.updated_at,
  };
}

function transformDrain(data: any) {
  return {
    bridgeDrainId: data.id,
    bridgeLiquidationAddressId: data.liquidation_address_id,
    bridgeCustomerId: data.customer_id,
    amount: data.amount,
    currency: data.currency,
    state: data.state,
    sourcePaymentRail: data.source_payment_rail,
    fromAddress: data.from_address,
    destination: {
      paymentRail: data.destination?.payment_rail || "",
      currency: data.destination?.currency || "",
      toAddress: data.destination?.to_address,
      externalAccountId: data.destination?.external_account_id,
      imad: data.destination?.imad,
      traceNumber: data.destination?.trace_number,
    },
    destinationTxHash: data.destination_tx_hash,
    depositTxHash: data.deposit_tx_hash,
    depositTxTimestamp: data.deposit_tx_timestamp,
    receipt: data.receipt
      ? {
          initialAmount: data.receipt.initial_amount,
          developerFee: data.receipt.developer_fee,
          subtotalAmount: data.receipt.subtotal_amount,
          exchangeRate: data.receipt.exchange_rate,
          convertedAmount: data.receipt.converted_amount,
          destinationCurrency: data.receipt.destination_currency,
          outgoingAmount: data.receipt.outgoing_amount,
          url: data.receipt.url,
        }
      : undefined,
    bridgeCreatedAt: data.created_at,
    bridgeUpdatedAt: data.updated_at,
  };
}

// ============= ACTIONS =============

// Create a liquidation address via Bridge API
export const create = action({
  args: {
    bridgeCustomerId: v.string(),
    chain: v.string(),
    currency: v.string(),
    destinationPaymentRail: v.string(),
    destinationCurrency: v.string(),
    destinationAddress: v.optional(v.string()),
    bridgeWalletId: v.optional(v.string()),
    externalAccountId: v.optional(v.string()),
    destinationWireMessage: v.optional(v.string()),
    customDeveloperFeePercent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const idempotencyKey = `liq-addr-${args.bridgeCustomerId}-${args.chain}-${args.currency}-${Date.now()}`;

    const body: any = {
      chain: args.chain,
      currency: args.currency,
      destination_payment_rail: args.destinationPaymentRail,
      destination_currency: args.destinationCurrency,
    };

    if (args.destinationAddress)
      body.destination_address = args.destinationAddress;
    if (args.bridgeWalletId) body.bridge_wallet_id = args.bridgeWalletId;
    if (args.externalAccountId)
      body.external_account_id = args.externalAccountId;
    if (args.destinationWireMessage)
      body.destination_wire_message = args.destinationWireMessage;
    if (args.customDeveloperFeePercent)
      body.custom_developer_fee_percent = args.customDeveloperFeePercent;

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/liquidation_addresses`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": bridgeApiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const transformed = transformLiquidationAddress(data);

    await ctx.runMutation(api.liquidationAddresses.upsert, transformed);

    return transformed;
  },
});

// Sync liquidation addresses for a customer from Bridge
export const syncCustomerAddresses = action({
  args: { bridgeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/liquidation_addresses?limit=100`,
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
    const addresses = result.data || [];

    for (const addr of addresses) {
      const transformed = transformLiquidationAddress(addr);
      await ctx.runMutation(api.liquidationAddresses.upsert, transformed);
    }

    return { synced: addresses.length };
  },
});

// Sync drains for a liquidation address from Bridge
export const syncDrains = action({
  args: {
    bridgeCustomerId: v.string(),
    bridgeLiquidationAddressId: v.string(),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/liquidation_addresses/${args.bridgeLiquidationAddressId}/drains?limit=100`,
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
    const drains = result.data || [];

    for (const drain of drains) {
      const transformed = transformDrain(drain);
      await ctx.runMutation(api.liquidationAddresses.upsertDrain, transformed);
    }

    return { synced: drains.length };
  },
});

// Sync all drains across all liquidation addresses
export const syncAllDrains = action({
  args: {},
  handler: async (ctx) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    let allDrains: any[] = [];
    let cursor: string | undefined;

    do {
      const url = cursor
        ? `${bridgeApiUrl}/liquidation_addresses/drains?limit=100&starting_after=${cursor}`
        : `${bridgeApiUrl}/liquidation_addresses/drains?limit=100`;

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
      const drains = result.data || [];
      allDrains = allDrains.concat(drains);

      // Get last drain ID for pagination
      cursor =
        drains.length === 100 ? drains[drains.length - 1]?.id : undefined;
    } while (cursor);

    for (const drain of allDrains) {
      const transformed = transformDrain(drain);
      await ctx.runMutation(api.liquidationAddresses.upsertDrain, transformed);
    }

    return { synced: allDrains.length };
  },
});
