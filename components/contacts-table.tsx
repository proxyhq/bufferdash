"use client"

import * as React from "react"
import Image from "next/image"
import {
  IconBuildingBank,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconDotsVertical,
  IconEdit,
  IconLoader2,
  IconSend,
  IconTrash,
  IconWallet,
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
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Unified contact type for display
export type Contact = {
  id: string
  contactType: "bank" | "crypto"
  label: string
  details: string // Bank: "****1234" or IBAN last 4, Crypto: truncated address
  fullDetails: string // Full address or account number
  network: string // Bank type or chain
  currency: string
  status: "active" | "inactive"
  dateAdded: number
  // Original data reference
  originalId: string
  originalType: "externalAccount" | "cryptoRecipient"
}

// Chain logos
const chainLogos: Record<string, string> = {
  solana: "/solana.svg",
  ethereum: "/eth.svg",
  base: "/base.svg",
  polygon: "/polygon.svg",
  arbitrum: "/arbitrum.svg",
}

// Bank type display names
const bankTypeNames: Record<string, string> = {
  us: "US Bank (ACH)",
  iban: "SEPA (IBAN)",
  gb: "UK (Faster Payments)",
  clabe: "Mexico (CLABE)",
  pix: "Brazil (PIX)",
}

// Format date for display
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// Truncate address for display
function truncateAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

interface ContactsTableProps {
  onEditCrypto?: (id: Id<"cryptoRecipients">) => void
  onEditBank?: (id: Id<"externalAccounts">) => void
  onSendCrypto?: (address: string, network: string) => void
  onSendToBank?: (accountId: string) => void
}

export function ContactsTable({ onEditCrypto, onEditBank, onSendCrypto, onSendToBank }: ContactsTableProps) {
  const externalAccounts = useQuery(api.bridgeExternalAccounts.getForCurrentUser, {})
  const cryptoRecipients = useQuery(api.cryptoRecipients.getForCurrentUser)
  const deleteCryptoRecipient = useMutation(api.cryptoRecipients.remove)

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [activeTab, setActiveTab] = React.useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [contactToDelete, setContactToDelete] = React.useState<Contact | null>(null)

  const isLoading = externalAccounts === undefined || cryptoRecipients === undefined

  // Transform data into unified contact format
  const contacts: Contact[] = React.useMemo(() => {
    const result: Contact[] = []

    // Transform external accounts
    if (externalAccounts) {
      for (const account of externalAccounts) {
        let details = ""
        if (account.last4) {
          details = `****${account.last4}`
        } else if (account.usAccount?.last4) {
          details = `****${account.usAccount.last4}`
        } else if (account.ibanAccount?.last4) {
          details = `****${account.ibanAccount.last4}`
        } else if (account.gbAccount?.accountNumber) {
          details = `****${account.gbAccount.accountNumber.slice(-4)}`
        }

        result.push({
          id: `bank-${account.bridgeExternalAccountId}`,
          contactType: "bank",
          label: account.accountName || account.accountOwnerName,
          details,
          fullDetails: account.bridgeExternalAccountId,
          network: bankTypeNames[account.accountType] || account.accountType,
          currency: account.currency.toUpperCase(),
          status: account.active ? "active" : "inactive",
          dateAdded: account.createdAt,
          originalId: account.bridgeExternalAccountId,
          originalType: "externalAccount",
        })
      }
    }

    // Transform crypto recipients
    if (cryptoRecipients) {
      for (const recipient of cryptoRecipients) {
        result.push({
          id: `crypto-${recipient._id}`,
          contactType: "crypto",
          label: recipient.label,
          details: truncateAddress(recipient.address),
          fullDetails: recipient.address,
          network: recipient.chain.charAt(0).toUpperCase() + recipient.chain.slice(1),
          currency: recipient.currency?.toUpperCase() || "USDC",
          status: "active",
          dateAdded: recipient.createdAt,
          originalId: recipient._id,
          originalType: "cryptoRecipient",
        })
      }
    }

    // Sort by date added (newest first)
    result.sort((a, b) => b.dateAdded - a.dateAdded)

    return result
  }, [externalAccounts, cryptoRecipients])

  const handleDelete = async () => {
    if (!contactToDelete) return

    try {
      if (contactToDelete.originalType === "cryptoRecipient") {
        await deleteCryptoRecipient({ id: contactToDelete.originalId as Id<"cryptoRecipients"> })
        toast.success("Recipient deleted")
      } else {
        // For bank accounts, we'd need to implement deactivation
        toast.error("Bank account deletion not implemented yet")
      }
    } catch (error) {
      toast.error("Failed to delete recipient")
    } finally {
      setDeleteDialogOpen(false)
      setContactToDelete(null)
    }
  }

  const columns: ColumnDef<Contact>[] = [
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
      accessorKey: "label",
      header: "Name",
      cell: ({ row }) => {
        const contact = row.original
        const isCrypto = contact.contactType === "crypto"
        const chainLogo = isCrypto ? chainLogos[contact.network.toLowerCase()] : null

        return (
          <div className="flex items-center gap-3">
            {isCrypto ? (
              chainLogo ? (
                <Image src={chainLogo} alt={contact.network} width={24} height={24} />
              ) : (
                <IconWallet className="size-6 text-muted-foreground" />
              )
            ) : (
              <IconBuildingBank className="size-6 text-muted-foreground" />
            )}
            <div className="flex flex-col">
              <span className="font-medium">{contact.label}</span>
              <span className="text-xs text-muted-foreground">{contact.details}</span>
            </div>
          </div>
        )
      },
      enableHiding: false,
    },
    {
      accessorKey: "contactType",
      header: "Type",
      cell: ({ row }) => {
        const isCrypto = row.original.contactType === "crypto"
        return (
          <Badge variant="outline" className="text-muted-foreground px-2 gap-1">
            {isCrypto ? (
              <IconWallet className="size-3" />
            ) : (
              <IconBuildingBank className="size-3" />
            )}
            {isCrypto ? "Crypto" : "Bank"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "network",
      header: "Network",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.network}
        </div>
      ),
    },
    {
      accessorKey: "currency",
      header: "Currency",
      cell: ({ row }) => (
        <div className="text-sm font-medium">
          {row.original.currency}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.status === "active"
        return (
          <Badge
            className={`px-2 gap-1 ${
              isActive
                ? "bg-green-500/15 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                : "bg-gray-500/15 text-gray-600 dark:text-gray-400 hover:bg-gray-500/20"
            }`}
          >
            {isActive ? (
              <IconCircleCheckFilled className="size-3" />
            ) : (
              <IconCircleXFilled className="size-3" />
            )}
            {isActive ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "dateAdded",
      header: () => <div className="text-right">Added</div>,
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm text-right">
          {formatDate(row.original.dateAdded)}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const contact = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" onClick={(e) => e.stopPropagation()}>
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => {
                  if (contact.contactType === "crypto" && onSendCrypto) {
                    onSendCrypto(contact.fullDetails, contact.network.toLowerCase())
                  } else if (contact.contactType === "bank" && onSendToBank) {
                    onSendToBank(contact.originalId)
                  }
                }}
              >
                <IconSend className="size-4" />
                Send
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() => {
                  if (contact.originalType === "cryptoRecipient" && onEditCrypto) {
                    onEditCrypto(contact.originalId as Id<"cryptoRecipients">)
                  } else if (contact.originalType === "externalAccount" && onEditBank) {
                    onEditBank(contact.originalId as Id<"externalAccounts">)
                  }
                }}
              >
                <IconEdit className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-red-600"
                onClick={() => {
                  setContactToDelete(contact)
                  setDeleteDialogOpen(true)
                }}
              >
                <IconTrash className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: contacts,
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
            table.getColumn("contactType")?.setFilterValue(undefined)
          } else {
            table.getColumn("contactType")?.setFilterValue(value)
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
                table.getColumn("contactType")?.setFilterValue(undefined)
              } else {
                table.getColumn("contactType")?.setFilterValue(value)
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
              <SelectItem value="all">All Recipients</SelectItem>
              <SelectItem value="bank">Bank Accounts</SelectItem>
              <SelectItem value="crypto">Crypto Wallets</SelectItem>
            </SelectContent>
          </Select>
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="all">All Recipients</TabsTrigger>
            <TabsTrigger value="bank">Bank Accounts</TabsTrigger>
            <TabsTrigger value="crypto">Crypto Wallets</TabsTrigger>
          </TabsList>
        </div>
        <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
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
                        Loading recipients...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
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
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <IconWallet className="size-8 opacity-50" />
                        <span>No recipients yet</span>
                        <span className="text-sm">Add a bank account or crypto wallet to get started</span>
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
                {table.getPageCount() || 1}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recipient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{contactToDelete?.label}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
