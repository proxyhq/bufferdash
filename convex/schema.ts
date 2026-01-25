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

  // Bridge Transfers - money movement to/from fiat and crypto
  bridgeTransfers: defineTable({
    bridgeTransferId: v.string(),
    clientReferenceId: v.optional(v.string()),
    bridgeCustomerId: v.string(), // on_behalf_of
    userId: v.optional(v.id("users")),
    state: v.string(), // awaiting_funds, in_review, funds_received, payment_submitted, payment_processed, undeliverable, returned, missing_return_policy, refunded, canceled, error
    currency: v.string(), // base currency (e.g., "usd")
    amount: v.optional(v.string()), // may be null for flexible_amount transfers until funds received
    developerFee: v.optional(v.string()),
    developerFeePercent: v.optional(v.string()),
    // Source configuration
    source: v.object({
      paymentRail: v.string(), // bridge_wallet, wire, ach_push, sepa, ethereum, solana, etc.
      currency: v.string(),
      bridgeWalletId: v.optional(v.string()),
      fromAddress: v.optional(v.string()),
      externalAccountId: v.optional(v.string()),
      // Fiat deposit info (populated after deposit received)
      bankBeneficiaryName: v.optional(v.string()),
      bankRoutingNumber: v.optional(v.string()),
      bankName: v.optional(v.string()),
      imad: v.optional(v.string()),
      description: v.optional(v.string()),
      // SEPA specific
      bic: v.optional(v.string()),
      uetr: v.optional(v.string()),
      reference: v.optional(v.string()),
      ibanLast4: v.optional(v.string()),
      senderName: v.optional(v.string()),
      paymentScheme: v.optional(v.string()),
      recipientName: v.optional(v.string()),
    }),
    // Destination configuration
    destination: v.object({
      paymentRail: v.string(), // solana, ethereum, wire, ach, sepa, etc.
      currency: v.string(),
      toAddress: v.optional(v.string()),
      externalAccountId: v.optional(v.string()),
      bridgeWalletId: v.optional(v.string()),
      imad: v.optional(v.string()), // for wire
      traceNumber: v.optional(v.string()), // for ACH
    }),
    // Deposit instructions (for awaiting_funds state)
    sourceDepositInstructions: v.optional(
      v.object({
        // Fiat deposit instructions
        bankAccountNumber: v.optional(v.string()),
        bankRoutingNumber: v.optional(v.string()),
        depositMessage: v.optional(v.string()),
        // Crypto deposit instructions
        paymentRail: v.optional(v.string()),
        fromAddress: v.optional(v.string()),
        toAddress: v.optional(v.string()),
        blockchainMemo: v.optional(v.string()),
        // Common
        amount: v.optional(v.string()),
        currency: v.optional(v.string()),
      })
    ),
    // Receipt (for completed transfers)
    receipt: v.optional(
      v.object({
        initialAmount: v.string(),
        developerFee: v.string(),
        exchangeFee: v.string(),
        subtotalAmount: v.string(),
        gasFee: v.optional(v.string()),
        finalAmount: v.string(),
        url: v.optional(v.string()),
        destinationTxHash: v.optional(v.string()),
      })
    ),
    // Features
    features: v.optional(
      v.object({
        flexibleAmount: v.optional(v.boolean()),
        allowAnyFromAddress: v.optional(v.boolean()),
      })
    ),
    // Timestamps from Bridge
    bridgeCreatedAt: v.string(),
    bridgeUpdatedAt: v.string(),
    // Our timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bridge_transfer_id", ["bridgeTransferId"])
    .index("by_bridge_customer_id", ["bridgeCustomerId"])
    .index("by_user_id", ["userId"])
    .index("by_state", ["state"])
    .index("by_client_reference_id", ["clientReferenceId"]),

  // Bridge External Accounts - customer's linked bank accounts for withdrawals
  externalAccounts: defineTable({
    bridgeExternalAccountId: v.string(),
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")),
    // Account type: us, iban, clabe, pix, gb
    accountType: v.string(),
    currency: v.string(), // usd, eur, mxn, brl, gbp
    bankName: v.optional(v.string()),
    accountName: v.optional(v.string()),
    accountOwnerName: v.string(),
    accountOwnerType: v.optional(v.string()), // individual, business
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    businessName: v.optional(v.string()),
    active: v.boolean(),
    last4: v.optional(v.string()),
    beneficiaryAddressValid: v.optional(v.boolean()),
    // US Bank Account details
    usAccount: v.optional(
      v.object({
        routingNumber: v.string(),
        last4: v.string(),
        checkingOrSavings: v.optional(v.string()), // checking, savings
      })
    ),
    // IBAN (SEPA) details
    ibanAccount: v.optional(
      v.object({
        last4: v.string(),
        bic: v.optional(v.string()),
        country: v.string(),
      })
    ),
    // CLABE (Mexico) details
    clabeAccount: v.optional(
      v.object({
        last4: v.string(),
      })
    ),
    // Pix (Brazil) details - can be pix_key or br_code
    pixAccount: v.optional(
      v.object({
        accountPreview: v.optional(v.string()),
        documentNumberLast4: v.optional(v.string()),
      })
    ),
    // GB (UK Faster Payments) details
    gbAccount: v.optional(
      v.object({
        sortCode: v.string(),
        accountNumber: v.string(),
      })
    ),
    // Address (required for some account types)
    address: v.optional(
      v.object({
        streetLine1: v.string(),
        streetLine2: v.optional(v.string()),
        city: v.string(),
        state: v.optional(v.string()),
        postalCode: v.string(),
        country: v.string(),
      })
    ),
    // Timestamps from Bridge
    bridgeCreatedAt: v.string(),
    bridgeUpdatedAt: v.string(),
    // Our timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bridge_external_account_id", ["bridgeExternalAccountId"])
    .index("by_bridge_customer_id", ["bridgeCustomerId"])
    .index("by_user_id", ["userId"])
    .index("by_account_type", ["accountType"])
    .index("by_currency", ["currency"])
    .index("by_active", ["active"]),

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

  // Bridge Exchange Rates - cached rates from Bridge API
  exchangeRates: defineTable({
    fromCurrency: v.string(), // usd, btc, eth, sol
    toCurrency: v.string(), // gbp, eur, mxn, brl, usdt, usd
    midmarketRate: v.string(), // True market rate
    buyRate: v.string(), // Rate when buying toCurrency (includes fee)
    sellRate: v.string(), // Rate when selling toCurrency (includes fee)
    fetchedAt: v.number(), // When we fetched this rate
    expiresAt: v.number(), // When this rate should be considered stale
  })
    .index("by_pair", ["fromCurrency", "toCurrency"])
    .index("by_expires_at", ["expiresAt"]),

  // Bridge Virtual Accounts - permanent fiat deposit addresses for onramping
  virtualAccounts: defineTable({
    bridgeVirtualAccountId: v.string(),
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")),
    status: v.string(), // activated, deactivated
    developerFeePercent: v.optional(v.string()),
    // Source configuration (fiat deposit details)
    sourceCurrency: v.string(), // usd, eur, mxn, brl, gbp
    sourceDepositInstructions: v.object({
      currency: v.string(),
      paymentRails: v.array(v.string()), // ach_push, wire, sepa, spei, pix, faster_payments
      // USD (ACH/Wire)
      bankName: v.optional(v.string()),
      bankAddress: v.optional(v.string()),
      bankRoutingNumber: v.optional(v.string()),
      bankAccountNumber: v.optional(v.string()),
      bankBeneficiaryName: v.optional(v.string()),
      bankBeneficiaryAddress: v.optional(v.string()),
      // EUR (SEPA)
      iban: v.optional(v.string()),
      bic: v.optional(v.string()),
      accountHolderName: v.optional(v.string()),
      // MXN (SPEI)
      clabe: v.optional(v.string()),
      // BRL (Pix)
      brCode: v.optional(v.string()),
      // GBP (Faster Payments)
      sortCode: v.optional(v.string()),
      accountNumber: v.optional(v.string()),
    }),
    // Destination configuration (crypto delivery)
    destination: v.object({
      paymentRail: v.string(), // solana, ethereum, base, etc.
      currency: v.string(), // usdc, usdt, usdb
      address: v.optional(v.string()), // blockchain address
      bridgeWalletId: v.optional(v.string()), // or Bridge wallet
      blockchainMemo: v.optional(v.string()), // for memo-based chains
    }),
    // Timestamps from Bridge
    bridgeCreatedAt: v.string(),
    // Our timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_bridge_virtual_account_id", ["bridgeVirtualAccountId"])
    .index("by_bridge_customer_id", ["bridgeCustomerId"])
    .index("by_user_id", ["userId"])
    .index("by_status", ["status"])
    .index("by_source_currency", ["sourceCurrency"]),

  // Bridge Virtual Account Events - deposit and payment history
  virtualAccountEvents: defineTable({
    bridgeEventId: v.string(),
    bridgeVirtualAccountId: v.string(),
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")),
    depositId: v.optional(v.string()), // Links events for same deposit
    type: v.string(), // funds_received, payment_submitted, payment_processed, funds_scheduled, in_review, refunded, account_update, deactivation, reactivation, microdeposit
    amount: v.string(),
    currency: v.string(),
    // Fee breakdown
    developerFeeAmount: v.optional(v.string()),
    exchangeFeeAmount: v.optional(v.string()),
    subtotalAmount: v.optional(v.string()),
    gasFee: v.optional(v.string()),
    // Source info (fiat deposit details)
    source: v.optional(
      v.object({
        paymentRail: v.string(), // ach_push, wire, sepa, spei, pix, faster_payments
        description: v.optional(v.string()),
        senderName: v.optional(v.string()),
        senderRoutingNumber: v.optional(v.string()),
        senderBankRoutingNumber: v.optional(v.string()),
        traceNumber: v.optional(v.string()),
        // Wire-specific
        bankRoutingNumber: v.optional(v.string()),
        bankName: v.optional(v.string()),
        bankBeneficiaryName: v.optional(v.string()),
        originatorName: v.optional(v.string()),
        originatorAddress: v.optional(v.string()),
        imad: v.optional(v.string()),
        // ACH scheduled
        estimatedArrivalDate: v.optional(v.string()),
      })
    ),
    // Destination tx hash (for payment_submitted/payment_processed)
    destinationTxHash: v.optional(v.string()),
    // Receipt (for completed payments)
    receipt: v.optional(
      v.object({
        initialAmount: v.string(),
        developerFee: v.string(),
        exchangeFee: v.string(),
        subtotalAmount: v.string(),
        gasFee: v.optional(v.string()),
        finalAmount: v.string(),
        url: v.optional(v.string()),
        destinationTxHash: v.optional(v.string()),
      })
    ),
    // Refund info (for refunded events)
    refund: v.optional(
      v.object({
        code: v.string(),
        reason: v.string(),
        refundedAt: v.string(),
      })
    ),
    // Account updates (for account_update events)
    accountUpdates: v.optional(v.any()),
    // Timestamp from Bridge
    bridgeCreatedAt: v.string(),
    // Our timestamp
    createdAt: v.number(),
  })
    .index("by_bridge_event_id", ["bridgeEventId"])
    .index("by_bridge_virtual_account_id", ["bridgeVirtualAccountId"])
    .index("by_bridge_customer_id", ["bridgeCustomerId"])
    .index("by_user_id", ["userId"])
    .index("by_deposit_id", ["depositId"])
    .index("by_type", ["type"]),
});
