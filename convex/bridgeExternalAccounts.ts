import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Helper to transform Bridge API external account response to our format
function transformBridgeExternalAccount(data: any) {
  const base = {
    bridgeExternalAccountId: data.id,
    bridgeCustomerId: data.customer_id,
    accountType: data.account_type,
    currency: data.currency,
    bankName: data.bank_name,
    accountName: data.account_name,
    accountOwnerName: data.account_owner_name,
    accountOwnerType: data.account_owner_type,
    firstName: data.first_name,
    lastName: data.last_name,
    businessName: data.business_name,
    active: data.active ?? true,
    last4: data.last_4,
    beneficiaryAddressValid: data.beneficiary_address_valid,
    bridgeCreatedAt: data.created_at,
    bridgeUpdatedAt: data.updated_at,
  };

  // US Bank Account
  if (data.account_type === "us" && data.account) {
    return {
      ...base,
      usAccount: {
        routingNumber: data.account.routing_number,
        last4: data.account.last_4,
        checkingOrSavings: data.account.checking_or_savings,
      },
    };
  }

  // IBAN (SEPA)
  if (data.account_type === "iban" && data.iban) {
    return {
      ...base,
      ibanAccount: {
        last4: data.iban.last_4,
        bic: data.iban.bic,
        country: data.iban.country,
      },
    };
  }

  // CLABE (Mexico)
  if (data.account_type === "clabe" && data.clabe) {
    return {
      ...base,
      clabeAccount: {
        last4: data.clabe.last_4,
      },
    };
  }

  // Pix (Brazil)
  if (data.account_type === "pix" && (data.pix_key || data.br_code)) {
    const pixData = data.pix_key || data.br_code;
    return {
      ...base,
      pixAccount: {
        accountPreview: pixData.account_preview,
        documentNumberLast4: pixData.document_number_last4,
      },
    };
  }

  // GB (UK Faster Payments)
  if (data.account_type === "gb" && data.account) {
    return {
      ...base,
      gbAccount: {
        sortCode: data.account.sort_code,
        accountNumber: data.account.account_number,
      },
    };
  }

  return base;
}

// Delete all external accounts (admin cleanup)
export const deleteAll = mutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("externalAccounts").collect();
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }
    return { deleted: accounts.length };
  },
});

