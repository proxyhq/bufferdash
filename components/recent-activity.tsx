"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconArrowDownLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconCreditCard,
  IconCoin,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const recentActivitySchema = z.object({
  id: z.number(),
  description: z.string(),
  type: z.enum(["Card Spend", "Deposit", "Withdrawal", "Fees", "Refund"]),
  amount: z.string(),
  date: z.string(),
})

export type RecentActivityItem = z.infer<typeof recentActivitySchema>

const recentData: RecentActivityItem[] = [
  {
    id: 1,
    description: "Spotify",
    type: "Card Spend",
    amount: "-$9.99",
    date: "Today",
  },
  {
    id: 2,
    description: "USDC Deposit",
    type: "Deposit",
    amount: "+$500.00",
    date: "Yesterday",
  },
  {
    id: 3,
    description: "Amazon",
    type: "Card Spend",
    amount: "-$67.89",
    date: "Jan 22",
  },
  {
    id: 4,
    description: "Bank Transfer",
    type: "Deposit",
    amount: "+$1,200.00",
    date: "Jan 21",
  },
  {
    id: 5,
    description: "Uber",
    type: "Card Spend",
    amount: "-$24.50",
    date: "Jan 20",
  },
]

const agentColors: Record<string, string> = {
  "Spotify": "bg-gradient-to-br from-green-400 to-green-600",
  "Amazon": "bg-gradient-to-br from-orange-400 to-orange-600",
  "Uber": "bg-gradient-to-br from-black to-zinc-700",
  "Netflix": "bg-gradient-to-br from-red-500 to-red-700",
}

const columns: ColumnDef<RecentActivityItem>[] = [
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.original.description
      const isUSDC = description.toLowerCase().includes("usdc")
      const isUSDT = description.toLowerCase().includes("usdt")
      const isBankTransfer = description.toLowerCase().includes("bank transfer")

      return (
        <div className="flex items-center gap-3">
          {isUSDC ? (
            <img src="/usdc.svg" alt="USDC" className="size-6" />
          ) : isUSDT ? (
            <img src="/usdt.svg" alt="USDT" className="size-6" />
          ) : isBankTransfer ? (
            <span className="text-xl">🇺🇸</span>
          ) : (
            <div className={`size-6 rounded-full ${agentColors[description] || "bg-gradient-to-br from-zinc-400 to-zinc-600"}`} />
          )}
          <span className="font-medium">{description}</span>
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
        "Card Spend": <IconCreditCard className="size-3" />,
        "Deposit": <IconArrowDownLeft className="size-3" />,
        "Withdrawal": <IconArrowUpRight className="size-3" />,
        "Fees": <IconCoin className="size-3" />,
        "Refund": <IconArrowDownLeft className="size-3" />,
      }
      return (
        <Badge variant="outline" className="text-muted-foreground px-2 gap-1">
          {iconMap[type]}
          {type}
        </Badge>
      )
    },
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">{row.original.amount}</div>
    ),
  },
  {
    accessorKey: "date",
    header: () => <div className="text-right">Date</div>,
    cell: ({ row }) => (
      <div className="text-muted-foreground text-sm text-right">{row.original.date}</div>
    ),
  },
]

export function RecentActivity() {
  const table = useReactTable({
    data: recentData,
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
            {table.getRowModel().rows?.length ? (
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
