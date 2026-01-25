import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

/**
 * Provision user resources after KYC approval.
 * Called from webhook processing when kyc_status becomes "approved".
 *
 * Steps:
 * 1. Create a Solana wallet for the user
 * 2. Link the wallet to the user
 * 3. Create a USD virtual account pointing to the wallet
 * 4. Link the virtual account to the user
 * 5. Update user verification status to "approved"
 */
// Define return type for the action
interface ProvisionResult {
  success: boolean;
  wallet: {
    id: string;
    address: string;
    chain: string;
  };
  virtualAccount: {
    id: string;
    currency: string;
  };
}

export const provisionUserResources = internalAction({
  args: {
    userId: v.id("users"),
    bridgeCustomerId: v.string(),
  },
  handler: async (ctx, args): Promise<ProvisionResult> => {
    console.log(
      `[Onboarding] Starting resource provisioning for user ${args.userId}`
    );

    try {
      // Step 1: Create Solana wallet for the user
      console.log(
        `[Onboarding] Creating Solana wallet for customer ${args.bridgeCustomerId}`
      );
      const wallet: any = await ctx.runAction(api.bridgeWallets.create, {
        bridgeCustomerId: args.bridgeCustomerId,
        chain: "solana",
      });
      console.log(
        `[Onboarding] Created wallet ${wallet.bridgeWalletId} with address ${wallet.address}`
      );

      // Step 2: Link wallet to user
      console.log(`[Onboarding] Linking wallet to user ${args.userId}`);
      await ctx.runMutation(api.bridgeWallets.linkToUser, {
        bridgeWalletId: wallet.bridgeWalletId,
        userId: args.userId,
      });

      // Step 3: Create USD virtual account pointing to the user's wallet
      console.log(
        `[Onboarding] Creating USD virtual account for customer ${args.bridgeCustomerId}`
      );
      const virtualAccount: any = await ctx.runAction(
        api.bridgeVirtualAccounts.createUSD,
        {
          customerId: args.bridgeCustomerId,
          destination: {
            paymentRail: "solana",
            currency: "usdc",
            bridgeWalletId: wallet.bridgeWalletId,
          },
        }
      );
      console.log(
        `[Onboarding] Created virtual account ${virtualAccount.id}`
      );

      // Step 4: Link virtual account to user
      console.log(`[Onboarding] Linking virtual account to user ${args.userId}`);
      await ctx.runMutation(api.bridgeVirtualAccounts.linkToUser, {
        bridgeVirtualAccountId: virtualAccount.id,
        userId: args.userId,
      });

      // Step 5: Update user verification status to approved
      console.log(`[Onboarding] Updating user verification status to approved`);
      await ctx.runMutation(api.users.updateVerificationStatus, {
        userId: args.userId,
        verificationStatus: "approved",
      });

      console.log(
        `[Onboarding] Successfully provisioned resources for user ${args.userId}`
      );

      return {
        success: true,
        wallet: {
          id: wallet.bridgeWalletId,
          address: wallet.address,
          chain: wallet.chain,
        },
        virtualAccount: {
          id: virtualAccount.id,
          currency: "usd",
        },
      };
    } catch (error) {
      console.error(`[Onboarding] Error provisioning resources:`, error);

      // Even if provisioning fails, we still have the approved KYC
      // Mark as approved but log the error for manual follow-up
      try {
        await ctx.runMutation(api.users.updateVerificationStatus, {
          userId: args.userId,
          verificationStatus: "approved",
        });
      } catch {
        // If this fails too, just log it
        console.error(
          `[Onboarding] Failed to update user status after provisioning error`
        );
      }

      throw error;
    }
  },
});
