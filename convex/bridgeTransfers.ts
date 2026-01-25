import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Helper to transform Bridge API transfer response to our format
function transformBridgeTransfer(data: any) {
  return {
    bridgeTransferId: data.id,
    clientReferenceId: data.client_reference_id || undefined,
    bridgeCustomerId: data.on_behalf_of,
    state: data.state,
    currency: data.currency,
    amount: data.amount,
    developerFee: data.developer_fee,
    developerFeePercent: data.developer_fee_percent,
    source: {
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
    },
    destination: {
      paymentRail: data.destination?.payment_rail || "",
      currency: data.destination?.currency || "",
      toAddress: data.destination?.to_address,
      externalAccountId: data.destination?.external_account_id,
      bridgeWalletId: data.destination?.bridge_wallet_id,
      imad: data.destination?.imad,
      traceNumber: data.destination?.trace_number,
    },
    sourceDepositInstructions: data.source_deposit_instructions
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
      : undefined,
    receipt: data.receipt
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
      : undefined,
    features: data.features
      ? {
          flexibleAmount: data.features.flexible_amount,
          allowAnyFromAddress: data.features.allow_any_from_address,
        }
      : undefined,
    bridgeCreatedAt: data.created_at,
    bridgeUpdatedAt: data.updated_at,
  };
}

// Delete all transfers (admin cleanup)
export const deleteAll = mutation({
  args: {},
  handler: async (ctx) => {
    const transfers = await ctx.db.query("bridgeTransfers").collect();
    for (const transfer of transfers) {
      await ctx.db.delete(transfer._id);
    }
    return { deleted: transfers.length };
  },
});

