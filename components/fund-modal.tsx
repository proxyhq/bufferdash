"use client"

import { useState } from "react"
import Image from "next/image"
import { IconChevronRight } from "@tabler/icons-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CryptoDepositModal } from "@/components/crypto-deposit-modal"
import { BankTransferModal } from "@/components/bank-transfer-modal"

interface FundModalProps {
  currency: string
  flag: string
  children: React.ReactNode
}

export function FundModal({ currency, flag, children }: FundModalProps) {
  const [fundModalOpen, setFundModalOpen] = useState(false)
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false)
  const [bankModalOpen, setBankModalOpen] = useState(false)

  const getBankTransferDescription = () => {
    if (currency === "USD") {
      return "Receive money from the US to your USD account details"
    }
    if (currency === "GBP") {
      return "Receive money from the UK to your GBP account details"
    }
    if (currency === "EUR") {
      return "Receive money from Europe to your EUR account details"
    }
    return "Transfer from your bank account"
  }

  const handleCryptoClick = () => {
    setFundModalOpen(false)
    setCryptoModalOpen(true)
  }

  const handleBankClick = () => {
    setFundModalOpen(false)
    setBankModalOpen(true)
  }

  return (
    <>
      <Dialog open={fundModalOpen} onOpenChange={setFundModalOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="max-w-[360px] sm:max-w-[360px] p-0 gap-0 border-none shadow-xl">
          <div className="p-6 pb-4 text-center">
            <DialogTitle className="flex items-center justify-center gap-2 text-xl font-semibold">
              <span>{flag}</span>
              Fund {currency} Wallet
            </DialogTitle>
            <DialogDescription className="mt-1">
              Choose how you want to add funds
            </DialogDescription>
          </div>
          <div className="px-6 pb-6 flex flex-col gap-2">
            <button
              onClick={handleCryptoClick}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors text-left cursor-pointer"
            >
              <div className="flex -space-x-1.5">
                <Image src="/usdc.svg" alt="USDC" width={32} height={32} className="rounded-full ring-2 ring-background" />
                <Image src="/usdt.svg" alt="USDT" width={32} height={32} className="rounded-full ring-2 ring-background" />
                <Image src="/pyusd.svg" alt="PYUSD" width={32} height={32} className="rounded-full ring-2 ring-background" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Add via Crypto</div>
                <div className="text-xs text-muted-foreground">USDC, USDT, PYUSD</div>
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
                <div className="font-semibold text-sm">Bank Transfer</div>
                <div className="text-xs text-muted-foreground">ACH or wire transfer</div>
              </div>
              <IconChevronRight className="size-4 text-muted-foreground" />
            </button>
            <button
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted transition-colors text-left cursor-pointer"
            >
              <div className="flex -space-x-1">
                <Image src="/mtn.svg" alt="MTN" width={32} height={32} className="rounded-lg" />
                <Image src="/airtel.png" alt="Airtel" width={32} height={32} className="rounded-lg" />
                <Image src="/telecel.png" alt="Telecel" width={32} height={32} className="rounded-lg object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">Mobile Money</div>
                <div className="text-xs text-muted-foreground">MTN, AirtelTigo, Telecel</div>
              </div>
              <IconChevronRight className="size-4 text-muted-foreground" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <CryptoDepositModal
        open={cryptoModalOpen}
        onOpenChange={setCryptoModalOpen}
        currency={currency}
      />

      <BankTransferModal
        open={bankModalOpen}
        onOpenChange={setBankModalOpen}
        currency={currency}
        flag={flag}
      />
    </>
  )
}
