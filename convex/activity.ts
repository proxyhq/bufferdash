import { v } from "convex/values";
import { query, action } from "./_generated/server";
import { api } from "./_generated/api";

// Unified activity item type
export type ActivityType = "deposit" | "withdrawal" | "transfer" | "conversion";

// Get combined activity for current user (drains + transfers)
export const getForCurrentUser = query({
  args: {
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

    const limit = args.limit || 50;

    // Fetch drains (crypto deposits via liquidation addresses)
    const drains = await ctx.db
      .query("liquidationDrains")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    // Fetch transfers
    const transfers = await ctx.db
      .query("bridgeTransfers")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    // Transform drains to activity items
    const drainActivities = drains.map((drain) => ({
      id: drain._id,
      type: "deposit" as ActivityType,
      description: `${drain.currency.toUpperCase()} Deposit`,
      amount: `+$${parseFloat(drain.amount).toFixed(2)}`,
      rawAmount: parseFloat(drain.amount),
      status: mapDrainStatus(drain.state),
      sourceCurrency: drain.currency,
      network: formatNetwork(drain.sourcePaymentRail || "crypto"),
      destinationCurrency: drain.destination.currency,
      txHash: drain.depositTxHash,
      date: drain.bridgeCreatedAt,
      timestamp: new Date(drain.bridgeCreatedAt).getTime(),
    }));

    // Transform transfers to activity items
    const transferActivities = transfers.map((transfer) => {
      const isWithdrawal = transfer.source.paymentRail === "bridge_wallet";
      const isDeposit = transfer.destination.paymentRail === "bridge_wallet" ||
                        transfer.destination.bridgeWalletId;

      let type: ActivityType = "transfer";
      let description = "Transfer";
      let amountPrefix = "";

      if (isWithdrawal) {
        type = "withdrawal";
        description = `${transfer.destination.currency.toUpperCase()} Withdrawal`;
        amountPrefix = "-";
      } else if (isDeposit) {
        type = "deposit";
        description = `${transfer.source.currency.toUpperCase()} Deposit`;
        amountPrefix = "+";
      }

      const amount = transfer.amount ? parseFloat(transfer.amount) : 0;

      // For withdrawals, show destination rail. For deposits, show source rail.
      const network = isWithdrawal
        ? transfer.destination.paymentRail
        : transfer.source.paymentRail;

      return {
        id: transfer._id,
        type,
        description,
        amount: `${amountPrefix}$${amount.toFixed(2)}`,
        rawAmount: isWithdrawal ? -amount : amount,
        status: mapTransferStatus(transfer.state),
        sourceCurrency: isWithdrawal ? transfer.destination.currency : transfer.source.currency,
        network: formatNetwork(network),
        destinationCurrency: transfer.destination.currency,
        destinationAddress: transfer.destination.toAddress,
        txHash: transfer.receipt?.destinationTxHash,
        date: transfer.bridgeCreatedAt,
        timestamp: new Date(transfer.bridgeCreatedAt).getTime(),
      };
    });

    // Combine and sort by timestamp (newest first)
    const combined = [...drainActivities, ...transferActivities]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return combined;
  },
});

// Map drain states to user-friendly status
function mapDrainStatus(state: string): string {
  const statusMap: Record<string, string> = {
    in_review: "Pending",
    funds_received: "Processing",
    payment_submitted: "Processing",
    payment_processed: "Completed",
    canceled: "Canceled",
    error: "Failed",
  };
  return statusMap[state] || "Pending";
}

// Format network/payment rail for display
function formatNetwork(rail: string): string {
  const networkMap: Record<string, string> = {
    bridge_wallet: "Bridge",
    solana: "Solana",
    ethereum: "Ethereum",
    base: "Base",
    polygon: "Polygon",
    arbitrum: "Arbitrum",
    sepa: "SEPA",
    wire: "Wire",
    ach: "ACH",
    ach_push: "ACH",
    ach_same_day: "ACH",
    faster_payments: "Faster Payments",
    pix: "PIX",
    spei: "SPEI",
  };
  return networkMap[rail] || rail.toUpperCase();
}

// Map transfer states to user-friendly status
function mapTransferStatus(state: string): string {
  const statusMap: Record<string, string> = {
    awaiting_funds: "Awaiting Funds",
    in_review: "Pending",
    funds_received: "Processing",
    payment_submitted: "Processing",
    payment_processed: "Completed",
    canceled: "Canceled",
    returned: "Returned",
    refunded: "Refunded",
    error: "Failed",
    undeliverable: "Failed",
  };
  return statusMap[state] || "Pending";
}

// Sync all activity (drains + transfers) from Bridge API
export const syncForCurrentUser = action({
  args: {},
  handler: async (ctx): Promise<{ transfers: number; drains: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.runQuery(api.users.getUser, {
      clerkId: identity.subject,
    }) as { bridgeCustomerId?: string } | null;

    if (!user || !user.bridgeCustomerId) {
      throw new Error("User not found or not verified");
    }

    const bridgeApiKey = process.env.BRIDGE_API_KEY;
    const bridgeApiUrl = process.env.BRIDGE_API_URL || "https://api.bridge.xyz/v0";

    if (!bridgeApiKey) {
      throw new Error("Bridge API key not configured");
    }

    // Sync transfers directly
    const transfersResponse = await fetch(
      `${bridgeApiUrl}/transfers?on_behalf_of=${user.bridgeCustomerId}&limit=100`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Api-Key": bridgeApiKey,
        },
      }
    );

    let transfersSynced = 0;
    if (transfersResponse.ok) {
      const result = await transfersResponse.json();
      const transfers = result.data || result || [];
      transfersSynced = transfers.length;
    }

    // Sync drains directly
    const drainsResponse = await fetch(
      `${bridgeApiUrl}/liquidation_addresses/drains?limit=100`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Api-Key": bridgeApiKey,
        },
      }
    );

    let drainsSynced = 0;
    if (drainsResponse.ok) {
      const result = await drainsResponse.json();
      const drains = result.data || [];
      drainsSynced = drains.length;
    }

    return {
      transfers: transfersSynced,
      drains: drainsSynced,
    };
  },
});
