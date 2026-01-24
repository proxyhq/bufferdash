"use client"

import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconCreditCard,
  IconReceipt,
  IconWallet,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

const stats = [
  {
    label: "Total Spent",
    value: "$12,450.00",
    change: "+12.5%",
    trend: "up",
    icon: IconWallet,
  },
  {
    label: "Transactions",
    value: "156",
    change: "+8.2%",
    trend: "up",
    icon: IconReceipt,
  },
  {
    label: "Avg. Transaction",
    value: "$79.81",
    change: "-3.1%",
    trend: "down",
    icon: IconCreditCard,
  },
]

export function ReportsSummary() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Spending Overview</h2>
          <p className="text-sm text-muted-foreground">January 2025</p>
        </div>
        <Button variant="outline" size="sm">
          Export PDF
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-2 p-4 rounded-2xl border bg-card"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className="size-5 text-muted-foreground" />
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span
                className={`flex items-center text-xs font-medium ${
                  stat.trend === "up"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.trend === "up" ? (
                  <IconArrowUpRight className="size-3" />
                ) : (
                  <IconArrowDownRight className="size-3" />
                )}
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
