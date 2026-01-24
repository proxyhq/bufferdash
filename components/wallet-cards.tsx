"use client"

import { IconArrowsExchange, IconPlus, IconSend } from "@tabler/icons-react"
import { FundModal } from "@/components/fund-modal"

export function WalletCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-3">
      {/* USD Balance Card */}
      <div className="w-full bg-card flex flex-col rounded-2xl overflow-hidden border min-h-[140px]">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>🇺🇸</span>
            <span className="text-sm font-medium">USD Balance</span>
          </div>
        </div>
        <div className="px-4">
          <div className="text-2xl font-semibold">$0</div>
        </div>
        <div className="px-4 pb-3 pt-3 mt-auto flex gap-2">
          <FundModal currency="USD" flag="🇺🇸">
            <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-7 px-3 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
              <IconPlus className="size-3" />
              Fund
            </button>
          </FundModal>
          <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-7 px-3 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
            <IconArrowsExchange className="size-3" />
            Convert
          </button>
          <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-7 px-3 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
            <IconSend className="size-3" />
            Send
          </button>
        </div>
      </div>

      {/* GBP Balance Card */}
      <div className="w-full bg-card flex flex-col rounded-2xl overflow-hidden border min-h-[140px]">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>🇬🇧</span>
            <span className="text-sm font-medium">GBP Balance</span>
          </div>
        </div>
        <div className="px-4">
          <div className="text-2xl font-semibold">£0</div>
        </div>
        <div className="px-4 pb-3 pt-3 mt-auto flex gap-2">
          <FundModal currency="GBP" flag="🇬🇧">
            <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-7 px-3 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
              <IconPlus className="size-3" />
              Fund
            </button>
          </FundModal>
          <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-7 px-3 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
            <IconArrowsExchange className="size-3" />
            Convert
          </button>
          <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-7 px-3 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
            <IconSend className="size-3" />
            Send
          </button>
        </div>
      </div>

      {/* EUR Balance Card */}
      <div className="w-full bg-card flex flex-col rounded-2xl overflow-hidden border min-h-[140px]">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>🇪🇺</span>
            <span className="text-sm font-medium">EUR Balance</span>
          </div>
        </div>
        <div className="px-4">
          <div className="text-2xl font-semibold">€0</div>
        </div>
        <div className="px-4 pb-3 pt-3 mt-auto flex gap-2">
          <FundModal currency="EUR" flag="🇪🇺">
            <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-7 px-3 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
              <IconPlus className="size-3" />
              Fund
            </button>
          </FundModal>
          <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-7 px-3 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
            <IconArrowsExchange className="size-3" />
            Convert
          </button>
          <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-7 px-3 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-1">
            <IconSend className="size-3" />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
