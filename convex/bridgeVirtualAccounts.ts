import { v } from "convex/values";
import {
  query,
  mutation,
  action,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================================================
// Internal Mutations (for webhooks and actions)
// ============================================================================

// Upsert a virtual account from Bridge API data
export const upsert = internalMutation({
  args: {
    bridgeVirtualAccountId: v.string(),
    bridgeCustomerId: v.string(),
    status: v.string(),
    developerFeePercent: v.optional(v.string()),
    sourceCurrency: v.string(),
    sourceDepositInstructions: v.object({
      currency: v.string(),
      paymentRails: v.array(v.string()),
      bankName: v.optional(v.string()),
      bankAddress: v.optional(v.string()),
      bankRoutingNumber: v.optional(v.string()),
      bankAccountNumber: v.optional(v.string()),
      bankBeneficiaryName: v.optional(v.string()),
      bankBeneficiaryAddress: v.optional(v.string()),
      iban: v.optional(v.string()),
      bic: v.optional(v.string()),
      accountHolderName: v.optional(v.string()),
      clabe: v.optional(v.string()),
      brCode: v.optional(v.string()),
      sortCode: v.optional(v.string()),
      accountNumber: v.optional(v.string()),
    }),
    destination: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      address: v.optional(v.string()),
      bridgeWalletId: v.optional(v.string()),
      blockchainMemo: v.optional(v.string()),
    }),
    bridgeCreatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("virtualAccounts")
      .withIndex("by_bridge_virtual_account_id", (q) =>
        q.eq("bridgeVirtualAccountId", args.bridgeVirtualAccountId)
      )
      .first();

    // Try to find associated user
    let userId;
    const customer = await ctx.db
      .query("bridgeCustomers")
      .withIndex("by_bridge_customer_id", (q) =>
        q.eq("bridgeCustomerId", args.bridgeCustomerId)
      )
      .first();
    if (customer?.userId) {
      userId = customer.userId;
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        userId,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("virtualAccounts", {
      ...args,
      userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Upsert a virtual account event from webhook
export const upsertEvent = internalMutation({
  args: {
    bridgeEventId: v.string(),
    bridgeVirtualAccountId: v.string(),
    bridgeCustomerId: v.string(),
    depositId: v.optional(v.string()),
    type: v.string(),
    amount: v.string(),
    currency: v.string(),
    developerFeeAmount: v.optional(v.string()),
    exchangeFeeAmount: v.optional(v.string()),
    subtotalAmount: v.optional(v.string()),
    gasFee: v.optional(v.string()),
    source: v.optional(v.any()),
    destinationTxHash: v.optional(v.string()),
    receipt: v.optional(v.any()),
    refund: v.optional(v.any()),
    accountUpdates: v.optional(v.any()),
    bridgeCreatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing event (idempotency)
    const existing = await ctx.db
      .query("virtualAccountEvents")
      .withIndex("by_bridge_event_id", (q) =>
        q.eq("bridgeEventId", args.bridgeEventId)
      )
      .first();

    if (existing) {
      // Update existing event with any new data
      await ctx.db.patch(existing._id, {
        destinationTxHash: args.destinationTxHash || existing.destinationTxHash,
        receipt: args.receipt || existing.receipt,
      });
      return existing._id;
    }

    // Find associated user
    let userId;
    const customer = await ctx.db
      .query("bridgeCustomers")
      .withIndex("by_bridge_customer_id", (q) =>
        q.eq("bridgeCustomerId", args.bridgeCustomerId)
      )
      .first();
    if (customer?.userId) {
      userId = customer.userId;
    }

    return await ctx.db.insert("virtualAccountEvents", {
      ...args,
      userId,
      createdAt: now,
    });
  },
});

// Update virtual account status
export const updateStatus = internalMutation({
  args: {
    bridgeVirtualAccountId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("virtualAccounts")
      .withIndex("by_bridge_virtual_account_id", (q) =>
        q.eq("bridgeVirtualAccountId", args.bridgeVirtualAccountId)
      )
      .first();

    if (account) {
      await ctx.db.patch(account._id, {
        status: args.status,
        updatedAt: Date.now(),
      });
    }
  },
});

// Link virtual account to user
export const linkToUser = mutation({
  args: {
    bridgeVirtualAccountId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("virtualAccounts")
      .withIndex("by_bridge_virtual_account_id", (q) =>
        q.eq("bridgeVirtualAccountId", args.bridgeVirtualAccountId)
      )
      .first();

    if (!account) {
      throw new Error(`Virtual account ${args.bridgeVirtualAccountId} not found`);
    }

    await ctx.db.patch(account._id, {
      userId: args.userId,
      updatedAt: Date.now(),
    });

    // Also update any events for this account
    const events = await ctx.db
      .query("virtualAccountEvents")
      .withIndex("by_bridge_virtual_account_id", (q) =>
        q.eq("bridgeVirtualAccountId", args.bridgeVirtualAccountId)
      )
      .collect();

    for (const event of events) {
      await ctx.db.patch(event._id, { userId: args.userId });
    }

    return account._id;
  },
});

// ============================================================================
// Queries
// ============================================================================

// Get virtual account by Bridge ID
export const getByBridgeId = query({
  args: { bridgeVirtualAccountId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("virtualAccounts")
      .withIndex("by_bridge_virtual_account_id", (q) =>
        q.eq("bridgeVirtualAccountId", args.bridgeVirtualAccountId)
      )
      .first();
  },
});

// Get virtual accounts for current user
export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("virtualAccounts")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Get virtual accounts by customer ID
export const getByCustomerId = query({
  args: { bridgeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("virtualAccounts")
      .withIndex("by_bridge_customer_id", (q) =>
        q.eq("bridgeCustomerId", args.bridgeCustomerId)
      )
      .collect();
  },
});

// Get virtual accounts by currency
export const getByCurrency = query({
  args: { sourceCurrency: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("virtualAccounts")
      .withIndex("by_source_currency", (q) =>
        q.eq("sourceCurrency", args.sourceCurrency.toLowerCase())
      )
      .collect();
  },
});

// Get events for a virtual account
export const getEvents = query({
  args: {
    bridgeVirtualAccountId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("virtualAccountEvents")
      .withIndex("by_bridge_virtual_account_id", (q) =>
        q.eq("bridgeVirtualAccountId", args.bridgeVirtualAccountId)
      )
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

// Get events for current user
export const getEventsForCurrentUser = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return [];

    const query = ctx.db
      .query("virtualAccountEvents")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc");

    if (args.limit) {
      return await query.take(args.limit);
    }
    return await query.collect();
  },
});

// Get events by deposit ID (links all events for same deposit)
export const getEventsByDepositId = query({
  args: { depositId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("virtualAccountEvents")
      .withIndex("by_deposit_id", (q) => q.eq("depositId", args.depositId))
      .order("asc")
      .collect();
  },
});

// List all virtual accounts
export const list = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      const results = ctx.db
        .query("virtualAccounts")
        .withIndex("by_status", (q) => q.eq("status", args.status!));

      if (args.limit) {
        return await results.take(args.limit);
      }
      return await results.collect();
    }

    const results = ctx.db.query("virtualAccounts");
    if (args.limit) {
      return await results.take(args.limit);
    }
    return await results.collect();
  },
});

// ============================================================================
// Actions (Bridge API calls)
// ============================================================================

// Helper to parse Bridge virtual account response
function parseVirtualAccountResponse(data: any, customerId: string) {
  const instructions = data.source_deposit_instructions || {};

  return {
    bridgeVirtualAccountId: data.id,
    bridgeCustomerId: customerId,
    status: data.status,
    developerFeePercent: data.developer_fee_percent,
    sourceCurrency: instructions.currency || "usd",
    sourceDepositInstructions: {
      currency: instructions.currency || "usd",
      paymentRails: instructions.payment_rails || [],
      bankName: instructions.bank_name,
      bankAddress: instructions.bank_address,
      bankRoutingNumber: instructions.bank_routing_number,
      bankAccountNumber: instructions.bank_account_number,
      bankBeneficiaryName: instructions.bank_beneficiary_name,
      bankBeneficiaryAddress: instructions.bank_beneficiary_address,
      iban: instructions.iban,
      bic: instructions.bic,
      accountHolderName: instructions.account_holder_name,
      clabe: instructions.clabe,
      brCode: instructions.br_code,
      sortCode: instructions.sort_code,
      accountNumber: instructions.account_number,
    },
    destination: {
      paymentRail: data.destination?.payment_rail || "",
      currency: data.destination?.currency || "",
      address: data.destination?.address,
      bridgeWalletId: data.destination?.bridge_wallet_id,
      blockchainMemo: data.destination?.blockchain_memo,
    },
    bridgeCreatedAt: data.created_at,
  };
}

// Create a USD Virtual Account (ACH/Wire)
export const createUSD = action({
  args: {
    customerId: v.string(),
    destination: v.object({
      paymentRail: v.string(), // solana, ethereum, base, etc.
      currency: v.string(), // usdc, usdt, usdb
      address: v.optional(v.string()),
      bridgeWalletId: v.optional(v.string()),
      blockchainMemo: v.optional(v.string()),
    }),
    developerFeePercent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) throw new Error("BRIDGE_API_KEY not configured");

    const idempotencyKey = `va-usd-${args.customerId}-${Date.now()}`;

    const requestBody: any = {
      source: { currency: "usd" },
      destination: {
        payment_rail: args.destination.paymentRail,
        currency: args.destination.currency,
      },
    };

    if (args.destination.address) {
      requestBody.destination.address = args.destination.address;
    }
    if (args.destination.bridgeWalletId) {
      requestBody.destination.bridge_wallet_id = args.destination.bridgeWalletId;
    }
    if (args.destination.blockchainMemo) {
      requestBody.destination.blockchain_memo = args.destination.blockchainMemo;
    }
    if (args.developerFeePercent) {
      requestBody.developer_fee_percent = args.developerFeePercent;
    }

    const response = await fetch(
      `${apiUrl}/customers/${args.customerId}/virtual_accounts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create USD virtual account: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const parsed = parseVirtualAccountResponse(data, args.customerId);

    await ctx.runMutation(internal.bridgeVirtualAccounts.upsert, parsed);

    return data;
  },
});

// Create a EUR Virtual Account (SEPA)
export const createEUR = action({
  args: {
    customerId: v.string(),
    destination: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      address: v.optional(v.string()),
      bridgeWalletId: v.optional(v.string()),
      blockchainMemo: v.optional(v.string()),
    }),
    developerFeePercent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) throw new Error("BRIDGE_API_KEY not configured");

    const idempotencyKey = `va-eur-${args.customerId}-${Date.now()}`;

    const requestBody: any = {
      source: { currency: "eur" },
      destination: {
        payment_rail: args.destination.paymentRail,
        currency: args.destination.currency,
      },
    };

    if (args.destination.address) {
      requestBody.destination.address = args.destination.address;
    }
    if (args.destination.bridgeWalletId) {
      requestBody.destination.bridge_wallet_id = args.destination.bridgeWalletId;
    }
    if (args.destination.blockchainMemo) {
      requestBody.destination.blockchain_memo = args.destination.blockchainMemo;
    }
    if (args.developerFeePercent) {
      requestBody.developer_fee_percent = args.developerFeePercent;
    }

    const response = await fetch(
      `${apiUrl}/customers/${args.customerId}/virtual_accounts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create EUR virtual account: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const parsed = parseVirtualAccountResponse(data, args.customerId);

    await ctx.runMutation(internal.bridgeVirtualAccounts.upsert, parsed);

    return data;
  },
});

// Create a GBP Virtual Account (Faster Payments) - Beta
export const createGBP = action({
  args: {
    customerId: v.string(),
    destination: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      address: v.optional(v.string()),
      bridgeWalletId: v.optional(v.string()),
      blockchainMemo: v.optional(v.string()),
    }),
    developerFeePercent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) throw new Error("BRIDGE_API_KEY not configured");

    const idempotencyKey = `va-gbp-${args.customerId}-${Date.now()}`;

    const requestBody: any = {
      source: { currency: "gbp" },
      destination: {
        payment_rail: args.destination.paymentRail,
        currency: args.destination.currency,
      },
    };

    if (args.destination.address) {
      requestBody.destination.address = args.destination.address;
    }
    if (args.destination.bridgeWalletId) {
      requestBody.destination.bridge_wallet_id = args.destination.bridgeWalletId;
    }
    if (args.destination.blockchainMemo) {
      requestBody.destination.blockchain_memo = args.destination.blockchainMemo;
    }
    if (args.developerFeePercent) {
      requestBody.developer_fee_percent = args.developerFeePercent;
    }

    const response = await fetch(
      `${apiUrl}/customers/${args.customerId}/virtual_accounts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create GBP virtual account: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const parsed = parseVirtualAccountResponse(data, args.customerId);

    await ctx.runMutation(internal.bridgeVirtualAccounts.upsert, parsed);

    return data;
  },
});

// Create a MXN Virtual Account (SPEI)
export const createMXN = action({
  args: {
    customerId: v.string(),
    destination: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      address: v.optional(v.string()),
      bridgeWalletId: v.optional(v.string()),
      blockchainMemo: v.optional(v.string()),
    }),
    developerFeePercent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) throw new Error("BRIDGE_API_KEY not configured");

    const idempotencyKey = `va-mxn-${args.customerId}-${Date.now()}`;

    const requestBody: any = {
      source: { currency: "mxn" },
      destination: {
        payment_rail: args.destination.paymentRail,
        currency: args.destination.currency,
      },
    };

    if (args.destination.address) {
      requestBody.destination.address = args.destination.address;
    }
    if (args.destination.bridgeWalletId) {
      requestBody.destination.bridge_wallet_id = args.destination.bridgeWalletId;
    }
    if (args.destination.blockchainMemo) {
      requestBody.destination.blockchain_memo = args.destination.blockchainMemo;
    }
    if (args.developerFeePercent) {
      requestBody.developer_fee_percent = args.developerFeePercent;
    }

    const response = await fetch(
      `${apiUrl}/customers/${args.customerId}/virtual_accounts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create MXN virtual account: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const parsed = parseVirtualAccountResponse(data, args.customerId);

    await ctx.runMutation(internal.bridgeVirtualAccounts.upsert, parsed);

    return data;
  },
});

