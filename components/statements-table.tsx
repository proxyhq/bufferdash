"use client"

import * as React from "react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDownload,
} from "@tabler/icons-react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { z } from "zod"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const statementSchema = z.object({
  id: z.number(),
  period: z.string(),
  type: z.string(),
  transactions: z.number(),
  totalSpent: z.string(),
  date: z.string(),
})

export type Statement = z.infer<typeof statementSchema>

const statementsData: Statement[] = [
  {
    id: 1,
    period: "January 2025",
    type: "Monthly",
    transactions: 156,
    totalSpent: "$12,450.00",
    date: "Jan 31, 2025",
  },
  {
    id: 2,
    period: "December 2024",
    type: "Monthly",
    transactions: 189,
    totalSpent: "$14,200.00",
    date: "Dec 31, 2024",
  },
  {
    id: 3,
    period: "November 2024",
    type: "Monthly",
    transactions: 142,
    totalSpent: "$11,800.00",
    date: "Nov 30, 2024",
  },
  {
    id: 4,
    period: "October 2024",
    type: "Monthly",
    transactions: 128,
    totalSpent: "$9,100.00",
    date: "Oct 31, 2024",
  },
  {
    id: 5,
    period: "September 2024",
    type: "Monthly",
    transactions: 135,
    totalSpent: "$10,200.00",
    date: "Sep 30, 2024",
  },
  {
    id: 6,
    period: "Q4 2024",
    type: "Quarterly",
    transactions: 459,
    totalSpent: "$35,100.00",
    date: "Dec 31, 2024",
  },
  {
    id: 7,
    period: "Q3 2024",
    type: "Quarterly",
    transactions: 412,
    totalSpent: "$28,900.00",
    date: "Sep 30, 2024",
  },
]

const columns: ColumnDef<Statement>[] = [
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
    accessorKey: "period",
    header: "Period",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <div>
            <span className="font-medium">{row.original.period}</span>
            <span className="text-muted-foreground text-xs block">{row.original.type}</span>
          </div>
        </div>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "transactions",
    header: () => <div className="text-center">Transactions</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.original.transactions}</div>
    ),
  },
  {
    accessorKey: "totalSpent",
    header: () => <div className="text-center">Total Spent</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.original.totalSpent}</div>
    ),
  },
  {
    accessorKey: "date",
    header: () => <div className="text-right">Date</div>,
    cell: ({ row }) => (
      <div className="text-muted-foreground text-sm text-right">{row.original.date}</div>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <Button variant="ghost" size="icon" className="size-8">
        <IconDownload className="size-4" />
      </Button>
    ),
  },
]

export function StatementsTable() {
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 5,
  })

  const table = useReactTable({
    data: statementsData,
    columns,
    state: {
      rowSelection,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Statements</h2>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto">
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
                    No statements.
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
                  {[5, 10, 20].map((pageSize) => (
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
    </div>
  )
}
