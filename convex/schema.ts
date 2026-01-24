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

  // Bridge Wallets - custodial wallets synced from Bridge API
  bridgeWallets: defineTable({
    bridgeWalletId: v.string(),
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")), // Link to our user
    chain: v.union(
      v.literal("solana"),
      v.literal("base"),
      v.literal("ethereum")
    ),
    address: v.string(),
    tags: v.array(v.string()),
    // Balances for each supported currency on this wallet
    balances: v.array(
      v.object({
        balance: v.string(), // Decimal string (e.g., "123.45")
        currency: v.string(), // usdc, usdb, eurc, pyusd
        chain: v.string(), // solana, base, ethereum
        contractAddress: v.string(),
      })
    ),
    // Timestamps from Bridge
    bridgeCreatedAt: v.string(),
    bridgeUpdatedAt: v.string(),
    // Our timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bridge_wallet_id", ["bridgeWalletId"])
    .index("by_bridge_customer_id", ["bridgeCustomerId"])
    .index("by_user_id", ["userId"])
    .index("by_chain", ["chain"])
    .index("by_address", ["address"]),

  // Bridge Liquidation Addresses - permanent payment routes
  liquidationAddresses: defineTable({
    bridgeLiquidationAddressId: v.string(),
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")),
    chain: v.string(), // solana, base, ethereum, arbitrum, tron, evm, etc.
    address: v.string(), // blockchain address to receive funds
    currency: v.string(), // usdc, usdt, usdb, any, etc.
    state: v.string(), // active, etc.
    // Destination configuration
    destinationPaymentRail: v.string(), // solana, wire, ach, polygon, etc.
    destinationCurrency: v.string(), // usdc, usdb, usd, etc.
    destinationAddress: v.optional(v.string()), // for crypto destinations
    bridgeWalletId: v.optional(v.string()), // for wallet destinations
    externalAccountId: v.optional(v.string()), // for fiat destinations
    destinationWireMessage: v.optional(v.string()),
    blockchainMemo: v.optional(v.string()), // for memo-based chains like Stellar
    customDeveloperFeePercent: v.optional(v.string()),
    // Timestamps from Bridge
    bridgeCreatedAt: v.string(),
    bridgeUpdatedAt: v.string(),
    // Our timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bridge_liquidation_address_id", ["bridgeLiquidationAddressId"])
    .index("by_bridge_customer_id", ["bridgeCustomerId"])
    .index("by_user_id", ["userId"])
    .index("by_chain", ["chain"])
    .index("by_address", ["address"]),

  // Bridge Liquidation Drains - records of funds drained from liquidation addresses
  liquidationDrains: defineTable({
    bridgeDrainId: v.string(),
    bridgeLiquidationAddressId: v.string(),
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")),
    amount: v.string(),
    currency: v.string(),
    state: v.string(), // in_review, funds_received, payment_submitted, payment_processed, etc.
    sourcePaymentRail: v.optional(v.string()),
    fromAddress: v.optional(v.string()),
    // Destination info
    destination: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      toAddress: v.optional(v.string()),
      externalAccountId: v.optional(v.string()),
      imad: v.optional(v.string()), // for wires
      traceNumber: v.optional(v.string()), // for ACH
    }),
    destinationTxHash: v.optional(v.string()),
    depositTxHash: v.optional(v.string()),
    depositTxTimestamp: v.optional(v.string()),
    // Receipt info
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
    // Timestamps from Bridge
    bridgeCreatedAt: v.string(),
    bridgeUpdatedAt: v.string(),
    // Our timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bridge_drain_id", ["bridgeDrainId"])
    .index("by_bridge_liquidation_address_id", ["bridgeLiquidationAddressId"])
    .index("by_bridge_customer_id", ["bridgeCustomerId"])
    .index("by_user_id", ["userId"])
    .index("by_state", ["state"]),

  // Bridge Webhook Events - incoming webhook events from Bridge
  bridgeWebhookEvents: defineTable({
    eventId: v.string(), // Bridge event_id (globally unique, use as idempotency key)
    eventCategory: v.string(), // customer, kyc_link, transfer, liquidation_address.drain, etc.
    eventType: v.string(), // e.g., "customer.created", "transfer.updated.status_transitioned"
    eventObjectId: v.string(), // ID of the object (customer, transfer, etc.)
    eventObjectStatus: v.optional(v.string()), // Status if applicable
    eventObject: v.any(), // Full event object data
    eventObjectChanges: v.optional(v.any()), // Changes from previous state
    eventCreatedAt: v.string(), // Bridge timestamp
    processed: v.boolean(), // Whether we've processed this event
    processedAt: v.optional(v.number()), // When we processed it
    createdAt: v.number(),
  })
    .index("by_event_id", ["eventId"])
    .index("by_event_category", ["eventCategory"])
    .index("by_event_object_id", ["eventObjectId"])
    .index("by_processed", ["processed"]),
});