// Create a BRL Virtual Account (Pix)
export const createBRL = action({
  args: {
    customerId: v.string(),
    destination: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      address: v.optional(v.string()),
      bridgeWalletId: v.optional(v.string()),
      blockchainMemo: v.optional(v.string()),
    }),
    developerFeePercent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) throw new Error("BRIDGE_API_KEY not configured");

    const idempotencyKey = `va-brl-${args.customerId}-${Date.now()}`;

    const requestBody: any = {
      source: { currency: "brl" },
      destination: {
        payment_rail: args.destination.paymentRail,
        currency: args.destination.currency,
      },
    };

    if (args.destination.address) {
      requestBody.destination.address = args.destination.address;
    }
    if (args.destination.bridgeWalletId) {
      requestBody.destination.bridge_wallet_id = args.destination.bridgeWalletId;
    }
    if (args.destination.blockchainMemo) {
      requestBody.destination.blockchain_memo = args.destination.blockchainMemo;
    }
    if (args.developerFeePercent) {
      requestBody.developer_fee_percent = args.developerFeePercent;
    }

    const response = await fetch(
      `${apiUrl}/customers/${args.customerId}/virtual_accounts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create BRL virtual account: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const parsed = parseVirtualAccountResponse(data, args.customerId);

    await ctx.runMutation(internal.bridgeVirtualAccounts.upsert, parsed);

    return data;
  },
});

// Generic create virtual account (supports all currencies)
export const create = action({
  args: {
    customerId: v.string(),
    sourceCurrency: v.string(), // usd, eur, gbp, mxn, brl
    destination: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      address: v.optional(v.string()),
      bridgeWalletId: v.optional(v.string()),
      blockchainMemo: v.optional(v.string()),
    }),
    developerFeePercent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) throw new Error("BRIDGE_API_KEY not configured");

    const idempotencyKey = `va-${args.sourceCurrency}-${args.customerId}-${Date.now()}`;

    const requestBody: any = {
      source: { currency: args.sourceCurrency.toLowerCase() },
      destination: {
        payment_rail: args.destination.paymentRail,
        currency: args.destination.currency,
      },
    };

    if (args.destination.address) {
      requestBody.destination.address = args.destination.address;
    }
    if (args.destination.bridgeWalletId) {
      requestBody.destination.bridge_wallet_id = args.destination.bridgeWalletId;
    }
    if (args.destination.blockchainMemo) {
      requestBody.destination.blockchain_memo = args.destination.blockchainMemo;
    }
    if (args.developerFeePercent) {
      requestBody.developer_fee_percent = args.developerFeePercent;
    }

    const response = await fetch(
      `${apiUrl}/customers/${args.customerId}/virtual_accounts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": apiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create virtual account: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const parsed = parseVirtualAccountResponse(data, args.customerId);

    await ctx.runMutation(internal.bridgeVirtualAccounts.upsert, parsed);

    return data;
  },
});

