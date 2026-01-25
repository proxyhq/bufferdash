"use client"

import * as React from "react"
import { useAction, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import { IconBuildingBank, IconLoader2, IconMapPin } from "@tabler/icons-react"

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

const accountTypes = [
  { id: "us", name: "US Bank (ACH/Wire)", currency: "USD", flag: "🇺🇸" },
  { id: "gb", name: "UK (Faster Payments)", currency: "GBP", flag: "🇬🇧" },
  { id: "iban", name: "Europe (SEPA)", currency: "EUR", flag: "🇪🇺" },
]

interface AddressResult {
  place_name: string
  text: string
  context?: Array<{
    id: string
    text: string
    short_code?: string
  }>
  properties?: {
    address?: string
  }
}

interface AddBankAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddBankAccountDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddBankAccountDialogProps) {
  const currentUser = useQuery(api.users.getCurrentUser)
  const createUSAccount = useAction(api.bridgeExternalAccounts.createUSAccount)
  const createGBAccount = useAction(api.bridgeExternalAccounts.createGBAccount)
  const createIBANAccount = useAction(api.bridgeExternalAccounts.createIBANAccount)

  const [accountType, setAccountType] = React.useState("us")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Common fields
  const [bankName, setBankName] = React.useState("")
  const [accountName, setAccountName] = React.useState("")
  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")

  // US fields
  const [routingNumber, setRoutingNumber] = React.useState("")
  const [accountNumber, setAccountNumber] = React.useState("")
  const [checkingOrSavings, setCheckingOrSavings] = React.useState<"checking" | "savings">("checking")

  // UK fields
  const [sortCode, setSortCode] = React.useState("")
  const [ukAccountNumber, setUkAccountNumber] = React.useState("")

  // IBAN fields
  const [iban, setIban] = React.useState("")
  const [bic, setBic] = React.useState("")
  const [ibanCountry, setIbanCountry] = React.useState("DE")

  // Address fields
  const [streetLine1, setStreetLine1] = React.useState("")
  const [streetLine2, setStreetLine2] = React.useState("")
  const [city, setCity] = React.useState("")
  const [state, setState] = React.useState("")
  const [postalCode, setPostalCode] = React.useState("")
  const [country, setCountry] = React.useState("US")

