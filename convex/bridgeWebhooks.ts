import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Store a webhook event (idempotent by eventId)
export const storeEvent = mutation({
  args: {
    eventId: v.string(),
    eventCategory: v.string(),
    eventType: v.string(),
    eventObjectId: v.string(),
    eventObjectStatus: v.optional(v.string()),
    eventObject: v.any(),
    eventObjectChanges: v.optional(v.any()),
    eventCreatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if event already exists (idempotency)
    const existing = await ctx.db
      .query("bridgeWebhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .first();

    if (existing) {
      // Already processed this event
      return { duplicate: true, id: existing._id };
    }

    const id = await ctx.db.insert("bridgeWebhookEvents", {
      ...args,
      processed: false,
      createdAt: Date.now(),
    });

    return { duplicate: false, id };
  },
});

// Mark event as processed
export const markProcessed = mutation({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("bridgeWebhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .first();

    if (event) {
      await ctx.db.patch(event._id, {
        processed: true,
        processedAt: Date.now(),
      });
    }
  },
});

// Get unprocessed events
export const getUnprocessed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const results = ctx.db
      .query("bridgeWebhookEvents")
      .withIndex("by_processed", (q) => q.eq("processed", false))
      .order("asc");

    if (args.limit) {
      return await results.take(args.limit);
    }
    return await results.collect();
  },
});

// Get events by category
export const getByCategory = query({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = ctx.db
      .query("bridgeWebhookEvents")
      .withIndex("by_event_category", (q) =>
        q.eq("eventCategory", args.category)
      )
      .order("desc");

    if (args.limit) {
      return await results.take(args.limit);
    }
    return await results.collect();
  },
});

// Get event by ID
export const getByEventId = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bridgeWebhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .first();
  },
});

// List recent events
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const results = ctx.db.query("bridgeWebhookEvents").order("desc");

    if (args.limit) {
      return await results.take(args.limit);
    }
    return await results.take(50);
  },
});