// Update virtual account destination
export const update = action({
  args: {
    customerId: v.string(),
    virtualAccountId: v.string(),
    destination: v.optional(
      v.object({
        paymentRail: v.string(),
        currency: v.string(),
        address: v.optional(v.string()),
        bridgeWalletId: v.optional(v.string()),
        blockchainMemo: v.optional(v.string()),
      })
    ),
    developerFeePercent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) throw new Error("BRIDGE_API_KEY not configured");

    const requestBody: any = {};

    if (args.destination) {
      requestBody.destination = {
        payment_rail: args.destination.paymentRail,
        currency: args.destination.currency,
      };
      if (args.destination.address) {
        requestBody.destination.address = args.destination.address;
      }
      if (args.destination.bridgeWalletId) {
        requestBody.destination.bridge_wallet_id = args.destination.bridgeWalletId;
      }
      if (args.destination.blockchainMemo) {
        requestBody.destination.blockchain_memo = args.destination.blockchainMemo;
      }
    }

    if (args.developerFeePercent !== undefined) {
      requestBody.developer_fee_percent = args.developerFeePercent;
    }

    const response = await fetch(
      `${apiUrl}/customers/${args.customerId}/virtual_accounts/${args.virtualAccountId}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": apiKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update virtual account: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const parsed = parseVirtualAccountResponse(data, args.customerId);

    await ctx.runMutation(internal.bridgeVirtualAccounts.upsert, parsed);

    return data;
  },
});

// Deactivate virtual account
export const deactivate = action({
  args: {
    customerId: v.string(),
    virtualAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) throw new Error("BRIDGE_API_KEY not configured");

    const response = await fetch(
      `${apiUrl}/customers/${args.customerId}/virtual_accounts/${args.virtualAccountId}/deactivate`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Api-Key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to deactivate virtual account: ${response.status} - ${error}`);
    }

    await ctx.runMutation(internal.bridgeVirtualAccounts.updateStatus, {
      bridgeVirtualAccountId: args.virtualAccountId,
      status: "deactivated",
    });

    return { success: true };
  },
});

