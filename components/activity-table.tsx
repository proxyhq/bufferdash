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
  IconCoin,
  IconCreditCard,
  IconLoader,
  IconMenu2,
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
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export const activitySchema = z.object({
  id: z.number(),
  type: z.enum(["Card Spend", "Deposit", "Withdrawal", "Fees", "Refund"]),
  description: z.string(),
  status: z.string(),
  amount: z.string(),
  wallet: z.string(),
  agent: z.string(),
  date: z.string(),
})

export type ActivityItem = z.infer<typeof activitySchema>



// Color map for agent avatars
const agentColors: Record<string, string> = {
  "Agent-01": "bg-gradient-to-br from-orange-400 to-pink-500",
  "Agent-02": "bg-gradient-to-br from-blue-400 to-purple-500",
  "Agent-03": "bg-gradient-to-br from-green-400 to-teal-500",
  "-": "bg-muted",
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
      const description = row.original.description
      const isUSDC = description.toLowerCase().includes("usdc")
      const isUSDT = description.toLowerCase().includes("usdt")
      const isBankTransfer = description.toLowerCase().includes("bank transfer") ||
                             description.toLowerCase().includes("payroll")

      return (
        <div className="flex items-center gap-3">
          {isUSDC ? (
            <img src="/usdc.svg" alt="USDC" className="size-6" />
          ) : isUSDT ? (
            <img src="/usdt.svg" alt="USDT" className="size-6" />
          ) : isBankTransfer ? (
            <span className="text-xl">🇺🇸</span>
          ) : (
            <div className={`size-6 rounded-full ${agentColors[row.original.agent] || "bg-muted"}`} />
          )}
          <span className="font-medium">{description}</span>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-center">Amount</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.original.amount}</div>
    ),
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        className={`px-2 gap-1 ${
          row.original.status === "Completed"
            ? "bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/20"
            : "bg-orange-500/15 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20"
        }`}
      >
        {row.original.status === "Completed" ? (
          <IconCircleCheckFilled className="size-3" />
        ) : (
          <IconLoader className="size-3 animate-spin" />
        )}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "agent",
    header: () => <div className="text-center">Agent</div>,
    cell: ({ row }) => <div className="text-center">{row.original.agent}</div>,
  },
  {
    accessorKey: "date",
    header: () => <div className="text-right">Date</div>,
    cell: ({ row }) => (
      <div className="text-muted-foreground text-sm text-right">{row.original.date}</div>
    ),
  },
]

export function ActivityTable({ data: initialData }: { data: ActivityItem[] }) {
  const [data] = React.useState(() => initialData)
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
    getRowId: (row) => row.id.toString(),
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
      defaultValue="all"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select
          defaultValue="all"
          onValueChange={(value) => {
            if (value === "all") {
              table.getColumn("status")?.setFilterValue(undefined)
            } else {
              table.getColumn("status")?.setFilterValue(value)
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
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="all" onClick={() => table.getColumn("status")?.setFilterValue(undefined)}>All Activity</TabsTrigger>
          <TabsTrigger value="completed" onClick={() => table.getColumn("status")?.setFilterValue("Completed")}>Completed</TabsTrigger>
          <TabsTrigger value="pending" onClick={() => table.getColumn("status")?.setFilterValue("Pending")}>Pending</TabsTrigger>
          <TabsTrigger value="failed" onClick={() => table.getColumn("status")?.setFilterValue("Failed")}>Failed</TabsTrigger>
        </TabsList>
        <Button variant="outline" size="icon" className="size-8 rounded-full">
          <IconMenu2 className="size-4" />
        </Button>
      </div>
      <TabsContent
        value="all"
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
              {table.getRowModel().rows?.length ? (
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
                    No results.
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
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>

    {selectedTransaction && (
      <TransactionDetailSheet
        description={selectedTransaction.description}
        date={selectedTransaction.date}
        amount={selectedTransaction.amount}
        status={selectedTransaction.status}
        wallet={selectedTransaction.wallet}
        type={selectedTransaction.type}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    )}
    </>
  )
}
