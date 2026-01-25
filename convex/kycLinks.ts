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

// Action: Initialize onboarding - creates KYC link and updates user status
export const initializeOnboarding = action({
  args: {},
  handler: async (ctx): Promise<{
    id: string;
    kycLink?: string;
    tosLink?: string;
    kycStatus: string;
    tosStatus: string;
  }> => {
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
    if (existingKycLink) {
      if (existingKycLink.kycStatus === "approved") {
        throw new Error("KYC already approved");
      }
      if (existingKycLink.kycStatus === "under_review") {
        throw new Error("KYC already under review");
      }
      // Return existing links if already created
      if (existingKycLink.tosLink || existingKycLink.kycLink) {
        return {
          id: existingKycLink.bridgeKycLinkId,
          kycLink: existingKycLink.kycLink,
          tosLink: existingKycLink.tosLink,
          kycStatus: existingKycLink.kycStatus,
          tosStatus: existingKycLink.tosStatus,
        };
      }
    }

    // Construct full name from user data or Clerk identity
    const fullName: string =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      identity.name ||
      "User";
    const email: string | undefined = user.email || identity.email;

    if (!email) {
      throw new Error("Email required for KYC");
    }

    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    // Generate idempotency key
    const idempotencyKey: string = `kyc-link-${email}-${Date.now()}`;

    // Create KYC link via Bridge API (individual type only)
    const response: Response = await fetch(`${bridgeApiUrl}/kyc_links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": bridgeApiKey,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        full_name: fullName,
        email: email,
        type: "individual",
        redirect_uri: process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/home`
          : undefined,
      }),
    });

    let data: any;

    if (!response.ok) {
      const errorResponse = await response.json();

      // Handle duplicate_record error - Bridge returns existing KYC link
      if (
        errorResponse.code === "duplicate_record" &&
        errorResponse.existing_kyc_link
      ) {
        data = errorResponse.existing_kyc_link;
      } else {
        throw new Error(`Bridge API error: ${JSON.stringify(errorResponse)}`);
      }
    } else {
      data = await response.json();
    }

    // Determine verification status based on KYC link status
    let verificationStatus:
      | "not_started"
      | "tos_pending"
      | "kyc_pending"
      | "under_review"
      | "approved"
      | "rejected";

    if (data.kyc_status === "approved") {
      verificationStatus = "approved";
    } else if (data.kyc_status === "rejected") {
      verificationStatus = "rejected";
    } else if (data.kyc_status === "under_review") {
      verificationStatus = "under_review";
    } else if (
      data.tos_status === "approved" &&
      data.kyc_status === "not_started"
    ) {
      verificationStatus = "kyc_pending";
    } else {
      verificationStatus = "tos_pending";
    }

    // Save to our database (upsert pattern - check if exists first)
    const existingLink = await ctx.runQuery(api.kycLinks.getByBridgeId, {
      bridgeKycLinkId: data.id,
    });

    if (!existingLink) {
      await ctx.runMutation(api.kycLinks.create, {
        bridgeKycLinkId: data.id,
        userId: user._id,
        email: data.email,
        fullName: data.full_name || fullName,
        type: "individual",
        kycLink: data.kyc_link,
        tosLink: data.tos_link,
        kycStatus: data.kyc_status,
        tosStatus: data.tos_status,
      });
    } else {
      // Update existing record
      await ctx.runMutation(api.kycLinks.updateStatus, {
        bridgeKycLinkId: data.id,
        kycStatus: data.kyc_status,
        tosStatus: data.tos_status,
        bridgeCustomerId: data.customer_id,
      });
    }

    // Update user verification status
    await ctx.runMutation(api.users.updateVerificationStatus, {
      userId: user._id,
      verificationStatus,
    });

    // If KYC is already approved and user has a customer_id, link them
    if (data.kyc_status === "approved" && data.customer_id) {
      // Link customer to user
      try {
        await ctx.runMutation(api.bridgeCustomers.linkToUser, {
          bridgeCustomerId: data.customer_id,
          userId: user._id,
        });
      } catch {
        // Customer might not exist in our DB yet, that's ok
        console.log(
          `[initializeOnboarding] Could not link customer ${data.customer_id} to user`
        );
      }
    }

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
