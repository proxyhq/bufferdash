import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Type for verification status
const verificationStatusType = v.union(
  v.literal("not_started"),
  v.literal("tos_pending"),
  v.literal("kyc_pending"),
  v.literal("under_review"),
  v.literal("approved"),
  v.literal("rejected")
);

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      verificationStatus: "not_started",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null;
    }

    await ctx.db.patch(user._id, {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

export const deleteUser = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Update user's verification status
export const updateVerificationStatus = mutation({
  args: {
    userId: v.id("users"),
    verificationStatus: verificationStatusType,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      verificationStatus: args.verificationStatus,
      updatedAt: Date.now(),
    });
  },
});

// Link Bridge customer to user
export const linkBridgeCustomer = mutation({
  args: {
    userId: v.id("users"),
    bridgeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      bridgeCustomerId: args.bridgeCustomerId,
      updatedAt: Date.now(),
    });
  },
});

// Get current user's verification state (for frontend)
export const getVerificationState = query({
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

    // Get associated KYC link if exists
    const kycLink = await ctx.db
      .query("kycLinks")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    return {
      verificationStatus: user.verificationStatus || "not_started",
      bridgeCustomerId: user.bridgeCustomerId,
      kycLink: kycLink
        ? {
            tosLink: kycLink.tosLink,
            kycLink: kycLink.kycLink,
            tosStatus: kycLink.tosStatus,
            kycStatus: kycLink.kycStatus,
          }
        : null,
    };
  },
});
