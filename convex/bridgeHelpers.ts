/**
 * Bridge API Helper Functions
 * For fee calculations, precision handling, and transaction validation
 */

// Supported fiat currencies
export const FIAT_CURRENCIES = {
  usd: { code: "USD", name: "US Dollar", symbol: "$", decimals: 2 },
  eur: { code: "EUR", name: "Euro", symbol: "€", decimals: 2 },
  gbp: { code: "GBP", name: "British Pound", symbol: "£", decimals: 2 },
  mxn: { code: "MXN", name: "Mexican Peso", symbol: "$", decimals: 2 },
  brl: { code: "BRL", name: "Brazilian Real", symbol: "R$", decimals: 2 },
} as const;

// Supported stablecoins/crypto currencies
export const CRYPTO_CURRENCIES = {
  usdc: { code: "USDC", name: "USD Coin", decimals: 6 },
  usdt: { code: "USDT", name: "Tether", decimals: 6 },
  usdb: { code: "USDB", name: "Bridge USD", decimals: 6 },
  usdg: { code: "USDG", name: "Global Dollar", decimals: 6 }, // New: Global Dollar Network
  eurc: { code: "EURC", name: "Euro Coin", decimals: 6 },
  pyusd: { code: "PYUSD", name: "PayPal USD", decimals: 6 },
} as const;

// Supported blockchain networks/rails
export const BLOCKCHAIN_RAILS = {
  solana: { name: "Solana", currencies: ["usdc", "usdt", "usdb", "usdg", "eurc", "pyusd"] },
  ethereum: { name: "Ethereum", currencies: ["usdc", "usdt", "eurc", "pyusd"] },
  base: { name: "Base", currencies: ["usdc", "usdg"] },
  arbitrum: { name: "Arbitrum", currencies: ["usdc", "usdt"] },
  polygon: { name: "Polygon", currencies: ["usdc", "usdt"] },
  tron: { name: "Tron", currencies: ["usdt"] },
  stellar: { name: "Stellar", currencies: ["usdc"] },
} as const;

// Supported fiat payment rails
export const FIAT_RAILS = {
  ach: { name: "ACH", currency: "usd", countries: ["US"] },
  ach_push: { name: "ACH Push", currency: "usd", countries: ["US"] },
  wire: { name: "Wire Transfer", currency: "usd", countries: ["US"] },
  sepa: { name: "SEPA", currency: "eur", countries: ["EU"] },
  faster_payments: { name: "UK Faster Payments", currency: "gbp", countries: ["GB"] }, // New: GBP FPS
  spei: { name: "SPEI", currency: "mxn", countries: ["MX"] },
  pix: { name: "Pix", currency: "brl", countries: ["BR"] },
} as const;

// Transaction minimums by currency/rail (in USD equivalent)
// Reference: https://apidocs.bridge.xyz/docs/transaction-minimums
export const TRANSACTION_MINIMUMS: Record<string, number> = {
  // Crypto rails
  solana: 1.0,
  ethereum: 1.0,
  base: 1.0,
  arbitrum: 1.0,
  polygon: 1.0,
  tron: 1.0,
  stellar: 1.0,
  // Fiat rails - USD
  ach: 1.0,
  ach_push: 1.0,
  wire: 1.0,
  // Fiat rails - EUR
  sepa: 1.0,
  // Fiat rails - GBP (new)
  faster_payments: 1.0,
  // Fiat rails - MXN
  spei: 1.0,
  // Fiat rails - BRL
  pix: 1.0,
  // Bridge wallet
  bridge_wallet: 1.0,
  // Default
  default: 1.0,
};

/**
 * Truncate amount to whole cents (2 decimal places)
 * Bridge only processes amounts in whole US cents
 */
export function truncateToCents(amount: number): number {
  return Math.floor(amount * 100) / 100;
}

/**
 * Round up to whole cents (for fee calculations)
 * Ensures sufficient balance for fees
 */
export function roundUpToCents(amount: number): number {
  return Math.ceil(amount * 100) / 100;
}

/**
 * Format amount as string with 2 decimal places
 */
export function formatAmount(amount: number): string {
  return truncateToCents(amount).toFixed(2);
}

