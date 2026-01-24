import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Create a KYC link record in our database
export const create = mutation({
  args: {
    bridgeKycLinkId: v.string(),
    userId: v.id("users"),
    email: v.string(),
    fullName: v.string(),
    type: v.union(v.literal("individual"), v.literal("business")),
    kycLink: v.optional(v.string()),
    tosLink: v.optional(v.string()),
    kycStatus: v.string(),
    tosStatus: v.string(),
    redirectUri: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("kycLinks", {
      ...args,
      bridgeCustomerId: undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update KYC link status (from webhook or polling)
export const updateStatus = mutation({
  args: {
    bridgeKycLinkId: v.string(),
    kycStatus: v.string(),
    tosStatus: v.string(),
    bridgeCustomerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const kycLink = await ctx.db
      .query("kycLinks")
      .withIndex("by_bridge_kyc_link_id", (q) =>
        q.eq("bridgeKycLinkId", args.bridgeKycLinkId)
      )
      .first();

    if (!kycLink) {
      throw new Error(`KYC link not found: ${args.bridgeKycLinkId}`);
    }

    await ctx.db.patch(kycLink._id, {
      kycStatus: args.kycStatus,
      tosStatus: args.tosStatus,
      bridgeCustomerId: args.bridgeCustomerId,
      updatedAt: Date.now(),
    });

    return kycLink._id;
  },
});

// Get KYC link by Bridge ID
export const getByBridgeId = query({
  args: { bridgeKycLinkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kycLinks")
      .withIndex("by_bridge_kyc_link_id", (q) =>
        q.eq("bridgeKycLinkId", args.bridgeKycLinkId)
      )
      .first();
  },
});

// Get KYC link for current user
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

    if (!user) {
      return null;
    }

    // Get the most recent KYC link for this user
    return await ctx.db
      .query("kycLinks")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
  },
});

// Get all KYC links for a user
export const listByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kycLinks")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Action: Create KYC link via Bridge API
export const createKycLink = action({
  args: {
    fullName: v.string(),
    email: v.string(),
    type: v.union(v.literal("individual"), v.literal("business")),
    redirectUri: v.optional(v.string()),
    endorsements: v.optional(v.array(v.string())),
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

    // Check if user already has a pending/approved KYC link
    const existingKycLink = await ctx.runQuery(api.kycLinks.getForCurrentUser);
    if (
      existingKycLink &&
      (existingKycLink.kycStatus === "approved" ||
        existingKycLink.kycStatus === "under_review")
    ) {
      throw new Error(
        `KYC already ${existingKycLink.kycStatus}. Cannot create new link.`
      );
    }

    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    // Generate idempotency key
    const idempotencyKey = `kyc-link-${args.email}-${Date.now()}`;

    // Create KYC link via Bridge API
    const response = await fetch(`${bridgeApiUrl}/kyc_links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": bridgeApiKey,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        full_name: args.fullName,
        email: args.email,
        type: args.type,
        redirect_uri: args.redirectUri,
        endorsements: args.endorsements,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    // Save to our database
    await ctx.runMutation(api.kycLinks.create, {
      bridgeKycLinkId: data.id,
      userId: user._id,
      email: data.email,
      fullName: args.fullName,
      type: args.type,
      kycLink: data.kyc_link,
      tosLink: data.tos_link,
      kycStatus: data.kyc_status,
      tosStatus: data.tos_status,
      redirectUri: args.redirectUri,
    });

    return {
      id: data.id,
      kycLink: data.kyc_link,
      tosLink: data.tos_link,
      kycStatus: data.kyc_status,
      tosStatus: data.tos_status,
    };
  },
});

// Action: Check KYC link status from Bridge API
export const checkStatus = action({
  args: { bridgeKycLinkId: v.string() },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(
      `${bridgeApiUrl}/kyc_links/${args.bridgeKycLinkId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": bridgeApiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    // Update our database
    await ctx.runMutation(api.kycLinks.updateStatus, {
      bridgeKycLinkId: args.bridgeKycLinkId,
      kycStatus: data.kyc_status,
      tosStatus: data.tos_status,
      bridgeCustomerId: data.customer_id,
    });

    return {
      id: data.id,
      kycStatus: data.kyc_status,
      tosStatus: data.tos_status,
      customerId: data.customer_id,
      email: data.email,
    };
  },
});