// Reactivate virtual account
export const reactivate = action({
  args: {
    customerId: v.string(),
    virtualAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) throw new Error("BRIDGE_API_KEY not configured");

    const response = await fetch(
      `${apiUrl}/customers/${args.customerId}/virtual_accounts/${args.virtualAccountId}/reactivate`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Api-Key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to reactivate virtual account: ${response.status} - ${error}`);
    }

    await ctx.runMutation(internal.bridgeVirtualAccounts.updateStatus, {
      bridgeVirtualAccountId: args.virtualAccountId,
      status: "activated",
    });

    return { success: true };
  },
});

// Sync virtual accounts from Bridge API
export const syncFromBridge = action({
  args: { customerId: v.string() },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) throw new Error("BRIDGE_API_KEY not configured");

    const response = await fetch(
      `${apiUrl}/customers/${args.customerId}/virtual_accounts`,
      {
        headers: {
          Accept: "application/json",
          "Api-Key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch virtual accounts: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const accounts = data.data || [];

    for (const account of accounts) {
      const parsed = parseVirtualAccountResponse(account, args.customerId);
      await ctx.runMutation(internal.bridgeVirtualAccounts.upsert, parsed);
    }

    return {
      synced: accounts.length,
      accounts: accounts.map((a: any) => a.id),
    };
  },
});

// Fetch virtual account history/events from Bridge API
export const fetchHistory = action({
  args: {
    customerId: v.string(),
    virtualAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BRIDGE_API_KEY;
    const apiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!apiKey) throw new Error("BRIDGE_API_KEY not configured");

    const response = await fetch(
      `${apiUrl}/customers/${args.customerId}/virtual_accounts/${args.virtualAccountId}/history`,
      {
        headers: {
          Accept: "application/json",
          "Api-Key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch virtual account history: ${response.status} - ${error}`);
    }

    const events = await response.json();

    // Store each event
    for (const event of events) {
      await ctx.runMutation(internal.bridgeVirtualAccounts.upsertEvent, {
        bridgeEventId: event.id,
        bridgeVirtualAccountId: args.virtualAccountId,
        bridgeCustomerId: args.customerId,
        depositId: event.deposit_id,
        type: event.type,
        amount: event.amount || "0",
        currency: event.currency || "usd",
        developerFeeAmount: event.developer_fee_amount,
        exchangeFeeAmount: event.exchange_fee_amount,
        subtotalAmount: event.subtotal_amount,
        gasFee: event.gas_fee,
        source: event.source,
        destinationTxHash: event.destination_tx_hash,
        receipt: event.receipt,
        refund: event.refund,
        accountUpdates: event.account_updates,
        bridgeCreatedAt: event.created_at,
      });
    }

    return {
      synced: events.length,
      events: events.map((e: any) => ({ id: e.id, type: e.type })),
    };
  },
});