/**
 * Calculate fixed developer fee
 * @param amount - Transaction amount in USD
 * @param fee - Fixed fee in USD
 * @returns Object with fee details
 */
export function calculateFixedFee(amount: number, fee: number) {
  const truncatedAmount = truncateToCents(amount);
  const truncatedFee = truncateToCents(fee);
  const netAmount = truncateToCents(truncatedAmount - truncatedFee);

  return {
    inputAmount: truncatedAmount,
    developerFee: truncatedFee,
    netAmount,
    isValid: netAmount > 0,
  };
}

/**
 * Calculate percentage-based developer fee
 * @param amount - Transaction amount in USD
 * @param feePercent - Fee percentage (e.g., 1.0 for 1%)
 * @returns Object with fee details
 */
export function calculatePercentFee(amount: number, feePercent: number) {
  const truncatedAmount = truncateToCents(amount);
  // Fee is rounded up to ensure sufficient balance
  const fee = roundUpToCents((truncatedAmount * feePercent) / 100);
  const netAmount = truncateToCents(truncatedAmount - fee);

  return {
    inputAmount: truncatedAmount,
    developerFee: fee,
    developerFeePercent: feePercent,
    netAmount,
    isValid: netAmount > 0,
  };
}

/**
 * Calculate required input amount to achieve desired output
 * Formula: Input = Output / (1 - feePercent/100)
 * Then round up to nearest cent
 * @param desiredOutput - The amount you want the recipient to receive
 * @param feePercent - Fee percentage (e.g., 1.0 for 1%)
 * @returns Required input amount
 */
export function calculateInputForOutput(
  desiredOutput: number,
  feePercent: number
): number {
  const multiplier = 1 - feePercent / 100;
  const rawInput = desiredOutput / multiplier;
  return roundUpToCents(rawInput);
}

/**
 * Calculate output amount from input with fee
 * @param inputAmount - The amount being sent
 * @param feePercent - Fee percentage (e.g., 1.0 for 1%)
 * @returns Net output amount
 */
export function calculateOutputFromInput(
  inputAmount: number,
  feePercent: number
): number {
  const truncatedInput = truncateToCents(inputAmount);
  const fee = roundUpToCents((truncatedInput * feePercent) / 100);
  return truncateToCents(truncatedInput - fee);
}

/**
 * Get transaction minimum for a payment rail
 */
export function getTransactionMinimum(paymentRail: string): number {
  return TRANSACTION_MINIMUMS[paymentRail] || TRANSACTION_MINIMUMS.default;
}

/**
 * Validate transaction amount meets minimum requirements
 * Minimums are enforced AFTER developer fees are deducted
 */
export function validateTransactionAmount(
  amount: number,
  paymentRail: string,
  developerFee?: number,
  developerFeePercent?: number
): {
  isValid: boolean;
  netAmount: number;
  minimum: number;
  error?: string;
} {
  const minimum = getTransactionMinimum(paymentRail);
  let netAmount = truncateToCents(amount);

  // Deduct fixed fee if provided
  if (developerFee !== undefined && developerFee > 0) {
    netAmount = truncateToCents(netAmount - developerFee);
  }

  // Deduct percentage fee if provided
  if (developerFeePercent !== undefined && developerFeePercent > 0) {
    const fee = roundUpToCents((amount * developerFeePercent) / 100);
    netAmount = truncateToCents(netAmount - fee);
  }

  if (netAmount <= 0) {
    return {
      isValid: false,
      netAmount,
      minimum,
      error: "Fee exceeds transaction amount",
    };
  }

  if (netAmount < minimum) {
    return {
      isValid: false,
      netAmount,
      minimum,
      error: `Amount after fees ($${netAmount.toFixed(2)}) is below minimum ($${minimum.toFixed(2)}) for ${paymentRail}`,
    };
  }

  return {
    isValid: true,
    netAmount,
    minimum,
  };
}

/**
 * Validate developer fee precision
 * Fixed fees: max 2 decimal places
 * Percentage fees: max 5 decimal places
 */
export function validateFeePrecision(
  fee: number,
  type: "fixed" | "percent"
): boolean {
  const maxDecimals = type === "fixed" ? 2 : 5;
  const multiplier = Math.pow(10, maxDecimals);
  return Math.round(fee * multiplier) === fee * multiplier;
}

