import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new crypto recipient
export const create = mutation({
  args: {
    label: v.string(),
    address: v.string(),
    chain: v.string(),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    return await ctx.db.insert("cryptoRecipients", {
      userId: user._id,
      label: args.label,
      address: args.address,
      chain: args.chain,
      currency: args.currency,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an existing crypto recipient
export const update = mutation({
  args: {
    id: v.id("cryptoRecipients"),
    label: v.optional(v.string()),
    address: v.optional(v.string()),
    chain: v.optional(v.string()),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const recipient = await ctx.db.get(args.id);
    if (!recipient) {
      throw new Error("Recipient not found");
    }

    if (recipient.userId !== user._id) {
      throw new Error("Not authorized to update this recipient");
    }

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(args.id, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Delete a crypto recipient
export const remove = mutation({
  args: {
    id: v.id("cryptoRecipients"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const recipient = await ctx.db.get(args.id);
    if (!recipient) {
      throw new Error("Recipient not found");
    }

    if (recipient.userId !== user._id) {
      throw new Error("Not authorized to delete this recipient");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Get all crypto recipients for current user
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
      .query("cryptoRecipients")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// Get a crypto recipient by address
export const getByAddress = query({
  args: {
    address: v.string(),
  },
  handler: async (ctx, args) => {
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

    const recipients = await ctx.db
      .query("cryptoRecipients")
      .withIndex("by_address", (q) => q.eq("address", args.address))
      .collect();

    // Return only if it belongs to current user
    return recipients.find((r) => r.userId === user._id) || null;
  },
});

// Get a single crypto recipient by ID
export const getById = query({
  args: {
    id: v.id("cryptoRecipients"),
  },
  handler: async (ctx, args) => {
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

    const recipient = await ctx.db.get(args.id);
    if (!recipient || recipient.userId !== user._id) {
      return null;
    }

    return recipient;
  },
});
