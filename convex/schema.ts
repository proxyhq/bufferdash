import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    // Link to Bridge customer
    bridgeCustomerId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_bridge_customer_id", ["bridgeCustomerId"]),

  // Bridge KYC Links - tracks KYC link status for onboarding
  kycLinks: defineTable({
    bridgeKycLinkId: v.string(),
    userId: v.id("users"),
    email: v.string(),
    fullName: v.string(),
    type: v.union(v.literal("individual"), v.literal("business")),
    kycLink: v.optional(v.string()),
    tosLink: v.optional(v.string()),
    kycStatus: v.string(), // not_started, incomplete, under_review, approved, rejected, etc.
    tosStatus: v.string(), // pending, approved
    bridgeCustomerId: v.optional(v.string()), // Set when KYC is approved
    redirectUri: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bridge_kyc_link_id", ["bridgeKycLinkId"])
    .index("by_user_id", ["userId"])
    .index("by_kyc_status", ["kycStatus"]),

  // Bridge Customers - synced from Bridge API
  bridgeCustomers: defineTable({
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")), // Link to our user
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    status: v.string(), // active, not_started, under_review, incomplete, rejected, etc.
    type: v.union(v.literal("individual"), v.literal("business")),
    hasAcceptedTermsOfService: v.boolean(),
    tosLink: v.optional(v.string()),
    // Endorsements summary
    endorsements: v.array(
      v.object({
        name: v.string(), // base, sepa, spei, pix, faster_payments
        status: v.string(), // approved, incomplete, pending, rejected
      })
    ),
    // Capabilities
    capabilities: v.object({
      payinCrypto: v.string(),
      payoutCrypto: v.string(),
      payinFiat: v.string(),
      payoutFiat: v.string(),
    }),
    // Requirements
    requirementsDue: v.array(v.string()),
    rejectionReasons: v.array(
      v.object({
        developerReason: v.optional(v.string()),
        reason: v.string(),
        createdAt: v.optional(v.string()),
      })
    ),
    // Timestamps from Bridge
    bridgeCreatedAt: v.string(),
    bridgeUpdatedAt: v.string(),
    // Our timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bridge_customer_id", ["bridgeCustomerId"])
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),
});