/**
 * Calculate full transfer breakdown
 * Useful for displaying to users before confirming
 */
export function calculateTransferBreakdown(
  amount: number,
  destinationRail: string,
  options?: {
    developerFee?: number;
    developerFeePercent?: number;
    exchangeFee?: number; // Bridge exchange fee if applicable
  }
) {
  const inputAmount = truncateToCents(amount);
  let totalFees = 0;
  let developerFeeAmount = 0;

  // Calculate developer fee
  if (options?.developerFee !== undefined && options.developerFee > 0) {
    developerFeeAmount = truncateToCents(options.developerFee);
    totalFees += developerFeeAmount;
  } else if (
    options?.developerFeePercent !== undefined &&
    options.developerFeePercent > 0
  ) {
    developerFeeAmount = roundUpToCents(
      (inputAmount * options.developerFeePercent) / 100
    );
    totalFees += developerFeeAmount;
  }

  // Add exchange fee if provided
  const exchangeFee = options?.exchangeFee
    ? truncateToCents(options.exchangeFee)
    : 0;
  totalFees += exchangeFee;

  const netAmount = truncateToCents(inputAmount - totalFees);
  const minimum = getTransactionMinimum(destinationRail);

  return {
    inputAmount,
    developerFee: developerFeeAmount,
    exchangeFee,
    totalFees,
    netAmount,
    minimum,
    isValid: netAmount >= minimum && netAmount > 0,
    breakdown: {
      "Amount sent": `$${inputAmount.toFixed(2)}`,
      "Developer fee": `$${developerFeeAmount.toFixed(2)}`,
      ...(exchangeFee > 0 && { "Exchange fee": `$${exchangeFee.toFixed(2)}` }),
      "Total fees": `$${totalFees.toFixed(2)}`,
      "Amount received": `$${netAmount.toFixed(2)}`,
    },
  };
}

/**
 * Parse amount string to number, handling various formats
 */
export function parseAmount(amountStr: string): number | null {
  // Remove currency symbols, commas, and whitespace
  const cleaned = amountStr.replace(/[$,\s]/g, "");
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed) || parsed < 0) {
    return null;
  }

  return truncateToCents(parsed);
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Check if amount would be considered "dust" (below minimum)
 */
export function isDust(amount: number, paymentRail: string): boolean {
  const minimum = getTransactionMinimum(paymentRail);
  return truncateToCents(amount) < minimum;
}

/**
 * Get suggested minimum input amount for a desired output
 * accounting for fees
 */
export function getSuggestedMinimumInput(
  paymentRail: string,
  developerFeePercent?: number
): number {
  const minimum = getTransactionMinimum(paymentRail);

  if (!developerFeePercent || developerFeePercent <= 0) {
    return minimum;
  }

  return calculateInputForOutput(minimum, developerFeePercent);
}

/**
 * Check if a currency is a supported fiat currency
 */
export function isFiatCurrency(currency: string): boolean {
  return currency.toLowerCase() in FIAT_CURRENCIES;
}

/**
 * Check if a currency is a supported crypto/stablecoin
 */
export function isCryptoCurrency(currency: string): boolean {
  return currency.toLowerCase() in CRYPTO_CURRENCIES;
}

/**
 * Check if a payment rail is a blockchain rail
 */
export function isBlockchainRail(rail: string): boolean {
  return rail.toLowerCase() in BLOCKCHAIN_RAILS;
}

/**
 * Check if a payment rail is a fiat rail
 */
export function isFiatRail(rail: string): boolean {
  return rail.toLowerCase() in FIAT_RAILS;
}

/**
 * Get supported currencies for a blockchain rail
 */
export function getSupportedCurrencies(rail: string): string[] {
  const blockchainRail = BLOCKCHAIN_RAILS[rail.toLowerCase() as keyof typeof BLOCKCHAIN_RAILS];
  if (blockchainRail) {
    return [...blockchainRail.currencies];
  }
  return [];
}

/**
 * Get fiat currency for a fiat rail
 */
