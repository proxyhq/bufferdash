"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconLoader2, IconAddressBook, IconWallet, IconAlertTriangle } from "@tabler/icons-react";
import { toast } from "sonner";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AddCryptoRecipientDialog } from "@/components/add-crypto-recipient-dialog";

interface SendCryptoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAddress?: string;
  defaultNetwork?: string;
}

const NETWORKS = [
  { id: "solana", name: "Solana", logo: "/solana.svg" },
  { id: "ethereum", name: "Ethereum", logo: "/eth.svg" },
  { id: "base", name: "Base", logo: "/base.svg" },
  { id: "polygon", name: "Polygon", logo: "/polygon.svg" },
  { id: "arbitrum", name: "Arbitrum", logo: "/arbitrum.svg" },
];

const EVM_NETWORKS = ["ethereum", "base", "polygon", "arbitrum"];

// Validate address format based on network
function validateAddress(address: string, network: string): { valid: boolean; warning?: string } {
  if (!address) return { valid: false };

  const trimmed = address.trim();
  const isEvm = EVM_NETWORKS.includes(network);
  const looksLikeEvm = trimmed.startsWith("0x");
  const looksLikeSolana = !looksLikeEvm && trimmed.length >= 32 && trimmed.length <= 44;

  if (network === "solana") {
    if (looksLikeEvm) {
      return { valid: false, warning: "This looks like an EVM address. Select Ethereum, Base, Polygon, or Arbitrum." };
    }
    if (trimmed.length < 32 || trimmed.length > 44) {
      return { valid: false, warning: "Solana addresses are typically 32-44 characters." };
    }
    // Basic base58 check (no 0, O, I, l characters)
    if (/[0OIl]/.test(trimmed)) {
      return { valid: false, warning: "Invalid Solana address format." };
    }
    return { valid: true };
  }

  if (isEvm) {
    if (looksLikeSolana) {
      return { valid: false, warning: "This looks like a Solana address. Select Solana network." };
    }
    if (!looksLikeEvm) {
      return { valid: false, warning: "EVM addresses should start with 0x." };
    }
    if (trimmed.length !== 42) {
      return { valid: false, warning: "EVM addresses should be 42 characters (0x + 40 hex)." };
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      return { valid: false, warning: "Invalid EVM address format." };
    }
    return { valid: true };
  }

  return { valid: trimmed.length >= 32 };
}

// Get USD stablecoin balance from wallet balances array
function getUsdBalance(
  balances: Array<{ balance: string; currency: string }> | undefined
): number {
  if (!balances) return 0;
  let total = 0;
  for (const b of balances) {
    const currency = b.currency.toLowerCase();
    if (currency === "usdc" || currency === "usdb") {
      total += parseFloat(b.balance) || 0;
    }
  }
  return total;
}

