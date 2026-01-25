"use client"

import { useState, useEffect } from "react"
import { useQuery, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  IconArrowsExchange,
  IconPlus,
  IconSend,
  IconCirclePlus,
  IconLoader2,
} from "@tabler/icons-react"
import { FundModal } from "@/components/fund-modal"
import { SendModal } from "@/components/send-modal"

// Format balance for display (Bridge API returns already-formatted decimal strings like "13.37")
function formatBalance(balance: string | number): string {
  const num = typeof balance === "string" ? parseFloat(balance) : balance
  if (isNaN(num)) return "0.00"
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Get USD stablecoin balance from wallet balances array
// Checks for both USDC and USDB (Bridge's USD stablecoin)
function getUsdBalance(
  balances: Array<{ balance: string; currency: string }> | undefined
): string {
  if (!balances) return "0.00"

  // Sum up all USD stablecoins (usdc + usdb)
  let total = 0
  for (const b of balances) {
    const currency = b.currency.toLowerCase()
    if (currency === "usdc" || currency === "usdb") {
      total += parseFloat(b.balance) || 0
    }
  }

  return formatBalance(total)
}

export function WalletCards() {
  const wallets = useQuery(api.bridgeWallets.getForCurrentUser)
  const virtualAccounts = useQuery(api.bridgeVirtualAccounts.getForCurrentUser)
  const currentUser = useQuery(api.users.getCurrentUser)
  const createGBP = useAction(api.bridgeVirtualAccounts.createGBP)
  const createEUR = useAction(api.bridgeVirtualAccounts.createEUR)
  const fetchLiveBalance = useAction(api.bridgeWallets.fetchLiveBalanceForCurrentUser)

  const [creatingGBP, setCreatingGBP] = useState(false)
  const [creatingEUR, setCreatingEUR] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isVerified = currentUser?.verificationStatus === "approved"

  // Fetch live balance from Bridge API on mount
  useEffect(() => {
    if (isVerified) {
      fetchLiveBalance().catch(console.error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVerified])

  const isLoading =
    wallets === undefined ||
    virtualAccounts === undefined ||
    currentUser === undefined

  // Find USD virtual account
  const usdAccount = virtualAccounts?.find(
    (va) => va.sourceCurrency.toLowerCase() === "usd"
  )
  // Find GBP virtual account
  const gbpAccount = virtualAccounts?.find(
    (va) => va.sourceCurrency.toLowerCase() === "gbp"
  )
  // Find EUR virtual account
  const eurAccount = virtualAccounts?.find(
    (va) => va.sourceCurrency.toLowerCase() === "eur"
  )

  // Get user's primary wallet (first Solana wallet with a userId linked)
  const primaryWallet = wallets?.find((w) => w.chain === "solana" && w.userId)
  const usdBalance = getUsdBalance(primaryWallet?.balances)

  // Handler to create GBP virtual account
  const handleCreateGBP = async () => {
    if (!currentUser?.bridgeCustomerId || !primaryWallet) {
      setError("Missing customer ID or wallet")
      return
    }

    setCreatingGBP(true)
    setError(null)
    try {
      await createGBP({
        customerId: currentUser.bridgeCustomerId,
        destination: {
          paymentRail: "solana",
          currency: "usdc",
          bridgeWalletId: primaryWallet.bridgeWalletId,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create GBP account")
    } finally {
      setCreatingGBP(false)
    }
  }

  // Handler to create EUR virtual account
  const handleCreateEUR = async () => {
    if (!currentUser?.bridgeCustomerId || !primaryWallet) {
      setError("Missing customer ID or wallet")
      return
    }

    setCreatingEUR(true)
    setError(null)
    try {
      await createEUR({
        customerId: currentUser.bridgeCustomerId,
        destination: {
          paymentRail: "solana",
          currency: "usdc",
          bridgeWalletId: primaryWallet.bridgeWalletId,
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create EUR account")
    } finally {
      setCreatingEUR(false)
    }
  }

  // If not verified, show placeholder cards
  if (!isVerified && !isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3">
        <PlaceholderCard currency="USD" flag="🇺🇸" symbol="$" />
        <PlaceholderCard currency="GBP" flag="🇬🇧" symbol="£" />
        <PlaceholderCard currency="EUR" flag="🇪🇺" symbol="€" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3">
      {/* USD Balance Card - Always active after verification */}
      <ActiveWalletCard
        currency="USD"
        flag="🇺🇸"
        symbol="$"
        balance={usdBalance}
        isLoading={isLoading}
        hasAccount={!!usdAccount}
      />

      {/* GBP Balance Card - Empty state if no account */}
      {gbpAccount ? (
        <ActiveWalletCard
          currency="GBP"
          flag="🇬🇧"
          symbol="£"
          balance="0.00"
          isLoading={isLoading}
          hasAccount={true}
        />
      ) : (
        <EmptyAccountCard
          currency="GBP"
          flag="🇬🇧"
          isLoading={isLoading}
          isCreating={creatingGBP}
          onCreate={handleCreateGBP}
          error={error}
        />
      )}

      {/* EUR Balance Card - Empty state if no account */}
      {eurAccount ? (
        <ActiveWalletCard
          currency="EUR"
          flag="🇪🇺"
          symbol="€"
          balance="0.00"
          isLoading={isLoading}
          hasAccount={true}
        />
      ) : (
        <EmptyAccountCard
          currency="EUR"
          flag="🇪🇺"
          isLoading={isLoading}
          isCreating={creatingEUR}
          onCreate={handleCreateEUR}
          error={error}
        />
      )}
    </div>
  )
}

// Active wallet card with balance and actions
function ActiveWalletCard({
  currency,
  flag,
  symbol,
  balance,
  isLoading,
  hasAccount,
}: {
  currency: string
  flag: string
  symbol: string
  balance: string
  isLoading: boolean
  hasAccount: boolean
}) {
  return (
    <div className="w-full bg-card flex flex-col rounded-2xl overflow-hidden border min-h-[140px]">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{flag}</span>
          <span className="text-sm font-medium">{currency} Balance</span>
        </div>
      </div>
      <div className="px-4">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="text-2xl font-semibold">
            {symbol}
            {balance}
          </div>
        )}
      </div>
      <div className="px-4 pb-3 pt-3 mt-auto flex gap-2">
        <FundModal currency={currency} flag={flag}>
          <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-7 px-3 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
            <IconPlus className="size-3" />
            Fund
          </button>
        </FundModal>
        <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-7 px-3 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
          <IconArrowsExchange className="size-3" />
          Convert
        </button>
        <SendModal>
          <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-7 px-3 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
            <IconSend className="size-3" />
            Send
          </button>
        </SendModal>
      </div>
    </div>
  )
}

// Empty state card for currencies without accounts
function EmptyAccountCard({
  currency,
  flag,
  isLoading,
  isCreating,
  onCreate,
  error,
}: {
  currency: string
  flag: string
  isLoading: boolean
  isCreating: boolean
  onCreate: () => void
  error: string | null
}) {
  return (
    <div className="w-full bg-card flex flex-col rounded-2xl overflow-hidden border min-h-[140px] border-dashed">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{flag}</span>
          <span className="text-sm font-medium">{currency} Account</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        {isLoading ? (
          <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Receive {currency} via bank transfer
            </p>
            <button
              onClick={onCreate}
              disabled={isCreating}
              className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-8 px-4 text-xs rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <IconLoader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <IconCirclePlus className="size-4" />
                  Create {currency} Account
                </>
              )}
            </button>
            {error && (
              <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Placeholder card for unverified users
function PlaceholderCard({
  currency,
  flag,
  symbol,
}: {
  currency: string
  flag: string
  symbol: string
}) {
  return (
    <div className="w-full bg-card flex flex-col rounded-2xl overflow-hidden border min-h-[140px] opacity-60">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>{flag}</span>
          <span className="text-sm font-medium">{currency} Balance</span>
        </div>
      </div>
      <div className="px-4">
        <div className="text-2xl font-semibold text-muted-foreground">
          {symbol}--
        </div>
      </div>
      <div className="px-4 pb-3 pt-3 mt-auto">
        <p className="text-xs text-muted-foreground">
          Complete verification to unlock
        </p>
      </div>
    </div>
  )
}