export function getFiatRailCurrency(rail: string): string | null {
  const fiatRail = FIAT_RAILS[rail.toLowerCase() as keyof typeof FIAT_RAILS];
  return fiatRail?.currency || null;
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency: string): string {
  const fiat = FIAT_CURRENCIES[currency.toLowerCase() as keyof typeof FIAT_CURRENCIES];
  if (fiat) return fiat.symbol;

  // Crypto currencies typically use the code as symbol
  const crypto = CRYPTO_CURRENCIES[currency.toLowerCase() as keyof typeof CRYPTO_CURRENCIES];
  if (crypto) return crypto.code;

  return currency.toUpperCase();
}

/**
 * Get currency info (fiat or crypto)
 */
export function getCurrencyInfo(currency: string) {
  const lowerCurrency = currency.toLowerCase();

  if (lowerCurrency in FIAT_CURRENCIES) {
    return {
      type: "fiat" as const,
      ...FIAT_CURRENCIES[lowerCurrency as keyof typeof FIAT_CURRENCIES],
    };
  }

  if (lowerCurrency in CRYPTO_CURRENCIES) {
    return {
      type: "crypto" as const,
      ...CRYPTO_CURRENCIES[lowerCurrency as keyof typeof CRYPTO_CURRENCIES],
    };
  }

  return null;
}

/**
 * Get rail info (blockchain or fiat)
 */
export function getRailInfo(rail: string) {
  const lowerRail = rail.toLowerCase();

  if (lowerRail in BLOCKCHAIN_RAILS) {
    return {
      type: "blockchain" as const,
      ...BLOCKCHAIN_RAILS[lowerRail as keyof typeof BLOCKCHAIN_RAILS],
    };
  }

  if (lowerRail in FIAT_RAILS) {
    return {
      type: "fiat" as const,
      ...FIAT_RAILS[lowerRail as keyof typeof FIAT_RAILS],
    };
  }

  return null;
}

/**
 * Validate a transfer route (source -> destination)
 */