// Upsert a Bridge transfer (create or update)
export const upsert = mutation({
  args: {
    bridgeTransferId: v.string(),
    clientReferenceId: v.optional(v.string()),
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")),
    state: v.string(),
    currency: v.string(),
    amount: v.optional(v.string()),
    developerFee: v.optional(v.string()),
    developerFeePercent: v.optional(v.string()),
    source: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      bridgeWalletId: v.optional(v.string()),
      fromAddress: v.optional(v.string()),
      externalAccountId: v.optional(v.string()),
      bankBeneficiaryName: v.optional(v.string()),
      bankRoutingNumber: v.optional(v.string()),
      bankName: v.optional(v.string()),
      imad: v.optional(v.string()),
      description: v.optional(v.string()),
      bic: v.optional(v.string()),
      uetr: v.optional(v.string()),
      reference: v.optional(v.string()),
      ibanLast4: v.optional(v.string()),
      senderName: v.optional(v.string()),
      paymentScheme: v.optional(v.string()),
      recipientName: v.optional(v.string()),
    }),
    destination: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      toAddress: v.optional(v.string()),
      externalAccountId: v.optional(v.string()),
      bridgeWalletId: v.optional(v.string()),
      imad: v.optional(v.string()),
      traceNumber: v.optional(v.string()),
    }),
    sourceDepositInstructions: v.optional(
      v.object({
        bankAccountNumber: v.optional(v.string()),
        bankRoutingNumber: v.optional(v.string()),
        depositMessage: v.optional(v.string()),
        paymentRail: v.optional(v.string()),
        fromAddress: v.optional(v.string()),
        toAddress: v.optional(v.string()),
        blockchainMemo: v.optional(v.string()),
        amount: v.optional(v.string()),
        currency: v.optional(v.string()),
      })
    ),
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
    features: v.optional(
      v.object({
        flexibleAmount: v.optional(v.boolean()),
        allowAnyFromAddress: v.optional(v.boolean()),
      })
    ),
    bridgeCreatedAt: v.string(),
    bridgeUpdatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("bridgeTransfers")
      .withIndex("by_bridge_transfer_id", (q) =>
        q.eq("bridgeTransferId", args.bridgeTransferId)
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

    return await ctx.db.insert("bridgeTransfers", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Link a transfer to a user
export const linkToUser = mutation({
  args: {
    bridgeTransferId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const transfer = await ctx.db
      .query("bridgeTransfers")
      .withIndex("by_bridge_transfer_id", (q) =>
        q.eq("bridgeTransferId", args.bridgeTransferId)
      )
      .first();

    if (!transfer) {
      throw new Error(`Transfer not found: ${args.bridgeTransferId}`);
    }

    await ctx.db.patch(transfer._id, {
      userId: args.userId,
      updatedAt: Date.now(),
    });

    return transfer._id;
  },
});

// Link all transfers for a customer to a user
export const linkAllByCustomerToUser = mutation({
  args: {
    bridgeCustomerId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const transfers = await ctx.db
      .query("bridgeTransfers")
      .withIndex("by_bridge_customer_id", (q) =>
        q.eq("bridgeCustomerId", args.bridgeCustomerId)
      )
      .collect();

    let linked = 0;
    for (const transfer of transfers) {
      if (!transfer.userId) {
        await ctx.db.patch(transfer._id, {
          userId: args.userId,
          updatedAt: Date.now(),
        });
        linked++;
      }
    }

    return { linked, total: transfers.length };
  },
});

// Get transfer by Bridge ID
export const getByBridgeId = query({
  args: { bridgeTransferId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bridgeTransfers")
      .withIndex("by_bridge_transfer_id", (q) =>
        q.eq("bridgeTransferId", args.bridgeTransferId)
      )
      .first();
  },
});

// Get transfer by client reference ID
export const getByClientReferenceId = query({
  args: { clientReferenceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bridgeTransfers")
      .withIndex("by_client_reference_id", (q) =>
        q.eq("clientReferenceId", args.clientReferenceId)
      )
      .first();
  },
});

// Get transfers for current user
export const getForCurrentUser = query({
  args: {
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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

    let results = ctx.db
      .query("bridgeTransfers")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc");

    const transfers = args.limit
      ? await results.take(args.limit)
      : await results.collect();

    // Filter by state if provided
    if (args.state) {
      return transfers.filter((t) => t.state === args.state);
    }

    return transfers;
  },
});

// Get transfers by Bridge customer ID
export const getByCustomerId = query({
  args: {
    bridgeCustomerId: v.string(),
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = ctx.db
      .query("bridgeTransfers")
      .withIndex("by_bridge_customer_id", (q) =>
        q.eq("bridgeCustomerId", args.bridgeCustomerId)
      )
      .order("desc");

    const transfers = args.limit
      ? await results.take(args.limit)
      : await results.collect();

    if (args.state) {
      return transfers.filter((t) => t.state === args.state);
    }

    return transfers;
  },
});

// Get transfers by state
export const getByState = query({
  args: {
    state: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = ctx.db
      .query("bridgeTransfers")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .order("desc");

    if (args.limit) {
      return await results.take(args.limit);
    }
    return await results.collect();
  },
});

// List all transfers
export const list = query({
  args: {
    state: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.state) {
      const results = ctx.db
        .query("bridgeTransfers")
        .withIndex("by_state", (q) => q.eq("state", args.state!))
        .order("desc");

      if (args.limit) {
        return await results.take(args.limit);
      }
      return await results.collect();
    }

    const results = ctx.db.query("bridgeTransfers").order("desc");

    if (args.limit) {
      return await results.take(args.limit);
    }
    return await results.collect();
  },
});

// Action: Create a transfer via Bridge API
export const create = action({
  args: {
    bridgeCustomerId: v.string(),
    amount: v.optional(v.string()),
    source: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      bridgeWalletId: v.optional(v.string()),
      fromAddress: v.optional(v.string()),
      externalAccountId: v.optional(v.string()),
    }),
    destination: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      toAddress: v.optional(v.string()),
      externalAccountId: v.optional(v.string()),
      bridgeWalletId: v.optional(v.string()),
    }),
    developerFee: v.optional(v.string()),
    developerFeePercent: v.optional(v.string()),
    clientReferenceId: v.optional(v.string()),
    features: v.optional(
      v.object({
        flexibleAmount: v.optional(v.boolean()),
        allowAnyFromAddress: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    // Generate idempotency key
    const idempotencyKey =
      args.clientReferenceId ||
      `transfer-${args.bridgeCustomerId}-${Date.now()}`;

    // Build request body
    const requestBody: any = {
      on_behalf_of: args.bridgeCustomerId,
      source: {
        payment_rail: args.source.paymentRail,
        currency: args.source.currency,
      },
      destination: {
        payment_rail: args.destination.paymentRail,
        currency: args.destination.currency,
      },
    };

    if (args.amount) {
      requestBody.amount = args.amount;
    }

    if (args.clientReferenceId) {
      requestBody.client_reference_id = args.clientReferenceId;
    }

    // Source options
    if (args.source.bridgeWalletId) {
      requestBody.source.bridge_wallet_id = args.source.bridgeWalletId;
    }
    if (args.source.fromAddress) {
      requestBody.source.from_address = args.source.fromAddress;
    }
    if (args.source.externalAccountId) {
      requestBody.source.external_account_id = args.source.externalAccountId;
    }

    // Destination options
    if (args.destination.toAddress) {
      requestBody.destination.to_address = args.destination.toAddress;
    }
    if (args.destination.externalAccountId) {
      requestBody.destination.external_account_id =
        args.destination.externalAccountId;
    }
    if (args.destination.bridgeWalletId) {
      requestBody.destination.bridge_wallet_id = args.destination.bridgeWalletId;
    }

    // Fees
    if (args.developerFee) {
      requestBody.developer_fee = args.developerFee;
    }
    if (args.developerFeePercent) {
      requestBody.developer_fee_percent = args.developerFeePercent;
    }

    // Features
    if (args.features) {
      requestBody.features = {};
      if (args.features.flexibleAmount !== undefined) {
        requestBody.features.flexible_amount = args.features.flexibleAmount;
      }
      if (args.features.allowAnyFromAddress !== undefined) {
        requestBody.features.allow_any_from_address =
          args.features.allowAnyFromAddress;
      }
    }

    const response = await fetch(`${bridgeApiUrl}/transfers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Api-Key": bridgeApiKey,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const transformed = transformBridgeTransfer(data);

    // Save to database
    await ctx.runMutation(api.bridgeTransfers.upsert, transformed);

    return transformed;
  },
});

// Action: Create a transfer for current user
export const createForCurrentUser = action({
  args: {
    amount: v.optional(v.string()),
    source: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      bridgeWalletId: v.optional(v.string()),
      fromAddress: v.optional(v.string()),
    }),
    destination: v.object({
      paymentRail: v.string(),
      currency: v.string(),
      toAddress: v.optional(v.string()),
      bridgeWalletId: v.optional(v.string()),
    }),
    developerFeePercent: v.optional(v.string()),
    features: v.optional(
      v.object({
        flexibleAmount: v.optional(v.boolean()),
        allowAnyFromAddress: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getUser, {
      clerkId: identity.subject,
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.bridgeCustomerId) {
      throw new Error(
        "User does not have a Bridge customer ID. Complete KYC first."
      );
    }

    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const clientReferenceId = `transfer-${user._id}-${Date.now()}`;

    const requestBody: any = {
      on_behalf_of: user.bridgeCustomerId,
      client_reference_id: clientReferenceId,
      source: {
        payment_rail: args.source.paymentRail,
        currency: args.source.currency,
      },
      destination: {
        payment_rail: args.destination.paymentRail,
        currency: args.destination.currency,
      },
    };

    if (args.amount) {
      requestBody.amount = args.amount;
    }

    if (args.source.bridgeWalletId) {
      requestBody.source.bridge_wallet_id = args.source.bridgeWalletId;
    }
    if (args.source.fromAddress) {
      requestBody.source.from_address = args.source.fromAddress;
    }

    if (args.destination.toAddress) {
      requestBody.destination.to_address = args.destination.toAddress;
    }
    if (args.destination.bridgeWalletId) {
      requestBody.destination.bridge_wallet_id = args.destination.bridgeWalletId;
    }

    if (args.developerFeePercent) {
      requestBody.developer_fee_percent = args.developerFeePercent;
    }

    if (args.features) {
      requestBody.features = {};
      if (args.features.flexibleAmount !== undefined) {
        requestBody.features.flexible_amount = args.features.flexibleAmount;
      }
      if (args.features.allowAnyFromAddress !== undefined) {
        requestBody.features.allow_any_from_address =
          args.features.allowAnyFromAddress;
      }
    }

    const response = await fetch(`${bridgeApiUrl}/transfers`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "Api-Key": bridgeApiKey,
        "Idempotency-Key": clientReferenceId,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const transfer = transformBridgeTransfer(data);

    // Save to database and link to user
    await ctx.runMutation(api.bridgeTransfers.upsert, transfer);
    await ctx.runMutation(api.bridgeTransfers.linkToUser, {
      bridgeTransferId: transfer.bridgeTransferId,
      userId: user._id,
    });

    return transfer;
  },
});

// Action: Cancel a transfer (only works for awaiting_funds state)
export const cancel = action({
  args: { bridgeTransferId: v.string() },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(
      `${bridgeApiUrl}/transfers/${args.bridgeTransferId}`,
      {
        method: "DELETE",
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
    const transformed = transformBridgeTransfer(data);

    // Update in database
    await ctx.runMutation(api.bridgeTransfers.upsert, transformed);

    return transformed;
  },
});

// Action: Sync a single transfer from Bridge API
export const syncFromBridge = action({
  args: { bridgeTransferId: v.string() },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(
      `${bridgeApiUrl}/transfers/${args.bridgeTransferId}`,
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
    const transformed = transformBridgeTransfer(data);

    // Upsert to database
    await ctx.runMutation(api.bridgeTransfers.upsert, transformed);

    return transformed;
  },
});

// Action: Sync transfers for a customer from Bridge API
export const syncCustomerTransfers = action({
  args: {
    bridgeCustomerId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const limit = args.limit || 100;
    const response = await fetch(
      `${bridgeApiUrl}/transfers?on_behalf_of=${args.bridgeCustomerId}&limit=${limit}`,
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

    const result = await response.json();
    const transfers = result.data || result || [];

    // Sync each transfer
    for (const transfer of transfers) {
      const transformed = transformBridgeTransfer(transfer);
      await ctx.runMutation(api.bridgeTransfers.upsert, transformed);
    }

    return { synced: transfers.length };
  },
});

// Action: Sync all transfers from Bridge API (paginated)
export const syncAllFromBridge = action({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    let allTransfers: any[] = [];
    let cursor: string | undefined;
    const pageLimit = args.limit || 100;

    do {
      const url = cursor
        ? `${bridgeApiUrl}/transfers?limit=${pageLimit}&after=${cursor}`
        : `${bridgeApiUrl}/transfers?limit=${pageLimit}`;

      const response = await fetch(url, {
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
      const transfers = result.data || result || [];
      allTransfers = allTransfers.concat(transfers);

      cursor = result.cursor;
    } while (cursor);

    // Sync each transfer
    for (const transfer of allTransfers) {
      const transformed = transformBridgeTransfer(transfer);
      await ctx.runMutation(api.bridgeTransfers.upsert, transformed);
    }

    return { synced: allTransfers.length };
  },
});
