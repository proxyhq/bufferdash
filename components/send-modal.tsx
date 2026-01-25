"use client"

import { useState } from "react"
import Image from "next/image"
import { IconChevronRight, IconBuildingBank } from "@tabler/icons-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SendCryptoModal } from "@/components/send-crypto-modal"
import { SendToBankModal } from "@/components/send-to-bank-modal"

interface SendModalProps {
  children: React.ReactNode
}

export function SendModal({ children }: SendModalProps) {
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false)
  const [bankModalOpen, setBankModalOpen] = useState(false)

  const handleCryptoClick = () => {
    setSendModalOpen(false)
    setCryptoModalOpen(true)
  }

  const handleBankClick = () => {
    setSendModalOpen(false)
    setBankModalOpen(true)
  }

  return (
    <>
      <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-[360px] sm:max-w-[360px] p-0 gap-0 border-none shadow-xl">
          <div className="p-6 pb-4 text-center">
            <DialogTitle className="text-xl font-semibold">
              Send Money
            </DialogTitle>
            <DialogDescription className="mt-1">
              Choose how you want to send funds
            </DialogDescription>
          </div>
          <div className="px-6 pb-6 flex flex-col gap-2">
            <button
              onClick={handleCryptoClick}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors text-left cursor-pointer"
            >
              <div className="flex -space-x-1.5">
                <Image src="/solana.svg" alt="Solana" width={32} height={32} className="rounded-full ring-2 ring-background" />
                <Image src="/eth.svg" alt="Ethereum" width={32} height={32} className="rounded-full ring-2 ring-background" />
                <Image src="/base.svg" alt="Base" width={32} height={32} className="rounded-full ring-2 ring-background" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Send Crypto</div>
                <div className="text-xs text-muted-foreground">USDC to any wallet address</div>
              </div>
              <IconChevronRight className="size-4 text-muted-foreground" />
            </button>
            <button
              onClick={handleBankClick}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors text-left cursor-pointer"
            >
              <div className="flex -space-x-1.5">
                <Image src="/chase-icon.svg" alt="Chase" width={32} height={32} className="ring-2 ring-background rounded-full" />
                <Image src="/boa.svg" alt="Bank of America" width={32} height={32} className="ring-2 ring-background rounded-full" />
                <Image src="/wellsfargo.svg" alt="Wells Fargo" width={32} height={32} className="ring-2 ring-background rounded-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Send to Bank</div>
                <div className="text-xs text-muted-foreground">Withdraw to your bank account</div>
              </div>
              <IconChevronRight className="size-4 text-muted-foreground" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <SendCryptoModal
        open={cryptoModalOpen}
        onOpenChange={setCryptoModalOpen}
      />

      <SendToBankModal
        open={bankModalOpen}
        onOpenChange={setBankModalOpen}
      />
    </>
  )
}