  // Mapbox address suggestions
  const [addressQuery, setAddressQuery] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<AddressResult[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const suggestionsRef = React.useRef<HTMLDivElement>(null)

  // Fetch address suggestions from Mapbox
  const fetchSuggestions = React.useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=address&autocomplete=true&limit=5`
      )
      const data = await response.json()
      setSuggestions(data.features || [])
    } catch (error) {
      console.error("Failed to fetch address suggestions:", error)
    }
  }, [])

  // Debounce address search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (addressQuery) {
        fetchSuggestions(addressQuery)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [addressQuery, fetchSuggestions])

  // Close suggestions on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle address selection
  const handleSelectAddress = (result: AddressResult) => {
    // Parse address components
    const streetNumber = result.properties?.address || ""
    const streetName = result.text
    setStreetLine1(`${streetNumber} ${streetName}`.trim())

    // Parse context for city, state, postal code, country
    if (result.context) {
      for (const ctx of result.context) {
        if (ctx.id.startsWith("place")) {
          setCity(ctx.text)
        } else if (ctx.id.startsWith("region")) {
          setState(ctx.short_code?.replace("US-", "") || ctx.text)
        } else if (ctx.id.startsWith("postcode")) {
          setPostalCode(ctx.text)
        } else if (ctx.id.startsWith("country")) {
          setCountry(ctx.short_code?.toUpperCase() || ctx.text)
        }
      }
    }

    setAddressQuery(result.place_name)
    setShowSuggestions(false)
    setSuggestions([])
  }

  // Reset form when dialog closes or account type changes
  React.useEffect(() => {
    if (!open) {
      setBankName("")
      setAccountName("")
      setFirstName("")
      setLastName("")
      setRoutingNumber("")
      setAccountNumber("")
      setCheckingOrSavings("checking")
      setSortCode("")
      setUkAccountNumber("")
      setIban("")
      setBic("")
      setIbanCountry("DE")
      setStreetLine1("")
      setStreetLine2("")
      setCity("")
      setState("")
      setPostalCode("")
      setCountry("US")
      setAddressQuery("")
      setSuggestions([])
      setErrors({})
    }
  }, [open])

  // Update country when account type changes
  React.useEffect(() => {
    if (accountType === "us") setCountry("US")
    else if (accountType === "gb") setCountry("GB")
    else if (accountType === "iban") setCountry(ibanCountry)
  }, [accountType, ibanCountry])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!bankName.trim()) newErrors.bankName = "Bank name is required"
    if (!accountName.trim()) newErrors.accountName = "Account name is required"
    if (!firstName.trim()) newErrors.firstName = "First name is required"
    if (!lastName.trim()) newErrors.lastName = "Last name is required"

    if (accountType === "us") {
      if (!routingNumber.trim() || routingNumber.length !== 9) {
        newErrors.routingNumber = "Valid 9-digit routing number required"
      }
      if (!accountNumber.trim()) newErrors.accountNumber = "Account number is required"
      if (!streetLine1.trim()) newErrors.streetLine1 = "Street address is required"
      if (!city.trim()) newErrors.city = "City is required"
      if (!state.trim()) newErrors.state = "State is required"
      if (!postalCode.trim()) newErrors.postalCode = "Postal code is required"
    }

    if (accountType === "gb") {
      if (!sortCode.trim() || sortCode.replace(/-/g, "").length !== 6) {
        newErrors.sortCode = "Valid 6-digit sort code required"
      }
      if (!ukAccountNumber.trim() || ukAccountNumber.length !== 8) {
        newErrors.ukAccountNumber = "Valid 8-digit account number required"
      }
    }

    if (accountType === "iban") {
      if (!iban.trim() || iban.length < 15) {
        newErrors.iban = "Valid IBAN required"
      }
      if (!bic.trim()) newErrors.bic = "BIC/SWIFT code is required"
      if (!streetLine1.trim()) newErrors.streetLine1 = "Street address is required"
      if (!city.trim()) newErrors.city = "City is required"
      if (!postalCode.trim()) newErrors.postalCode = "Postal code is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!currentUser?.bridgeCustomerId) {
      toast.error("Please complete verification first")
      return
    }

    setIsSubmitting(true)
    try {
      if (accountType === "us") {
        await createUSAccount({
          bridgeCustomerId: currentUser.bridgeCustomerId,
          bankName: bankName.trim(),
          accountName: accountName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          accountOwnerType: "individual",
          accountOwnerName: `${firstName.trim()} ${lastName.trim()}`,
          routingNumber: routingNumber.trim(),
          accountNumber: accountNumber.trim(),
          checkingOrSavings,
          address: {
            streetLine1: streetLine1.trim(),
            streetLine2: streetLine2.trim() || undefined,
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            country: "US",
          },
        })
      } else if (accountType === "gb") {
        await createGBAccount({
          bridgeCustomerId: currentUser.bridgeCustomerId,
          bankName: bankName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          accountOwnerName: `${firstName.trim()} ${lastName.trim()}`,
          sortCode: sortCode.replace(/-/g, "").trim(),
          accountNumber: ukAccountNumber.trim(),
        })
      } else if (accountType === "iban") {
        await createIBANAccount({
          bridgeCustomerId: currentUser.bridgeCustomerId,
          bankName: bankName.trim(),
          accountName: accountName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          accountNumber: iban.replace(/\s/g, "").trim(),
          country: ibanCountry,
          bic: bic.trim(),
          address: {
            streetLine1: streetLine1.trim(),
            streetLine2: streetLine2.trim() || undefined,
            city: city.trim(),
            postalCode: postalCode.trim(),
            country: ibanCountry,
          },
        })
      }

      toast.success("Bank account added")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Failed to add bank account:", error)
      toast.error("Failed to add bank account")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedType = accountTypes.find((t) => t.id === accountType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconBuildingBank className="size-5" />
            Add Bank Account
          </DialogTitle>
          <DialogDescription>
            Add a bank account for receiving withdrawals.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type */}
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger id="accountType">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span>{selectedType?.flag}</span>
                    <span>{selectedType?.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <span>{type.flag}</span>
                      <span>{type.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              placeholder="e.g., Chase, Barclays, Deutsche Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className={errors.bankName ? "border-red-500" : ""}
            />
            {errors.bankName && <p className="text-xs text-red-500">{errors.bankName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Account Nickname</Label>
            <Input
              id="accountName"
              placeholder="e.g., My Checking"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className={errors.accountName ? "border-red-500" : ""}
            />
            {errors.accountName && <p className="text-xs text-red-500">{errors.accountName}</p>}
          </div>

          {/* US Bank Fields */}
          {accountType === "us" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    placeholder="9 digits"
                    maxLength={9}
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ""))}
                    className={errors.routingNumber ? "border-red-500" : ""}
                  />
                  {errors.routingNumber && <p className="text-xs text-red-500">{errors.routingNumber}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    className={errors.accountNumber ? "border-red-500" : ""}
                  />
                  {errors.accountNumber && <p className="text-xs text-red-500">{errors.accountNumber}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkingOrSavings">Account Type</Label>
                <Select value={checkingOrSavings} onValueChange={(v) => setCheckingOrSavings(v as "checking" | "savings")}>
                  <SelectTrigger id="checkingOrSavings">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* UK Bank Fields */}
          {accountType === "gb" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortCode">Sort Code</Label>
                <Input
                  id="sortCode"
                  placeholder="00-00-00"
                  maxLength={8}
                  value={sortCode}
                  onChange={(e) => setSortCode(e.target.value)}
                  className={errors.sortCode ? "border-red-500" : ""}
                />
                {errors.sortCode && <p className="text-xs text-red-500">{errors.sortCode}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ukAccountNumber">Account Number</Label>
                <Input
                  id="ukAccountNumber"
                  placeholder="8 digits"
                  maxLength={8}
                  value={ukAccountNumber}
                  onChange={(e) => setUkAccountNumber(e.target.value.replace(/\D/g, ""))}
                  className={errors.ukAccountNumber ? "border-red-500" : ""}
                />
                {errors.ukAccountNumber && <p className="text-xs text-red-500">{errors.ukAccountNumber}</p>}
              </div>
            </div>
          )}

          {/* IBAN Fields */}
          {accountType === "iban" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  placeholder="DE89 3704 0044 0532 0130 00"
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  className={errors.iban ? "border-red-500" : ""}
                />
                {errors.iban && <p className="text-xs text-red-500">{errors.iban}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bic">BIC / SWIFT</Label>
                  <Input
                    id="bic"
                    placeholder="COBADEFFXXX"
                    value={bic}
                    onChange={(e) => setBic(e.target.value.toUpperCase())}
                    className={errors.bic ? "border-red-500" : ""}
                  />
                  {errors.bic && <p className="text-xs text-red-500">{errors.bic}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ibanCountry">Country</Label>
                  <Select value={ibanCountry} onValueChange={setIbanCountry}>
                    <SelectTrigger id="ibanCountry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="NL">Netherlands</SelectItem>
                      <SelectItem value="ES">Spain</SelectItem>
                      <SelectItem value="IT">Italy</SelectItem>
                      <SelectItem value="BE">Belgium</SelectItem>
                      <SelectItem value="AT">Austria</SelectItem>
                      <SelectItem value="IE">Ireland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Address Fields (for US and IBAN) */}
          {(accountType === "us" || accountType === "iban") && (
            <>
              <div className="border-t pt-4 mt-4">
                <Label className="text-sm font-medium flex items-center gap-2 mb-3">
                  <IconMapPin className="size-4" />
                  Billing Address
                </Label>
              </div>

              <div className="space-y-2 relative" ref={suggestionsRef}>
                <Label htmlFor="streetLine1">Street Address</Label>
                <Input
                  id="streetLine1"
                  placeholder="Start typing to search..."
                  value={addressQuery || streetLine1}
                  onChange={(e) => {
                    setAddressQuery(e.target.value)
                    setStreetLine1(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className={errors.streetLine1 ? "border-red-500" : ""}
                />
                {errors.streetLine1 && <p className="text-xs text-red-500">{errors.streetLine1}</p>}

                {/* Address Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-start gap-2"
                        onClick={() => handleSelectAddress(suggestion)}
                      >
                        <IconMapPin className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                        <span>{suggestion.place_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetLine2">Apt, Suite, etc. (optional)</Label>
                <Input
                  id="streetLine2"
                  value={streetLine2}
                  onChange={(e) => setStreetLine2(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={errors.city ? "border-red-500" : ""}
                  />
                  {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                </div>
                {accountType === "us" && (
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="e.g., CA"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      className={errors.state ? "border-red-500" : ""}
                    />
                    {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className={errors.postalCode ? "border-red-500" : ""}
                  />
                  {errors.postalCode && <p className="text-xs text-red-500">{errors.postalCode}</p>}
                </div>
              </div>
            </>
          )}

          <DialogFooter className="pt-4">
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
                  Adding...
                </>
              ) : (
                "Add Account"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
