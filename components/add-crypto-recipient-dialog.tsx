"use client"

import * as React from "react"
import Image from "next/image"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import { IconLoader2, IconWallet } from "@tabler/icons-react"
import type { Id } from "@/convex/_generated/dataModel"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const chains = [
  { id: "solana", name: "Solana", logo: "/solana.svg" },
  { id: "ethereum", name: "Ethereum", logo: "/eth.svg" },
  { id: "base", name: "Base", logo: "/base.svg" },
  { id: "polygon", name: "Polygon", logo: "/polygon.svg" },
  { id: "arbitrum", name: "Arbitrum", logo: "/arbitrum.svg" },
]

const currencies = [
  { id: "usdc", name: "USDC" },
  { id: "usdt", name: "USDT" },
  { id: "pyusd", name: "PYUSD" },
]

interface AddCryptoRecipientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId?: Id<"cryptoRecipients"> | null
  onSuccess?: () => void
  defaultAddress?: string
  defaultChain?: string
}

export function AddCryptoRecipientDialog({
  open,
  onOpenChange,
  editId,
  onSuccess,
  defaultAddress,
  defaultChain,
}: AddCryptoRecipientDialogProps) {
  const createRecipient = useMutation(api.cryptoRecipients.create)
  const updateRecipient = useMutation(api.cryptoRecipients.update)
  const existingRecipient = useQuery(
    api.cryptoRecipients.getById,
    editId ? { id: editId } : "skip"
  )

  const [label, setLabel] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [chain, setChain] = React.useState("solana")
  const [currency, setCurrency] = React.useState("usdc")
  const [notes, setNotes] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const isEditing = !!editId

  // Populate form when editing
  React.useEffect(() => {
    if (existingRecipient && isEditing) {
      setLabel(existingRecipient.label)
      setAddress(existingRecipient.address)
      setChain(existingRecipient.chain)
      setCurrency(existingRecipient.currency || "usdc")
      setNotes(existingRecipient.notes || "")
    }
  }, [existingRecipient, isEditing])

  // Reset form when dialog closes or set defaults when opening
  React.useEffect(() => {
    if (!open) {
      setLabel("")
      setAddress("")
      setChain("solana")
      setCurrency("usdc")
      setNotes("")
      setErrors({})
    } else if (!isEditing) {
      // Set defaults when opening for new contact
      if (defaultAddress) setAddress(defaultAddress)
      if (defaultChain) setChain(defaultChain)
    }
  }, [open, isEditing, defaultAddress, defaultChain])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!label.trim()) {
      newErrors.label = "Name is required"
    }

    if (!address.trim()) {
      newErrors.address = "Wallet address is required"
    } else {
      // Basic address validation per chain
      if (chain === "solana") {
        // Solana addresses are base58 encoded, typically 32-44 chars
        if (address.length < 32 || address.length > 44) {
          newErrors.address = "Invalid Solana address"
        }
      } else {
        // EVM addresses start with 0x and are 42 chars
        if (!address.startsWith("0x") || address.length !== 42) {
          newErrors.address = "Invalid EVM address (should start with 0x)"
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      if (isEditing && editId) {
        await updateRecipient({
          id: editId,
          label: label.trim(),
          address: address.trim(),
          chain,
          currency,
          notes: notes.trim() || undefined,
        })
        toast.success("Recipient updated")
      } else {
        await createRecipient({
          label: label.trim(),
          address: address.trim(),
          chain,
          currency,
          notes: notes.trim() || undefined,
        })
        toast.success("Recipient added")
      }
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(isEditing ? "Failed to update recipient" : "Failed to add recipient")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedChain = chains.find((c) => c.id === chain)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconWallet className="size-5" />
            {isEditing ? "Edit Crypto Wallet" : "Add Crypto Wallet"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the recipient details below."
              : "Add a crypto wallet recipient for quick transfers."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Name / Label</Label>
            <Input
              id="label"
              placeholder="e.g., Mom's Wallet"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={errors.label ? "border-red-500" : ""}
            />
            {errors.label && (
              <p className="text-xs text-red-500">{errors.label}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="chain">Network</Label>
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger id="chain">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {selectedChain && (
                      <Image
                        src={selectedChain.logo}
                        alt={selectedChain.name}
                        width={20}
                        height={20}
                      />
                    )}
                    <span>{selectedChain?.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {chains.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <Image src={c.logo} alt={c.name} width={20} height={20} />
                      <span>{c.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Wallet Address</Label>
            <Input
              id="address"
              placeholder={chain === "solana" ? "Enter Solana address" : "0x..."}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`font-mono text-sm ${errors.address ? "border-red-500" : ""}`}
            />
            {errors.address && (
              <p className="text-xs text-red-500">{errors.address}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Preferred Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this contact..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <IconLoader2 className="size-4 mr-2 animate-spin" />
                  {isEditing ? "Updating..." : "Adding..."}
                </>
              ) : isEditing ? (
                "Update"
              ) : (
                "Add Recipient"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