export function SendCryptoModal({
  open,
  onOpenChange,
  defaultAddress = "",
  defaultNetwork = "solana",
}: SendCryptoModalProps) {
  const wallets = useQuery(api.bridgeWallets.getForCurrentUser);
  const savedRecipients = useQuery(api.cryptoRecipients.getForCurrentUser);

  const [network, setNetwork] = useState(defaultNetwork);
  const [recipientAddress, setRecipientAddress] = useState(defaultAddress);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactsPopoverOpen, setContactsPopoverOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setNetwork(defaultNetwork);
      setRecipientAddress(defaultAddress);
      setAmount("");
      setStep("form");
    }
  }, [open, defaultNetwork, defaultAddress]);

  // Get primary wallet and calculate balance
  const primaryWallet = wallets?.find((w) => w.chain === "solana" && w.userId);
  const balance = getUsdBalance(primaryWallet?.balances);
  const parsedAmount = parseFloat(amount) || 0;

  // Validation
  const addressValidation = validateAddress(recipientAddress, network);
  const isValidAddress = addressValidation.valid;
  const isValidAmount = parsedAmount > 0 && parsedAmount <= balance;
  const isFormValid = isValidAddress && isValidAmount;

  // Check if address is already saved
  const isAddressSaved = savedRecipients?.some(
    (r) => r.address === recipientAddress
  );

  const handlePercentageClick = (percentage: number) => {
    const newAmount = (balance * percentage) / 100;
    setAmount(newAmount.toFixed(2));
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      // TODO: Wire up actual transfer action
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Transfer initiated");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to initiate transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedNetwork = NETWORKS.find((n) => n.id === network);
  const isLoading = wallets === undefined;

  // Estimate fee (placeholder - would come from Bridge API)
  const estimatedFee = 0.01;

  // Truncate address for display
  const truncatedAddress = recipientAddress
    ? `${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        {step === "form" ? (
          <>
            {/* Form Step */}
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2775CA]">
                  <span className="text-lg font-bold text-white">$</span>
                </div>
                <DialogTitle className="text-xl font-semibold">
                  Send USDC
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Balance Display */}
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Your cash balance is{" "}
                  {isLoading ? (
                    <IconLoader2 className="inline h-4 w-4 animate-spin" />
                  ) : (
                    <span className="font-semibold text-green-500">
                      ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </p>
              </div>

              {/* Network Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Network</label>
                <Select value={network} onValueChange={setNetwork}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {selectedNetwork && (
                        <div className="flex items-center gap-2">
                          <Image
                            src={selectedNetwork.logo}
                            alt={selectedNetwork.name}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                          <span>{selectedNetwork.name}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {NETWORKS.map((net) => (
                      <SelectItem key={net.id} value={net.id}>
                        <div className="flex items-center gap-2">
                          <Image
                            src={net.logo}
                            alt={net.name}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                          <span>{net.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient Address</label>
                <div className="relative">
                  <Input
                    placeholder="Enter wallet address"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="pr-10"
                  />
                  <Popover open={contactsPopoverOpen} onOpenChange={setContactsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                        title="Select from address book"
                      >
                        <IconAddressBook className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="end">
                      <div className="p-2 border-b">
                        <p className="text-sm font-medium">Saved Recipients</p>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {savedRecipients === undefined ? (
                          <div className="flex items-center justify-center py-4">
                            <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : savedRecipients.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No saved recipients yet
                          </div>
                        ) : (
                          savedRecipients.map((recipient) => {
                            const chainLogo = NETWORKS.find(n => n.id === recipient.chain)?.logo;
                            return (
                              <button
                                key={recipient._id}
                                className="flex items-center gap-3 w-full p-2 hover:bg-muted transition-colors text-left"
                                onClick={() => {
                                  setRecipientAddress(recipient.address);
                                  setNetwork(recipient.chain);
                                  setContactsPopoverOpen(false);
                                }}
                              >
                                {chainLogo ? (
                                  <Image
                                    src={chainLogo}
                                    alt={recipient.chain}
                                    width={20}
                                    height={20}
                                    className="rounded-full"
                                  />
                                ) : (
                                  <IconWallet className="h-5 w-5 text-muted-foreground" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{recipient.label}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {recipient.address.slice(0, 8)}...{recipient.address.slice(-6)}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground capitalize">
                                  {recipient.chain}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {recipientAddress && addressValidation.warning && (
                  <p className="text-xs text-amber-500 flex items-center gap-1">
                    <IconAlertTriangle className="h-3 w-3" />
                    {addressValidation.warning}
                  </p>
                )}
                {recipientAddress && !isAddressSaved && isValidAddress && (
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                    onClick={() => setSaveDialogOpen(true)}
                  >
                    <span className="mr-1">📁</span>
                    Save to address book
                  </button>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16 text-2xl font-semibold"
                    min="0"
                    max={balance}
                    step="0.01"
                  />
                  <div className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium">
                    USDC
                  </div>
                </div>

                {/* Percentage Buttons */}
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <Button
                      key={percent}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePercentageClick(percent)}
                      disabled={isLoading || balance === 0}
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>

                {/* Validation Messages */}
                {parsedAmount > balance && (
                  <p className="text-xs text-red-500">
                    Amount exceeds available balance
                  </p>
                )}
              </div>

              {/* Continue Button */}
              <Button
                className="w-full"
                size="lg"
                disabled={!isFormValid || isLoading}
                onClick={() => setStep("confirm")}
              >
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation Step */}
            <DialogHeader className="pb-2">
              <DialogTitle className="text-xl font-semibold">
                Confirm Transfer
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Sending USDC indicator */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2775CA]">
                  <span className="text-xs font-bold text-white">$</span>
                </div>
                <span className="text-sm">Sending USDC</span>
              </div>

              {/* Transfer Details Card */}
              <div className="rounded-xl bg-muted/50 p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-mono font-medium">{truncatedAddress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Network</span>
                  <div className="flex items-center gap-2">
                    {selectedNetwork && (
                      <Image
                        src={selectedNetwork.logo}
                        alt={selectedNetwork.name}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                    )}
                    <span className="font-medium">{selectedNetwork?.name}</span>
                  </div>
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    {parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="text-muted-foreground">${estimatedFee.toFixed(2)}</span>
                </div>
              </div>

              {/* Warning */}
              <div className="flex gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-800">
                <IconAlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Crypto transfers are irreversible. Please double-check the recipient address and network before confirming.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  onClick={() => setStep("form")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>

      {/* Save to Address Book Dialog */}
      <AddCryptoRecipientDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        defaultAddress={recipientAddress}
        defaultChain={network}
      />
    </Dialog>
  );
}
