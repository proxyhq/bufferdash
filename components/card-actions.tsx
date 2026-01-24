"use client"

import {
  IconSnowflake,
  IconLock,
  IconSettings,
  IconPlus,
  IconArrowsExchange,
  IconReceipt,
} from "@tabler/icons-react"

const actions = [
  {
    icon: IconSnowflake,
    label: "Freeze Card",
    description: "Temporarily disable",
  },
  {
    icon: IconLock,
    label: "PIN & Security",
    description: "Change PIN",
  },
  {
    icon: IconArrowsExchange,
    label: "Limits",
    description: "Spending limits",
  },
  {
    icon: IconReceipt,
    label: "Statements",
    description: "Download PDF",
  },
  {
    icon: IconSettings,
    label: "Settings",
    description: "Card preferences",
  },
  {
    icon: IconPlus,
    label: "New Card",
    description: "Request card",
  },
]

export function CardActions() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/40 hover:bg-muted transition-colors cursor-pointer group"
        >
          <div className="size-12 rounded-full bg-background flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <action.icon className="size-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <div className="text-center">
            <div className="text-xs font-medium">{action.label}</div>
          </div>
        </button>
      ))}
    </div>
  )
}