// Upsert an external account
export const upsert = mutation({
  args: {
    bridgeExternalAccountId: v.string(),
    bridgeCustomerId: v.string(),
    userId: v.optional(v.id("users")),
    accountType: v.string(),
    currency: v.string(),
    bankName: v.optional(v.string()),
    accountName: v.optional(v.string()),
    accountOwnerName: v.string(),
    accountOwnerType: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    businessName: v.optional(v.string()),
    active: v.boolean(),
    last4: v.optional(v.string()),
    beneficiaryAddressValid: v.optional(v.boolean()),
    usAccount: v.optional(
      v.object({
        routingNumber: v.string(),
        last4: v.string(),
        checkingOrSavings: v.optional(v.string()),
      })
    ),
    ibanAccount: v.optional(
      v.object({
        last4: v.string(),
        bic: v.optional(v.string()),
        country: v.string(),
      })
    ),
    clabeAccount: v.optional(
      v.object({
        last4: v.string(),
      })
    ),
    pixAccount: v.optional(
      v.object({
        accountPreview: v.optional(v.string()),
        documentNumberLast4: v.optional(v.string()),
      })
    ),
    gbAccount: v.optional(
      v.object({
        sortCode: v.string(),
        accountNumber: v.string(),
      })
    ),
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
    bridgeCreatedAt: v.string(),
    bridgeUpdatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("externalAccounts")
      .withIndex("by_bridge_external_account_id", (q) =>
        q.eq("bridgeExternalAccountId", args.bridgeExternalAccountId)
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

    return await ctx.db.insert("externalAccounts", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Link an external account to a user
export const linkToUser = mutation({
  args: {
    bridgeExternalAccountId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("externalAccounts")
      .withIndex("by_bridge_external_account_id", (q) =>
        q.eq("bridgeExternalAccountId", args.bridgeExternalAccountId)
      )
      .first();

    if (!account) {
      throw new Error(`External account not found: ${args.bridgeExternalAccountId}`);
    }

    await ctx.db.patch(account._id, {
      userId: args.userId,
      updatedAt: Date.now(),
    });

    return account._id;
  },
});

// Get external account by Bridge ID
export const getByBridgeId = query({
  args: { bridgeExternalAccountId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("externalAccounts")
      .withIndex("by_bridge_external_account_id", (q) =>
        q.eq("bridgeExternalAccountId", args.bridgeExternalAccountId)
      )
      .first();
  },
});

// Get external accounts for current user
export const getForCurrentUser = query({
  args: {
    activeOnly: v.optional(v.boolean()),
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

    const accounts = await ctx.db
      .query("externalAccounts")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    if (args.activeOnly) {
      return accounts.filter((a) => a.active);
    }

    return accounts;
  },
});

// Get external accounts by Bridge customer ID
export const getByCustomerId = query({
  args: {
    bridgeCustomerId: v.string(),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("externalAccounts")
      .withIndex("by_bridge_customer_id", (q) =>
        q.eq("bridgeCustomerId", args.bridgeCustomerId)
      )
      .collect();

    if (args.activeOnly) {
      return accounts.filter((a) => a.active);
    }

    return accounts;
  },
});

// Get external accounts by type
export const getByType = query({
  args: {
    accountType: v.string(),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("externalAccounts")
      .withIndex("by_account_type", (q) => q.eq("accountType", args.accountType))
      .collect();

    if (args.activeOnly) {
      return accounts.filter((a) => a.active);
    }

    return accounts;
  },
});

// List all external accounts
export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = ctx.db.query("externalAccounts").order("desc");

    const accounts = args.limit
      ? await results.take(args.limit)
      : await results.collect();

    if (args.activeOnly) {
      return accounts.filter((a) => a.active);
    }

    return accounts;
  },
});

// Action: Create a US bank account via Bridge API
export const createUSAccount = action({
  args: {
    bridgeCustomerId: v.string(),
    bankName: v.string(),
    accountName: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    accountOwnerType: v.union(v.literal("individual"), v.literal("business")),
    accountOwnerName: v.string(),
    routingNumber: v.string(),
    accountNumber: v.string(),
    checkingOrSavings: v.union(v.literal("checking"), v.literal("savings")),
    address: v.object({
      streetLine1: v.string(),
      streetLine2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const idempotencyKey = `ea-us-${args.bridgeCustomerId}-${Date.now()}`;

    const requestBody = {
      currency: "usd",
      account_type: "us",
      bank_name: args.bankName,
      account_name: args.accountName,
      first_name: args.firstName,
      last_name: args.lastName,
      account_owner_type: args.accountOwnerType,
      account_owner_name: args.accountOwnerName,
      account: {
        routing_number: args.routingNumber,
        account_number: args.accountNumber,
        checking_or_savings: args.checkingOrSavings,
      },
      address: {
        street_line_1: args.address.streetLine1,
        street_line_2: args.address.streetLine2,
        city: args.address.city,
        state: args.address.state,
        postal_code: args.address.postalCode,
        country: args.address.country,
      },
    };

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/external_accounts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": bridgeApiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const transformed = transformBridgeExternalAccount(data);

    // Save to database
    await ctx.runMutation(api.bridgeExternalAccounts.upsert, transformed);

    return transformed;
  },
});

// Action: Create an IBAN (SEPA) account via Bridge API
export const createIBANAccount = action({
  args: {
    bridgeCustomerId: v.string(),
    bankName: v.string(),
    accountName: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    accountNumber: v.string(), // IBAN
    country: v.string(), // e.g., "IRL"
    bic: v.string(),
    address: v.object({
      streetLine1: v.string(),
      streetLine2: v.optional(v.string()),
      city: v.string(),
      postalCode: v.string(),
      country: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const idempotencyKey = `ea-iban-${args.bridgeCustomerId}-${Date.now()}`;

    const requestBody = {
      currency: "eur",
      account_type: "iban",
      bank_name: args.bankName,
      account_name: args.accountName,
      first_name: args.firstName,
      last_name: args.lastName,
      iban: {
        account_number: args.accountNumber,
        country: args.country,
        bic: args.bic,
      },
      address: {
        street_line_1: args.address.streetLine1,
        street_line_2: args.address.streetLine2,
        city: args.address.city,
        postal_code: args.address.postalCode,
        country: args.address.country,
      },
    };

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/external_accounts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": bridgeApiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const transformed = transformBridgeExternalAccount(data);

    await ctx.runMutation(api.bridgeExternalAccounts.upsert, transformed);

    return transformed;
  },
});

// Action: Create a CLABE (Mexico) account via Bridge API
export const createCLABEAccount = action({
  args: {
    bridgeCustomerId: v.string(),
    bankName: v.string(),
    accountName: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    accountOwnerType: v.union(v.literal("individual"), v.literal("business")),
    accountOwnerName: v.string(),
    accountNumber: v.string(), // 18-digit CLABE
    address: v.object({
      streetLine1: v.string(),
      streetLine2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const idempotencyKey = `ea-clabe-${args.bridgeCustomerId}-${Date.now()}`;

    const requestBody = {
      currency: "mxn",
      account_type: "clabe",
      bank_name: args.bankName,
      account_name: args.accountName,
      first_name: args.firstName,
      last_name: args.lastName,
      account_owner_type: args.accountOwnerType,
      account_owner_name: args.accountOwnerName,
      clabe: {
        account_number: args.accountNumber,
      },
      address: {
        street_line_1: args.address.streetLine1,
        street_line_2: args.address.streetLine2,
        city: args.address.city,
        state: args.address.state,
        postal_code: args.address.postalCode,
        country: args.address.country,
      },
    };

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/external_accounts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": bridgeApiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const transformed = transformBridgeExternalAccount(data);

    await ctx.runMutation(api.bridgeExternalAccounts.upsert, transformed);

    return transformed;
  },
});

// Action: Create a Pix account via Bridge API
export const createPixAccount = action({
  args: {
    bridgeCustomerId: v.string(),
    bankName: v.string(),
    accountOwnerName: v.string(),
    pixKey: v.string(),
    documentNumber: v.string(), // CPF (11 digits) or CNPJ (14 digits)
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const idempotencyKey = `ea-pix-${args.bridgeCustomerId}-${Date.now()}`;

    const requestBody = {
      currency: "brl",
      account_type: "pix",
      bank_name: args.bankName,
      account_owner_name: args.accountOwnerName,
      pix_key: {
        pix_key: args.pixKey,
        document_number: args.documentNumber,
      },
    };

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/external_accounts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": bridgeApiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const transformed = transformBridgeExternalAccount(data);

    await ctx.runMutation(api.bridgeExternalAccounts.upsert, transformed);

    return transformed;
  },
});

// Action: Create a GB (UK Faster Payments) account via Bridge API
export const createGBAccount = action({
  args: {
    bridgeCustomerId: v.string(),
    bankName: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    accountOwnerName: v.string(),
    sortCode: v.string(),
    accountNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const idempotencyKey = `ea-gb-${args.bridgeCustomerId}-${Date.now()}`;

    const requestBody = {
      currency: "gbp",
      account_type: "gb",
      bank_name: args.bankName,
      first_name: args.firstName,
      last_name: args.lastName,
      account_owner_name: args.accountOwnerName,
      account: {
        sort_code: args.sortCode,
        account_number: args.accountNumber,
      },
    };

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/external_accounts`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Api-Key": bridgeApiKey,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Bridge API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const transformed = transformBridgeExternalAccount(data);

    await ctx.runMutation(api.bridgeExternalAccounts.upsert, transformed);

    return transformed;
  },
});

// Action: Delete/deactivate an external account
export const deactivate = action({
  args: {
    bridgeCustomerId: v.string(),
    bridgeExternalAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/external_accounts/${args.bridgeExternalAccountId}`,
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

    // Update local record to inactive
    const existing = await ctx.runQuery(api.bridgeExternalAccounts.getByBridgeId, {
      bridgeExternalAccountId: args.bridgeExternalAccountId,
    });

    if (existing) {
      await ctx.runMutation(api.bridgeExternalAccounts.upsert, {
        ...existing,
        active: false,
        bridgeUpdatedAt: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});

// Action: Sync a single external account from Bridge API
export const syncFromBridge = action({
  args: {
    bridgeCustomerId: v.string(),
    bridgeExternalAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/external_accounts/${args.bridgeExternalAccountId}`,
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
    const transformed = transformBridgeExternalAccount(data);

    await ctx.runMutation(api.bridgeExternalAccounts.upsert, transformed);

    return transformed;
  },
});

// Action: Sync all external accounts for a customer from Bridge API
export const syncCustomerAccounts = action({
  args: { bridgeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl =
      process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    const response = await fetch(
      `${bridgeApiUrl}/customers/${args.bridgeCustomerId}/external_accounts`,
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
    const accounts = result.data || result || [];

    // Sync each account
    for (const account of accounts) {
      const transformed = transformBridgeExternalAccount(account);
      await ctx.runMutation(api.bridgeExternalAccounts.upsert, transformed);
    }

    return { synced: accounts.length };
  },
});