// Process customer events
export const processCustomerEvent = internalMutation({
  args: {
    eventType: v.string(),
    eventObject: v.any(),
  },
  handler: async (ctx, args) => {
    const data = args.eventObject;

    // Transform and upsert customer
    const transformed = {
      bridgeCustomerId: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      status: data.status,
      type: data.type as "individual" | "business",
      hasAcceptedTermsOfService: data.has_accepted_terms_of_service || false,
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

    await ctx.runMutation(api.bridgeCustomers.upsert, transformed);
  },
});

// Process KYC link events
export const processKycLinkEvent = internalMutation({
  args: {
    eventType: v.string(),
    eventObject: v.any(),
  },
  handler: async (ctx, args) => {
    const data = args.eventObject;

    // Check if KYC link exists
    const existing = await ctx.db
      .query("kycLinks")
      .withIndex("by_bridge_kyc_link_id", (q) =>
        q.eq("bridgeKycLinkId", data.id)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        kycStatus: data.kyc_status,
        tosStatus: data.tos_status,
        bridgeCustomerId: data.customer_id,
        updatedAt: now,
      });
    } else {
      // Create new record from webhook data
      await ctx.db.insert("kycLinks", {
        bridgeKycLinkId: data.id,
        userId: undefined as any, // Will be linked later
        email: data.email,
        fullName: data.full_name,
        type: data.type as "individual" | "business",
        kycLink: data.kyc_link,
        tosLink: data.tos_link,
        kycStatus: data.kyc_status,
        tosStatus: data.tos_status,
        bridgeCustomerId: data.customer_id,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Process transfer events
export const processTransferEvent = internalMutation({
  args: {
    eventType: v.string(),
    eventObject: v.any(),
  },
  handler: async (ctx, args) => {
    const data = args.eventObject;

    // Check if transfer exists
    const existing = await ctx.db
      .query("bridgeTransfers")
      .withIndex("by_bridge_transfer_id", (q) =>
        q.eq("bridgeTransferId", data.id)
      )
      .first();

    const now = Date.now();

    // Transform source
    const source = {
      paymentRail: data.source?.payment_rail || "",
      currency: data.source?.currency || "",
      bridgeWalletId: data.source?.bridge_wallet_id,
      fromAddress: data.source?.from_address,
      externalAccountId: data.source?.external_account_id,
      bankBeneficiaryName: data.source?.bank_beneficiary_name,
      bankRoutingNumber: data.source?.bank_routing_number,
      bankName: data.source?.bank_name,
      imad: data.source?.imad,
      description: data.source?.description,
      bic: data.source?.bic,
      uetr: data.source?.uetr,
      reference: data.source?.reference,
      ibanLast4: data.source?.iban_last_4,
      senderName: data.source?.sender_name,
      paymentScheme: data.source?.payment_scheme,
      recipientName: data.source?.recipient_name,
    };

    // Transform destination
    const destination = {
      paymentRail: data.destination?.payment_rail || "",
      currency: data.destination?.currency || "",
      toAddress: data.destination?.to_address,
      externalAccountId: data.destination?.external_account_id,
      bridgeWalletId: data.destination?.bridge_wallet_id,
      imad: data.destination?.imad,
      traceNumber: data.destination?.trace_number,
    };

    // Transform source deposit instructions
    const sourceDepositInstructions = data.source_deposit_instructions
      ? {
          bankAccountNumber: data.source_deposit_instructions.bank_account_number,
          bankRoutingNumber: data.source_deposit_instructions.bank_routing_number,
          depositMessage: data.source_deposit_instructions.deposit_message,
          paymentRail: data.source_deposit_instructions.payment_rail,
          fromAddress: data.source_deposit_instructions.from_address,
          toAddress: data.source_deposit_instructions.to_address,
          blockchainMemo: data.source_deposit_instructions.blockchain_memo,
          amount: data.source_deposit_instructions.amount,
          currency: data.source_deposit_instructions.currency,
        }
      : undefined;

    // Transform receipt
    const receipt = data.receipt
      ? {
          initialAmount: data.receipt.initial_amount,
          developerFee: data.receipt.developer_fee,
          exchangeFee: data.receipt.exchange_fee,
          subtotalAmount: data.receipt.subtotal_amount,
          gasFee: data.receipt.gas_fee,
          finalAmount: data.receipt.final_amount,
          url: data.receipt.url,
          destinationTxHash: data.receipt.destination_tx_hash,
        }
      : undefined;

    // Transform features
    const features = data.features
      ? {
          flexibleAmount: data.features.flexible_amount,
          allowAnyFromAddress: data.features.allow_any_from_address,
        }
      : undefined;

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        state: data.state,
        amount: data.amount,
        developerFee: data.developer_fee,
        developerFeePercent: data.developer_fee_percent,
        source,
        destination,
        sourceDepositInstructions,
        receipt,
        features,
        bridgeUpdatedAt: data.updated_at,
        updatedAt: now,
      });
    } else {
      // Create new record from webhook data
      await ctx.db.insert("bridgeTransfers", {
        bridgeTransferId: data.id,
        clientReferenceId: data.client_reference_id,
        bridgeCustomerId: data.on_behalf_of,
        state: data.state,
        currency: data.currency || "usd",
        amount: data.amount,
        developerFee: data.developer_fee,
        developerFeePercent: data.developer_fee_percent,
        source,
        destination,
        sourceDepositInstructions,
        receipt,
        features,
        bridgeCreatedAt: data.created_at,
        bridgeUpdatedAt: data.updated_at,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Process liquidation drain events
export const processDrainEvent = internalMutation({
  args: {
    eventType: v.string(),
    eventObject: v.any(),
  },
  handler: async (ctx, args) => {
    const data = args.eventObject;

    const transformed = {
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

    await ctx.runMutation(api.liquidationAddresses.upsertDrain, transformed);
  },
});

// Process virtual account events
export const processVirtualAccountEvent = internalMutation({
  args: {
    eventType: v.string(),
    eventObject: v.any(),
  },
  handler: async (ctx, args) => {
    const data = args.eventObject;

    // Transform source info
    const source = data.source
      ? {
          paymentRail: data.source.payment_rail,
          description: data.source.description,
          senderName: data.source.sender_name,
          senderRoutingNumber: data.source.sender_routing_number,
          senderBankRoutingNumber: data.source.sender_bank_routing_number,
          traceNumber: data.source.trace_number,
          bankRoutingNumber: data.source.bank_routing_number,
          bankName: data.source.bank_name,
          bankBeneficiaryName: data.source.bank_beneficiary_name,
          originatorName: data.source.originator_name,
          originatorAddress: data.source.originator_address,
          imad: data.source.imad,
          estimatedArrivalDate: data.source.estimated_arrival_date,
        }
      : undefined;

    // Transform receipt
    const receipt = data.receipt
      ? {
          initialAmount: data.receipt.initial_amount,
          developerFee: data.receipt.developer_fee,
          exchangeFee: data.receipt.exchange_fee,
          subtotalAmount: data.receipt.subtotal_amount,
          gasFee: data.receipt.gas_fee,
          finalAmount: data.receipt.final_amount,
          url: data.receipt.url,
          destinationTxHash: data.receipt.destination_tx_hash,
        }
      : undefined;

    // Transform refund info
    const refund = data.refund
      ? {
          code: data.refund.code,
          reason: data.refund.reason,
          refundedAt: data.refund.refunded_at,
        }
      : undefined;

    // Store the event
    await ctx.runMutation(internal.bridgeVirtualAccounts.upsertEvent, {
      bridgeEventId: data.id,
      bridgeVirtualAccountId: data.virtual_account_id,
      bridgeCustomerId: data.customer_id,
      depositId: data.deposit_id,
      type: data.type,
      amount: data.amount || "0",
      currency: data.currency || "usd",
      developerFeeAmount: data.developer_fee_amount,
      exchangeFeeAmount: data.exchange_fee_amount,
      subtotalAmount: data.subtotal_amount,
      gasFee: data.gas_fee,
      source,
      destinationTxHash: data.destination_tx_hash,
      receipt,
      refund,
      accountUpdates: data.account_updates,
      bridgeCreatedAt: data.created_at,
    });

    // For deactivation/reactivation events, update the account status
    if (data.type === "deactivation") {
      await ctx.runMutation(internal.bridgeVirtualAccounts.updateStatus, {
        bridgeVirtualAccountId: data.virtual_account_id,
        status: "deactivated",
      });
    } else if (data.type === "reactivation") {
      await ctx.runMutation(internal.bridgeVirtualAccounts.updateStatus, {
        bridgeVirtualAccountId: data.virtual_account_id,
        status: "activated",
      });
    }
  },
});
