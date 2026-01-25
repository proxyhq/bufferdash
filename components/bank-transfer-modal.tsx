"use client"

import { IconCopy, IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BankTransferModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string
  flag: string
}

function CopyButton({ value }: { value: string }) {
  const copy = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toast.success("Copied to clipboard")
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = value
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      toast.success("Copied to clipboard")
    }
  }

  return (
    <button
      onClick={copy}
      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
    >
      <IconCopy className="size-5" />
    </button>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-2xl">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <span className="font-semibold">{value}</span>
        <CopyButton value={value} />
      </div>
    </div>
  )
}

function AccountNameRow({ value }: { value: string }) {
  return (
    <div className="p-4 bg-muted/50 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground text-sm">Account Name</span>
        <CopyButton value={value} />
      </div>
      <span className="font-semibold text-lg">{value}</span>
    </div>
  )
}

export function BankTransferModal({ open, onOpenChange, currency, flag }: BankTransferModalProps) {
  // Get user's virtual accounts from Convex
  const virtualAccounts = useQuery(api.bridgeVirtualAccounts.getForCurrentUser)

  const isLoading = virtualAccounts === undefined

  // Find the virtual account for the selected currency
  const account = virtualAccounts?.find(
    (va) => va.sourceCurrency.toLowerCase() === currency.toLowerCase()
  )

  const instructions = account?.sourceDepositInstructions

  // Get the message based on currency
  const getMessage = () => {
    switch (currency) {
      case "USD":
        return "USD deposits are automatically converted to USDC in your wallet."
      case "GBP":
        return "GBP deposits are automatically converted to USDC in your wallet."
      case "EUR":
        return "EUR deposits are automatically converted to USDC in your wallet."
      default:
        return "Deposits are automatically converted to USDC in your wallet."
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-6">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            Receive
            <span>{flag}</span>
            {currency}
          </DialogTitle>
          <DialogDescription>
            Bank Transfer
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-3">Loading account details...</p>
          </div>
        ) : !account ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="text-5xl mb-4">🏦</div>
            <h3 className="font-semibold text-lg mb-2">No {currency} Account</h3>
            <p className="text-sm text-muted-foreground text-center max-w-[260px]">
              Create a {currency} account from your wallet to receive bank transfers in {currency === "USD" ? "US Dollars" : currency === "GBP" ? "British Pounds" : "Euros"}.
            </p>
            <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span>🔄</span>
                <span>Auto-convert</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>💸</span>
                <span>Low fees</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>🏃</span>
                <span>Fast</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {instructions?.bankBeneficiaryName && (
              <AccountNameRow value={instructions.bankBeneficiaryName} />
            )}

            {/* USD - ACH/Wire */}
            {currency === "USD" && (
              <>
                {instructions?.bankRoutingNumber && (
                  <DetailRow label="Routing Number" value={instructions.bankRoutingNumber} />
                )}
                {instructions?.bankAccountNumber && (
                  <DetailRow label="Account Number" value={instructions.bankAccountNumber} />
                )}
              </>
            )}

            {/* GBP - Faster Payments */}
            {currency === "GBP" && (
              <>
                {instructions?.sortCode && (
                  <DetailRow label="Sort Code" value={instructions.sortCode} />
                )}
                {instructions?.accountNumber && (
                  <DetailRow label="Account Number" value={instructions.accountNumber} />
                )}
              </>
            )}

            {/* EUR - SEPA */}
            {currency === "EUR" && (
              <>
                {instructions?.iban && (
                  <DetailRow label="IBAN" value={instructions.iban} />
                )}
                {instructions?.bic && (
                  <DetailRow label="BIC" value={instructions.bic} />
                )}
              </>
            )}

            {instructions?.bankName && (
              <DetailRow label="Bank Name" value={instructions.bankName} />
            )}

            <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-200 text-sm text-center p-4 rounded-2xl mt-1">
              {getMessage()}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
