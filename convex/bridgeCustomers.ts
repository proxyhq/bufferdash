import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Upsert a Bridge customer (create or update)
export const upsert = mutation({
  args: {
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    status: v.string(),
    type: v.union(v.literal("individual"), v.literal("business")),
    hasAcceptedTermsOfService: v.boolean(),
    tosLink: v.optional(v.string()),
    endorsements: v.array(
      v.object({
        name: v.string(),
        status: v.string(),
      })
    ),
    capabilities: v.object({
      payinCrypto: v.string(),
      payoutCrypto: v.string(),
      payinFiat: v.string(),
      payoutFiat: v.string(),
    }),
    requirementsDue: v.array(v.string()),
    rejectionReasons: v.array(
      v.object({
        developerReason: v.optional(v.string()),
        reason: v.string(),
        createdAt: v.optional(v.string()),
      })
    ),
    bridgeCreatedAt: v.string(),
    bridgeUpdatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bridgeCustomers")
      .withIndex("by_bridge_customer_id", (q) =>
        q.eq("bridgeCustomerId", args.bridgeCustomerId)
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

    return await ctx.db.insert("bridgeCustomers", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Link a Bridge customer to a user
export const linkToUser = mutation({
  args: {
    bridgeCustomerId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db
      .query("bridgeCustomers")
      .withIndex("by_bridge_customer_id", (q) =>
        q.eq("bridgeCustomerId", args.bridgeCustomerId)
      )
      .first();

    if (!customer) {
      throw new Error(`Bridge customer not found: ${args.bridgeCustomerId}`);
    }

    // Update the bridge customer
    await ctx.db.patch(customer._id, {
      userId: args.userId,
      updatedAt: Date.now(),
    });

    // Also update the user with the bridge customer ID
    await ctx.db.patch(args.userId, {
      bridgeCustomerId: args.bridgeCustomerId,
      updatedAt: Date.now(),
    });

    return customer._id;
  },
});

// Get Bridge customer by Bridge ID
export const getByBridgeId = query({
  args: { bridgeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bridgeCustomers")
      .withIndex("by_bridge_customer_id", (q) =>
        q.eq("bridgeCustomerId", args.bridgeCustomerId)
      )
      .first();
  },
});

// Get Bridge customer for current user
export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || !user.bridgeCustomerId) {
      return null;
    }

    return await ctx.db
      .query("bridgeCustomers")
      .withIndex("by_bridge_customer_id", (q) =>
        q.eq("bridgeCustomerId", user.bridgeCustomerId!)
      )
      .first();
  },
});

// Get Bridge customer by email
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bridgeCustomers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// List all Bridge customers
export const list = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      const results = ctx.db
        .query("bridgeCustomers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc");

      if (args.limit) {
        return await results.take(args.limit);
      }
      return await results.collect();
    }

    const results = ctx.db.query("bridgeCustomers").order("desc");

    if (args.limit) {
      return await results.take(args.limit);
    }

    return await results.collect();
  },
});

// Helper to transform Bridge API response to our format
function transformBridgeCustomer(data: any) {
  return {
    bridgeCustomerId: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    status: data.status,
    type: data.type as "individual" | "business",
    hasAcceptedTermsOfService: data.has_accepted_terms_of_service,
    tosLink: data.tos_link,
    endorsements: (data.endorsements || []).map((e: any) => ({
      name: e.name,
      status: e.status,
    })),
    capabilities: {
      payinCrypto: data.capabilities?.payin_crypto || "pending",
      payoutCrypto: data.capabilities?.payout_crypto || "pending",
      payinFiat: data.capabilities?.payin_fiat || "pending",
      payoutFiat: data.capabilities?.payout_fiat || "pending",
    },
    requirementsDue: data.requirements_due || [],
    rejectionReasons: (data.rejection_reasons || []).map((r: any) => ({
      developerReason: r.developer_reason,
      reason: r.reason,
      createdAt: r.created_at,
    })),
    bridgeCreatedAt: data.created_at,
    bridgeUpdatedAt: data.updated_at,
  };
}

// Action: Fetch customer from Bridge API and sync to database
export const syncFromBridge = action({
  args: { bridgeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}`,
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
    const transformed = transformBridgeCustomer(data);

    // Upsert to database
    await ctx.runMutation(api.bridgeCustomers.upsert, transformed);

    return transformed;
  },
});

// Action: Fetch all customers from Bridge and sync
export const syncAllFromBridge = action({
  args: {},
  handler: async (ctx) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(`${bridgeApiUrl}/customers`, {
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
    const customers = result.data || [];

    // Sync each customer
    for (const customer of customers) {
      const transformed = transformBridgeCustomer(customer);
      await ctx.runMutation(api.bridgeCustomers.upsert, transformed);
    }

    return { synced: customers.length };
  },
});

// Action: Get customer KYC link for additional requirements
export const getKycLink = action({
  args: {
    bridgeCustomerId: v.string(),
    endorsement: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    let url = `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/kyc_link`;
    if (args.endorsement) {
      url += `?endorsement=${args.endorsement}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": bridgeApiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return { url: data.url };
  },
});

// Action: Get ToS acceptance link for existing customer
export const getTosLink = action({
  args: { bridgeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/tos_acceptance_link`,
      {
        method: "GET",
        headers: {
          "Api-Key": bridgeApiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return { url: data.url };
  },
});
