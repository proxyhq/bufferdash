"use client"

import { useState } from "react"
import Image from "next/image"
import { IconCreditCard, IconEye, IconEyeOff, IconSnowflake, IconCash, IconCopy } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Card {
  id: string
  type: "virtual" | "physical"
  name: string
  balance: string
  number: string
  lastFour: string
  expiry: string
  cvv: string
  status: "active" | "inactive"
  holder: string
  theme: "dark" | "silver"
}

const cards: Card[] = [
  {
    id: "1",
    type: "virtual",
    name: "Subscriptions",
    balance: "$16,058.94",
    number: "4532 8924 1567 1234",
    lastFour: "1234",
    expiry: "06/27",
    cvv: "847",
    status: "active",
    holder: "LYZBETH OWUSU QUARSHIE",
    theme: "dark",
  },
  {
    id: "2",
    type: "virtual",
    name: "Shopping",
    balance: "$11.25",
    number: "4532 1122 9988 6454",
    lastFour: "6454",
    expiry: "11/29",
    cvv: "392",
    status: "active",
    holder: "LYZBETH OWUSU QUARSHIE",
    theme: "silver",
  },
]

function CardPreview({ card, showDetails }: { card: Card; showDetails: boolean }) {
  const maskedNumber = `•••• •••• •••• ${card.lastFour}`
  const isSilver = card.theme === "silver"

  if (isSilver) {
    return (
      <div className="relative aspect-[1.586/1] rounded-2xl overflow-hidden border bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.4]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M0 0h20L10 10zm10 10L20 20H0z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Card content */}
        <div className="relative h-full flex flex-col justify-between p-5">
          {/* Top row - Logo and Visa */}
          <div className="flex items-start justify-between">
            <Image
              src="/slate.svg"
              alt="Slate"
              width={70}
              height={24}
              className="opacity-80"
            />
            <Image
              src="/visaplatinum.png"
              alt="Visa"
              width={70}
              height={24}
              className="object-contain invert"
            />
          </div>

          {/* Bottom row */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] uppercase tracking-wider text-gray-400">Card Holder</span>
              <span className="text-xs font-medium tracking-wide text-gray-700">{card.holder}</span>
            </div>
            <Badge
              className={`text-[10px] px-2 py-0.5 ${
                card.status === "active"
                  ? "bg-green-500/20 text-green-700 border-green-300"
                  : "bg-gray-200 text-gray-600 border-gray-300"
              }`}
            >
              {card.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-[1.586/1] rounded-2xl overflow-hidden shadow-xl">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" />

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-600/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-600/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-gradient-to-bl from-fuchsia-500/20 to-transparent rounded-full blur-2xl" />
      </div>

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Card content */}
      <div className="relative h-full flex flex-col justify-between p-5">
        {/* Top row - Logo and Visa */}
        <div className="flex items-start justify-between">
          <Image
            src="/slate.svg"
            alt="Slate"
            width={70}
            height={24}
            className="brightness-0 invert opacity-90"
          />
          <Image
            src="/visaplatinum.png"
            alt="Visa"
            width={70}
            height={24}
            className="object-contain"
          />
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-white/50 text-[9px] uppercase tracking-wider">Card Holder</span>
            <span className="text-white text-xs font-medium tracking-wide">{card.holder}</span>
          </div>
          <Badge
            className={`text-[10px] px-2 py-0.5 ${
              card.status === "active"
                ? "bg-green-500/30 text-green-300 border-green-500/50"
                : "bg-gray-500/30 text-gray-300 border-gray-500/50"
            }`}
          >
            {card.status === "active" ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
    </div>
  )
}

function CardItem({ card, showDetails, onToggleDetails }: { card: Card; showDetails: boolean; onToggleDetails: () => void }) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ""))
    toast.success(`${label} copied`)
  }

  return (
    <div className="flex flex-col rounded-2xl border bg-card p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <IconCreditCard className="size-5 text-muted-foreground" />
        <span className="font-medium">
          {card.type === "virtual" ? "Virtual Card" : "Physical Card"}
        </span>
      </div>

      {/* Card preview */}
      <CardPreview card={card} showDetails={showDetails} />

      {/* Card name & Balance */}
      <div>
        <span className="text-sm text-muted-foreground">{card.name}</span>
        <div className="text-2xl font-bold">{card.balance}</div>
      </div>

      {/* Card details */}
      <div className="flex flex-col gap-2 text-sm border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Card Number</span>
          <div className="flex items-center gap-2">
            <span className="font-medium font-mono">{showDetails ? card.number : `•••• ${card.lastFour}`}</span>
            <button
              onClick={() => copyToClipboard(card.number, "Card number")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconCopy className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Expiry Date</span>
          <span className="font-medium">{card.expiry}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">CVV</span>
          <span className="font-medium font-mono">{showDetails ? card.cvv : "•••"}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onToggleDetails}
        >
          {showDetails ? (
            <>
              <IconEyeOff className="size-4 mr-1" />
              Hide
            </>
          ) : (
            <>
              <IconEye className="size-4 mr-1" />
              Reveal
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <IconCash className="size-4 mr-1" />
          Limit
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <IconSnowflake className="size-4 mr-1" />
          Freeze
        </Button>
      </div>
    </div>
  )
}

export function VirtualCard() {
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({})

  const toggleDetails = (cardId: string) => {
    setShowDetails((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          showDetails={showDetails[card.id] || false}
          onToggleDetails={() => toggleDetails(card.id)}
        />
      ))}
    </div>
  )
}
