"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconArrowDownLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ActivityItem = {
  id: string
  type: "deposit" | "withdrawal" | "transfer" | "conversion"
  description: string
  amount: string
  rawAmount: number
  status: string
  sourceCurrency: string
  network: string
  destinationCurrency: string
  date: string
  timestamp: number
}

// Get currency icon (returns image path or emoji)
function getCurrencyIcon(currency: string): { type: "image" | "emoji"; value: string } {
  const icons: Record<string, { type: "image" | "emoji"; value: string }> = {
    usdc: { type: "image", value: "/usdc.svg" },
    usdb: { type: "image", value: "/usdc.svg" },
    usdt: { type: "image", value: "/usdt.svg" },
    usd: { type: "emoji", value: "🇺🇸" },
    gbp: { type: "emoji", value: "🇬🇧" },
    eur: { type: "emoji", value: "🇪🇺" },
  }
  return icons[currency.toLowerCase()] || { type: "image", value: "/usdc.svg" }
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return "Today"
  } else if (diffDays === 1) {
    return "Yesterday"
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }
}

const columns: ColumnDef<ActivityItem>[] = [
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const currency = row.original.sourceCurrency
      const icon = getCurrencyIcon(currency)
      return (
        <div className="flex items-center gap-3">
          {icon.type === "emoji" ? (
            <span className="text-xl">{icon.value}</span>
          ) : (
            <img src={icon.value} alt={currency} className="size-6" />
          )}
          <span className="font-medium">{row.original.description}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type
      const iconMap: Record<string, React.ReactNode> = {
        deposit: <IconArrowDownLeft className="size-3" />,
        withdrawal: <IconArrowUpRight className="size-3" />,
        transfer: <IconArrowUpRight className="size-3" />,
        conversion: <IconRefresh className="size-3" />,
      }
      const labelMap: Record<string, string> = {
        deposit: "Deposit",
        withdrawal: "Withdrawal",
        transfer: "Transfer",
        conversion: "Conversion",
      }
      return (
        <Badge variant="outline" className="text-muted-foreground px-2 gap-1">
          {iconMap[type]}
          {labelMap[type]}
        </Badge>
      )
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const isPositive = row.original.rawAmount >= 0
      return (
        <div className={`text-right font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {row.original.amount}
        </div>
      )
    },
  },
  {
    accessorKey: "date",
    header: () => <div className="text-right">Date</div>,
    cell: ({ row }) => (
      <div className="text-muted-foreground text-sm text-right">
        {formatDate(row.original.date)}
      </div>
    ),
  },
]

export function RecentActivity() {
  const activityData = useQuery(api.activity.getForCurrentUser, { limit: 5 })
  const data = (activityData || []) as ActivityItem[]
  const isLoading = activityData === undefined

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <Link
          href="/activity"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
          <IconArrowRight className="size-4" />
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <IconLoader2 className="size-5 animate-spin" />
                    Loading activity...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No recent activity.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
