"use client"

import { IconCopy } from "@tabler/icons-react"
import { toast } from "sonner"

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

const bankDetails = {
  USD: {
    accountName: "LYZBETH OWUSU QUARSHIE",
    routingNumber: "101019644",
    accountNumber: "218562378764",
    bankName: "Lead Bank",
    message: "USD deposits are automatically converted to digital dollars in your wallet.",
  },
  GBP: {
    accountName: "LYZBETH OWUSU QUARSHIE",
    sortCode: "04-00-75",
    accountNumber: "31510604",
    bankName: "Modulr",
    message: "GBP deposits are automatically converted to digital pounds in your wallet.",
  },
  EUR: {
    accountName: "LYZBETH OWUSU QUARSHIE",
    iban: "DE89370400440532013000",
    bic: "COBADEFFXXX",
    bankName: "Modulr",
    message: "EUR deposits are automatically converted to digital euros in your wallet.",
  },
}

function CopyButton({ value }: { value: string }) {
  const copy = () => {
    navigator.clipboard.writeText(value)
    toast.success("Copied to clipboard")
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
  const details = bankDetails[currency as keyof typeof bankDetails] || bankDetails.USD

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

        <div className="flex flex-col gap-3">
          <AccountNameRow value={details.accountName} />

          {currency === "USD" && (
            <>
              <DetailRow label="Routing Number" value={details.routingNumber!} />
              <DetailRow label="Account Number" value={details.accountNumber} />
            </>
          )}

          {currency === "GBP" && (
            <>
              <DetailRow label="Sort Code" value={(details as typeof bankDetails.GBP).sortCode} />
              <DetailRow label="Account Number" value={details.accountNumber} />
            </>
          )}

          {currency === "EUR" && (
            <>
              <DetailRow label="IBAN" value={(details as typeof bankDetails.EUR).iban} />
              <DetailRow label="BIC" value={(details as typeof bankDetails.EUR).bic} />
            </>
          )}

          <DetailRow label="Bank Name" value={details.bankName} />

          <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-200 text-sm text-center p-4 rounded-2xl mt-1">
            {details.message}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
