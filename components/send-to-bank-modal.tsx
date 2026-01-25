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
import { IconBuildingBank, IconLoader2, IconAlertTriangle, IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import { AddBankAccountDialog } from "@/components/add-bank-account-dialog";

interface SendToBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Currency flag mapping
const currencyFlags: Record<string, string> = {
  USD: "🇺🇸",
  GBP: "🇬🇧",
  EUR: "🇪🇺",
  MXN: "🇲🇽",
  BRL: "🇧🇷",
};

// Get currency from account type/country
function getCurrencyFromAccount(account: {
  currency?: string;
  country?: string;
  accountType?: string;
}): string {
  if (account.currency) return account.currency;
  if (account.country === "US" || account.accountType === "us") return "USD";
  if (account.country === "GB" || account.accountType === "uk") return "GBP";
  if (account.country === "EU" || account.accountType === "sepa") return "EUR";
  return "USD";
}

export function SendToBankModal({ open, onOpenChange }: SendToBankModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [addBankDialogOpen, setAddBankDialogOpen] = useState(false);

  // Fetch bank accounts and wallet balance
  const bankAccounts = useQuery(api.bridgeExternalAccounts.getForCurrentUser, {
    activeOnly: true,
  });
  const wallets = useQuery(api.bridgeWallets.getForCurrentUser);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedAccountId("");
      setAmount("");
      setIsSubmitting(false);
      setStep("form");
    }
  }, [open]);

  // Get USD stablecoin balance from wallet balances array
  const getUsdBalance = (
    balances: Array<{ balance: string; currency: string }> | undefined
  ): number => {
    if (!balances) return 0;
    let total = 0;
    for (const b of balances) {
      const currency = b.currency.toLowerCase();
      if (currency === "usdc" || currency === "usdb") {
        total += parseFloat(b.balance) || 0;
      }
    }
    return total;
  };

  // Get primary wallet and calculate balance
  const primaryWallet = wallets?.find((w) => w.chain === "solana" && w.userId);
  const balance = getUsdBalance(primaryWallet?.balances);
  const formattedBalance = balance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Get selected account details
  const selectedAccount = bankAccounts?.find(
    (acc) => acc._id === selectedAccountId
  );
  const currency = selectedAccount
    ? getCurrencyFromAccount(selectedAccount)
    : "USD";
  const currencySymbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";

  // Parse amount
  const numericAmount = parseFloat(amount) || 0;

  // Validation
  const isValidAmount = numericAmount > 0 && numericAmount <= balance;
  const canSubmit = selectedAccountId && isValidAmount && !isSubmitting;

  // Quick percentage handlers
  const handlePercentage = (percent: number) => {
    const value = (balance * percent) / 100;
    setAmount(value.toFixed(2));
  };

  // Format amount for display
  const formatDisplayAmount = (value: number): string => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      // TODO: Wire up actual transfer via api.bridgeTransfers
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Withdrawal initiated");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to initiate withdrawal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estimated fees (placeholder)
  const estimatedFee = numericAmount > 0 ? Math.max(0.5, numericAmount * 0.001) : 0;
  const netAmount = numericAmount - estimatedFee;

  // Get account display info
  const getLastFour = (account: typeof selectedAccount) => {
    if (!account) return "****";
    return (
      account.last4 ||
      account.usAccount?.last4 ||
      account.ibanAccount?.last4 ||
      account.gbAccount?.accountNumber?.slice(-4) ||
      account.clabeAccount?.last4 ||
      "****"
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "form" ? (
          <>
            {/* Form Step */}
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <IconBuildingBank className="h-5 w-5 text-primary" />
                </div>
                <DialogTitle className="text-xl font-semibold">
                  Send to Bank
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Balance Display */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Your cash balance is</p>
                <p className="text-2xl font-bold text-green-500">
                  ${formattedBalance}
                </p>
              </div>

              {/* Bank Account Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Bank Account</label>
                {bankAccounts === undefined ? (
                  <div className="flex items-center justify-center py-4">
                    <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : bankAccounts.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      No bank accounts added yet.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddBankDialogOpen(true)}
                      className="gap-1"
                    >
                      <IconPlus className="h-4 w-4" />
                      Add Bank Account
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={selectedAccountId}
                    onValueChange={setSelectedAccountId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((account) => {
                        const accountCurrency = getCurrencyFromAccount(account);
                        const flag = currencyFlags[accountCurrency] || "🏦";
                        const lastFour = getLastFour(account);
                        return (
                          <SelectItem key={account._id} value={account._id}>
                            <div className="flex items-center gap-2">
                              <span>{flag}</span>
                              <span className="font-medium">
                                {account.bankName || "Bank Account"}
                              </span>
                              <span className="text-muted-foreground">
                                ••••{lastFour}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Amount Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">
                    {currencySymbol}
                  </div>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-16 pl-10 pr-16 text-3xl font-bold text-center"
                    min="0"
                    max={balance}
                    step="0.01"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                    {currency}
                  </div>
                </div>

                {/* Quick Percentage Buttons */}
                <div className="flex gap-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <Button
                      key={percent}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePercentage(percent)}
                      disabled={balance === 0}
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>

                {/* Amount validation message */}
                {numericAmount > balance && (
                  <p className="text-sm text-destructive">
                    Amount exceeds available balance
                  </p>
                )}
              </div>

              {/* Fee Display */}
              {numericAmount > 0 && (
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Transfer amount</span>
                    <span>
                      {currencySymbol}
                      {formatDisplayAmount(numericAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated fee</span>
                    <span className="text-muted-foreground">
                      -{currencySymbol}
                      {formatDisplayAmount(estimatedFee)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>You receive</span>
                    <span className="text-green-500">
                      {currencySymbol}
                      {formatDisplayAmount(Math.max(0, netAmount))}
                    </span>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={() => setStep("confirm")}
                disabled={!selectedAccountId || !isValidAmount}
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
                Confirm Withdrawal
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Sending indicator */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <IconBuildingBank className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm">Bank Withdrawal</span>
              </div>

              {/* Transfer Details Card */}
              <div className="rounded-xl bg-muted/50 p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">To</span>
                  <div className="flex items-center gap-2">
                    <span>{currencyFlags[currency] || "🏦"}</span>
                    <span className="font-medium">
                      {selectedAccount?.bankName || "Bank Account"}
                    </span>
                    <span className="text-muted-foreground">
                      ••••{getLastFour(selectedAccount)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{currency}</span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">
                    {currencySymbol}{formatDisplayAmount(numericAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="text-muted-foreground">
                    -{currencySymbol}{formatDisplayAmount(estimatedFee)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">You receive</span>
                  <span className="font-semibold text-green-500">
                    {currencySymbol}{formatDisplayAmount(Math.max(0, netAmount))}
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="flex gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-800">
                <IconAlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Please verify the bank account details. Withdrawals typically take 1-3 business days to process.
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

      <AddBankAccountDialog
        open={addBankDialogOpen}
        onOpenChange={setAddBankDialogOpen}
      />
    </Dialog>
  );
}
