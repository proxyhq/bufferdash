"use client"

import { useState } from "react"
import Image from "next/image"
import { QRCodeSVG } from "qrcode.react"
import { IconCopy, IconShare, IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface CryptoDepositModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string
}

const networks = [
  { id: "solana", name: "Solana", logo: "/solana.svg", chain: "solana" as const },
  { id: "ethereum", name: "Ethereum", logo: "/eth.svg", chain: "ethereum" as const },
  { id: "base", name: "Base", logo: "/base.svg", chain: "base" as const },
  { id: "arbitrum", name: "Arbitrum", logo: "/arbitrum.svg", chain: "arbitrum" as const },
  { id: "polygon", name: "Polygon", logo: "/polygon.svg", chain: "polygon" as const },
]

const stablecoins = [
  { id: "usdc", name: "USDC", logo: "/usdc.svg" },
  { id: "usdt", name: "USDT", logo: "/usdt.svg" },
  { id: "pyusd", name: "PYUSD", logo: "/pyusd.svg" },
]

export function CryptoDepositModal({ open, onOpenChange, currency }: CryptoDepositModalProps) {
  const [selectedNetwork, setSelectedNetwork] = useState("solana")
  const [selectedCoin, setSelectedCoin] = useState("usdc")

  // Get user's liquidation addresses for all networks
  const liquidationAddresses = useQuery(api.liquidationAddresses.getForCurrentUser)

  const network = networks.find(n => n.id === selectedNetwork)
  const coin = stablecoins.find(c => c.id === selectedCoin)

  // Get the deposit address - always use liquidation address for all networks
  // This ensures deposits are tracked in activity
  const getDepositAddress = () => {
    const liqAddr = liquidationAddresses?.find(
      la => la.chain === network?.chain && la.currency === selectedCoin
    )
    return liqAddr?.address || ""
  }

  const address = getDepositAddress()
  const isLoading = liquidationAddresses === undefined

  const copyAddress = async () => {
    if (!address) {
      toast.error("No address to copy")
      return
    }
    try {
      await navigator.clipboard.writeText(address)
      toast.success("Address copied to clipboard")
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = address
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      toast.success("Address copied to clipboard")
    }
  }

  const shareAddress = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${coin?.name} Deposit Address`,
        text: address,
      })
    } else {
      copyAddress()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-6">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            Receive
            <Image src={coin?.logo || "/usdc.svg"} alt={coin?.name || "USDC"} width={28} height={28} />
            {coin?.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-3">Loading wallet...</p>
          </div>
        ) : !address ? (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="text-5xl mb-4">🔐</div>
            <h3 className="font-semibold text-lg mb-2">Wallet Not Ready</h3>
            <p className="text-sm text-muted-foreground text-center max-w-[260px]">
              Complete identity verification to unlock your crypto wallet and start receiving funds.
            </p>
            <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>⚡</span>
                <span>Instant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>🆓</span>
                <span>Free</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Selectors Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Coin Selector */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Stablecoin</label>
                <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                  <SelectTrigger className="w-full h-12 rounded-2xl">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Image src={coin?.logo || ""} alt={coin?.name || ""} width={20} height={20} />
                        <span className="font-medium">{coin?.name}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {stablecoins.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="rounded-xl">
                        <div className="flex items-center gap-2">
                          <Image src={c.logo} alt={c.name} width={20} height={20} />
                          <span>{c.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Network Selector */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Network</label>
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                  <SelectTrigger className="w-full h-12 rounded-2xl">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Image src={network?.logo || ""} alt={network?.name || ""} width={20} height={20} />
                        <span className="font-medium">{network?.name}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {networks.map((n) => (
                      <SelectItem key={n.id} value={n.id} className="rounded-xl">
                        <div className="flex items-center gap-2">
                          <Image src={n.logo} alt={n.name} width={20} height={20} />
                          <span>{n.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-2xl shadow-sm">
                <QRCodeSVG value={address} size={160} />
              </div>
            </div>

            {/* Deposit Address */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Deposit Address</label>
              <div className="bg-muted/50 rounded-2xl p-4 text-center">
                <p className="text-sm font-mono break-all text-foreground">
                  {address}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={copyAddress} className="flex-1 h-12 rounded-2xl gap-2 font-semibold">
                <IconCopy className="size-4" />
                Copy Address
              </Button>
              <Button onClick={shareAddress} variant="outline" size="icon" className="h-12 w-12 rounded-2xl">
                <IconShare className="size-4" />
              </Button>
            </div>

            {/* Warning / Info */}
            <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-200 text-sm text-center p-4 rounded-2xl">
              Only send {coin?.name} on {network?.name} network. Sending other assets may result in permanent loss.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
