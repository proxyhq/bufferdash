"use client"

import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconBuildingBank,
  IconBuildingStore,
  IconChevronRight,
  IconCoin,
  IconCreditCard,
  IconHistory,
  IconRefresh,
} from "@tabler/icons-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface TransactionDetailProps {
  description: string
  date: string
  amount: string
  status: string
  wallet: string
  type: "Card Spend" | "Deposit" | "Withdrawal" | "Fees" | "Refund" | "deposit" | "withdrawal" | "transfer" | "conversion"
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const typeIcons: Record<string, typeof IconCreditCard> = {
  "Card Spend": IconCreditCard,
  "Deposit": IconArrowDownLeft,
  "Withdrawal": IconArrowUpRight,
  "Fees": IconCoin,
  "Refund": IconBuildingBank,
  // Lowercase activity types
  "deposit": IconArrowDownLeft,
  "withdrawal": IconArrowUpRight,
  "transfer": IconArrowUpRight,
  "conversion": IconRefresh,
}

const typeLabels: Record<string, string> = {
  "deposit": "Deposit",
  "withdrawal": "Withdrawal",
  "transfer": "Transfer",
  "conversion": "Conversion",
}

export function TransactionDetailSheet({
  description,
  date,
  amount,
  status,
  wallet,
  type,
  children,
  open,
  onOpenChange,
}: TransactionDetailProps) {
  const TypeIcon = typeIcons[type] || IconCoin
  const displayType = typeLabels[type] || type

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent className="w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="sr-only">
          <SheetTitle>Transaction Details</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center pt-4 pb-4">
          {/* Type Icon */}
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <TypeIcon className="size-8" />
          </div>

          {/* Description */}
          <h2 className="text-xl font-semibold">{description}</h2>

          {/* Date */}
          <p className="text-sm text-muted-foreground mt-1">{date}</p>

          {/* Amount */}
          <p className="text-3xl font-semibold mt-2">{amount}</p>
        </div>

        <div className="flex flex-col gap-3 px-1">
          {/* Status, Type & Wallet Card */}
          <div className="rounded-2xl bg-muted/50 p-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Status</span>
              <span className="text-sm text-muted-foreground">{status}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Type</span>
              <span className="text-sm text-muted-foreground">{displayType}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Wallet</span>
              <span className="text-sm text-muted-foreground">{wallet}</span>
            </div>
          </div>

          {/* Address Card */}
          <div className="rounded-2xl bg-muted/50 p-4">
            <p className="font-medium">Billing Address</p>
            <p className="text-sm text-muted-foreground mt-1">123 Main Street</p>
            <p className="text-sm text-muted-foreground">New York, NY 10001 US</p>
          </div>

          {/* Contact Business Button */}
          <button className="flex items-center justify-between rounded-2xl bg-muted/50 p-4 w-full text-left hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <IconBuildingStore className="size-5 text-muted-foreground" />
              <span className="font-medium">Contact business</span>
            </div>
            <IconChevronRight className="size-5 text-muted-foreground" />
          </button>

          {/* History Button */}
          <button className="flex items-center justify-between rounded-2xl bg-muted/50 p-4 w-full text-left hover:bg-muted transition-colors">
            <div className="flex items-center gap-3">
              <IconHistory className="size-5 text-muted-foreground" />
              <span className="font-medium">History</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">1 transaction</span>
              <IconChevronRight className="size-5 text-muted-foreground" />
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
