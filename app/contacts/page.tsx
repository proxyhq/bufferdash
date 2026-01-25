"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ContactsTable } from "@/components/contacts-table"
import { AddCryptoRecipientDialog } from "@/components/add-crypto-recipient-dialog"
import { AddBankAccountDialog } from "@/components/add-bank-account-dialog"
import { SendCryptoModal } from "@/components/send-crypto-modal"
import { SendToBankModal } from "@/components/send-to-bank-modal"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconPlus,
  IconBuildingBank,
  IconWallet,
} from "@tabler/icons-react"
import type { Id } from "@/convex/_generated/dataModel"

export default function ContactsPage() {
  const [cryptoDialogOpen, setCryptoDialogOpen] = React.useState(false)
  const [bankDialogOpen, setBankDialogOpen] = React.useState(false)
  const [editCryptoId, setEditCryptoId] = React.useState<Id<"cryptoRecipients"> | null>(null)

  // Send modal state
  const [sendCryptoOpen, setSendCryptoOpen] = React.useState(false)
  const [sendToBankOpen, setSendToBankOpen] = React.useState(false)
  const [sendCryptoAddress, setSendCryptoAddress] = React.useState("")
  const [sendCryptoNetwork, setSendCryptoNetwork] = React.useState("solana")

  const handleEditCrypto = (id: Id<"cryptoRecipients">) => {
    setEditCryptoId(id)
    setCryptoDialogOpen(true)
  }

  const handleCryptoDialogClose = (open: boolean) => {
    setCryptoDialogOpen(open)
    if (!open) {
      setEditCryptoId(null)
    }
  }

  const handleSendCrypto = (address: string, network: string) => {
    setSendCryptoAddress(address)
    setSendCryptoNetwork(network)
    setSendCryptoOpen(true)
  }

  const handleSendToBank = () => {
    setSendToBankOpen(true)
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Recipients" />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="mx-auto w-full max-w-4xl flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header with Add Button */}
              <div className="flex items-center justify-between px-4 lg:px-6">
                <div>
                  <h2 className="text-lg font-semibold">Recipients</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your saved bank accounts and crypto wallets
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="gap-2">
                      <IconPlus className="size-4" />
                      Add Recipient
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer"
                      onClick={() => setBankDialogOpen(true)}
                    >
                      <IconBuildingBank className="size-4" />
                      Bank Account
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer"
                      onClick={() => setCryptoDialogOpen(true)}
                    >
                      <IconWallet className="size-4" />
                      Crypto Wallet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Contacts Table */}
              <ContactsTable
                onEditCrypto={handleEditCrypto}
                onSendCrypto={handleSendCrypto}
                onSendToBank={handleSendToBank}
              />
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Dialogs */}
      <AddCryptoRecipientDialog
        open={cryptoDialogOpen}
        onOpenChange={handleCryptoDialogClose}
        editId={editCryptoId}
      />
      <AddBankAccountDialog
        open={bankDialogOpen}
        onOpenChange={setBankDialogOpen}
      />

      {/* Send Modals */}
      <SendCryptoModal
        open={sendCryptoOpen}
        onOpenChange={setSendCryptoOpen}
        defaultAddress={sendCryptoAddress}
        defaultNetwork={sendCryptoNetwork}
      />
      <SendToBankModal
        open={sendToBankOpen}
        onOpenChange={setSendToBankOpen}
      />
    </SidebarProvider>
  )
}