export function validateTransferRoute(
  sourceRail: string,
  sourceCurrency: string,
  destRail: string,
  destCurrency: string
): { isValid: boolean; error?: string } {
  // Check source rail exists
  const sourceRailInfo = getRailInfo(sourceRail);
  if (!sourceRailInfo) {
    return { isValid: false, error: `Unknown source rail: ${sourceRail}` };
  }

  // Check destination rail exists
  const destRailInfo = getRailInfo(destRail);
  if (!destRailInfo) {
    return { isValid: false, error: `Unknown destination rail: ${destRail}` };
  }

  // Check source currency
  const sourceCurrencyInfo = getCurrencyInfo(sourceCurrency);
  if (!sourceCurrencyInfo) {
    return { isValid: false, error: `Unknown source currency: ${sourceCurrency}` };
  }

  // Check destination currency
  const destCurrencyInfo = getCurrencyInfo(destCurrency);
  if (!destCurrencyInfo) {
    return { isValid: false, error: `Unknown destination currency: ${destCurrency}` };
  }

  // For blockchain destinations, verify currency is supported on that chain
  if (destRailInfo.type === "blockchain") {
    const supportedCurrencies = getSupportedCurrencies(destRail);
    if (!supportedCurrencies.includes(destCurrency.toLowerCase())) {
      return {
        isValid: false,
        error: `${destCurrency.toUpperCase()} is not supported on ${destRail}`,
      };
    }
  }

  // For fiat destinations, verify currency matches rail
  if (destRailInfo.type === "fiat") {
    const expectedCurrency = getFiatRailCurrency(destRail);
    if (expectedCurrency && expectedCurrency !== destCurrency.toLowerCase()) {
      return {
        isValid: false,
        error: `${destRail} only supports ${expectedCurrency.toUpperCase()}, not ${destCurrency.toUpperCase()}`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Get all supported payment rails
 */
export function getAllPaymentRails(): string[] {
  return [
    ...Object.keys(BLOCKCHAIN_RAILS),
    ...Object.keys(FIAT_RAILS),
    "bridge_wallet",
  ];
}

/**
 * Get all supported currencies
 */
export function getAllCurrencies(): string[] {
  return [
    ...Object.keys(FIAT_CURRENCIES),
    ...Object.keys(CRYPTO_CURRENCIES),
  ];
}

// Supported exchange rate pairs (as of Jan 2026)
export const EXCHANGE_RATE_PAIRS = {
  // Fiat pairs (bidirectional)
  "usd-eur": { from: "usd", to: "eur", bidirectional: true },
  "usd-gbp": { from: "usd", to: "gbp", bidirectional: true },
  "usd-mxn": { from: "usd", to: "mxn", bidirectional: true },
  "usd-brl": { from: "usd", to: "brl", bidirectional: true },
  "usd-usdt": { from: "usd", to: "usdt", bidirectional: true },
  // Crypto to USD (one-way)
  "btc-usd": { from: "btc", to: "usd", bidirectional: false },
  "eth-usd": { from: "eth", to: "usd", bidirectional: false },
  "sol-usd": { from: "sol", to: "usd", bidirectional: false },
} as const;

/**
 * Check if exchange rate is available for a currency pair
 */
export function isExchangeRateAvailable(from: string, to: string): boolean {
  const key = `${from.toLowerCase()}-${to.toLowerCase()}`;
  const reverseKey = `${to.toLowerCase()}-${from.toLowerCase()}`;

  if (key in EXCHANGE_RATE_PAIRS) return true;

  const reversePair = EXCHANGE_RATE_PAIRS[reverseKey as keyof typeof EXCHANGE_RATE_PAIRS];
  return reversePair?.bidirectional === true;
}

/**
 * Convert amount using exchange rate
 * @param amount - Amount in source currency
 * @param rate - Exchange rate (from -> to)
 * @returns Converted amount
 */
export function convertWithRate(amount: number, rate: number): number {
  return truncateToCents(amount * rate);
}

/**
 * Convert stablecoin balance to display currency
 * Assumes 1 USDC = 1 USD for stablecoin base
 * @param usdcBalance - Balance in USDC (or USD-pegged stablecoin)
 * @param displayCurrency - Target display currency (usd, gbp, eur, etc.)
 * @param rates - Exchange rates object { gbp: 0.785, eur: 0.923, ... }
 */
export function convertBalanceForDisplay(
  usdcBalance: number,
  displayCurrency: string,
  rates: Record<string, number>
): number {
  const currency = displayCurrency.toLowerCase();

  // USD/USDC is 1:1
  if (currency === "usd" || currency === "usdc") {
    return truncateToCents(usdcBalance);
  }

  const rate = rates[currency];
  if (!rate) {
    throw new Error(`No exchange rate available for ${displayCurrency}`);
  }

  return truncateToCents(usdcBalance * rate);
}

/**
 * Format wallet balance with currency conversion
 * @param usdcBalance - Balance in USDC
 * @param displayCurrency - Currency to display (usd, gbp, eur)
 * @param rates - Exchange rates from USD
 */
export function formatWalletBalance(
  usdcBalance: number,
  displayCurrency: string,
  rates: Record<string, number>
): string {
  const converted = convertBalanceForDisplay(usdcBalance, displayCurrency, rates);
  return formatCurrency(converted, displayCurrency);
}

/**
 * Calculate how much fiat is needed to fund a specific USDC amount
 * @param usdcAmount - Desired USDC amount
 * @param fromCurrency - Source fiat currency (gbp, eur, etc.)
 * @param buyRate - The buy rate (includes Bridge fee)
 */
export function calculateFundingAmount(
  usdcAmount: number,
  fromCurrency: string,
  buyRate: number
): { fiatAmount: number; formatted: string } {
  // buyRate is USD -> foreign, so we need inverse for foreign -> USD
  const fiatAmount = roundUpToCents(usdcAmount / buyRate);
  return {
    fiatAmount,
    formatted: formatCurrency(fiatAmount, fromCurrency),
  };
}

/**
 * Calculate how much fiat user will receive when withdrawing USDC
 * @param usdcAmount - USDC amount to withdraw
 * @param toCurrency - Target fiat currency (gbp, eur, etc.)
 * @param sellRate - The sell rate (includes Bridge fee)
 */
export function calculateWithdrawalAmount(
  usdcAmount: number,
  toCurrency: string,
  sellRate: number
): { fiatAmount: number; formatted: string } {
  const fiatAmount = truncateToCents(usdcAmount * sellRate);
  return {
    fiatAmount,
    formatted: formatCurrency(fiatAmount, toCurrency),
  };
}
