import { IconChevronRight, IconTarget, IconWallet } from "@tabler/icons-react"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2">
      {/* Balance Card */}
      <div className="w-full bg-card flex flex-col rounded-2xl overflow-hidden border min-h-[140px]">
        <div className="px-4 py-3 flex flex-row items-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconWallet className="size-4" />
            <span className="text-sm font-medium">User Balances</span>
          </div>
        </div>
        <div className="px-4 pb-3 mt-auto">
          <div className="text-2xl font-semibold">$0</div>
          <div className="text-sm text-muted-foreground">Across all wallets</div>
        </div>
      </div>

      {/* Intent Match Rate Card */}
      <div className="w-full bg-card flex flex-col rounded-2xl overflow-hidden border min-h-[140px]">
        <div className="px-4 py-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconTarget className="size-4" />
            <span className="text-sm font-medium">Intent Match Rate</span>
          </div>
          <a href="#">
            <button className="flex items-center cursor-pointer justify-center whitespace-nowrap font-medium transition-all h-6 px-2 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted/80 gap-0.5 pr-1">
              Intents
              <IconChevronRight className="size-4" />
            </button>
          </a>
        </div>
        <div className="px-4 pb-3 mt-auto">
          <div className="flex items-center gap-4">
            <div className="relative flex size-12 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  className="stroke-muted"
                  strokeWidth="3"
                />
              </svg>
              <span className="absolute text-xs font-medium text-muted-foreground">0%</span>
            </div>
            <div className="flex flex-col text-xs">
              <div className="text-muted-foreground">Matched: <span className="text-foreground font-medium">0</span></div>
              <div className="text-muted-foreground">Mismatched: <span className="text-foreground font-medium">0</span></div>
              <div className="text-muted-foreground">Pending: <span className="text-foreground font-medium">0</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
