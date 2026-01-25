"use client"

import * as React from "react"
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconLoader,
  IconLoader2,
  IconMenu2,
  IconRefresh,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { useQuery, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TransactionDetailSheet } from "@/components/transaction-detail-sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export type ActivityItem = {
  id: string
  type: "deposit" | "withdrawal" | "transfer" | "conversion"
  description: string
  amount: string
  rawAmount: number
  status: string
  sourceCurrency: string
  network: string
  destinationCurrency: string
  destinationAddress?: string
  txHash?: string
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
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const columns: ColumnDef<ActivityItem>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="rounded-full"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
        className="rounded-full"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
    enableHiding: false,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-center">Amount</div>,
    cell: ({ row }) => {
      const isPositive = row.original.rawAmount >= 0
      return (
        <div className={`text-center font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
          {row.original.amount}
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
        <Badge variant="outline" className="text-muted-foreground px-2 gap-1 capitalize">
          {iconMap[type]}
          {labelMap[type]}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      const isCompleted = status === "Completed"
      const isFailed = status === "Failed" || status === "Canceled"
      return (
        <Badge
          className={`px-2 gap-1 ${
            isCompleted
              ? "bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/20"
              : isFailed
              ? "bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/20"
              : "bg-orange-500/15 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20"
          }`}
        >
          {isCompleted ? (
            <IconCircleCheckFilled className="size-3" />
          ) : (
            <IconLoader className="size-3 animate-spin" />
          )}
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "network",
    header: () => <div className="text-center">Network</div>,
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground text-sm">
        {row.original.network}
      </div>
    ),
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

export function ActivityTable() {
  const activityData = useQuery(api.activity.getForCurrentUser, { limit: 100 })
  const syncActivity = useAction(api.activity.syncForCurrentUser)

  const [syncing, setSyncing] = React.useState(false)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [selectedTransaction, setSelectedTransaction] = React.useState<ActivityItem | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("all")

  const data = (activityData || []) as ActivityItem[]
  const isLoading = activityData === undefined

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncActivity()
    } catch (error) {
      console.error("Failed to sync activity:", error)
    } finally {
      setSyncing(false)
    }
  }

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <>
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        setActiveTab(value)
        if (value === "all") {
          table.getColumn("status")?.setFilterValue(undefined)
        } else {
          const filterMap: Record<string, string> = {
            completed: "Completed",
            pending: "Pending",
            failed: "Failed",
          }
          table.getColumn("status")?.setFilterValue(filterMap[value])
        }
      }}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value)
            if (value === "all") {
              table.getColumn("status")?.setFilterValue(undefined)
            } else {
              const filterMap: Record<string, string> = {
                completed: "Completed",
                pending: "Pending",
                failed: "Failed",
              }
              table.getColumn("status")?.setFilterValue(filterMap[value])
            }
          }}
        >
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSync}
            disabled={syncing}
          >
            <IconRefresh className={`size-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Refresh"}
          </Button>
        </div>
      </div>
      <div
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
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
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
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
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTransaction(row.original)
                      setSheetOpen(true)
                    }}
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
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <span>No activity yet</span>
                      <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                        <IconRefresh className={`size-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                        Sync from Bridge
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Tabs>

    {selectedTransaction && (
      <TransactionDetailSheet
        description={selectedTransaction.description}
        date={formatDate(selectedTransaction.date)}
        amount={selectedTransaction.amount}
        status={selectedTransaction.status}
        wallet={selectedTransaction.destinationAddress || selectedTransaction.network}
        type={selectedTransaction.type}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    )}
    </>
  )
}
