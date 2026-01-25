#!/usr/bin/env node

/**
 * Script to get exchange rates from Bridge API
 *
 * Usage:
 * node get-exchange-rates.js [from] [to]
 *
 * Examples:
 * node get-exchange-rates.js              # Get all common rates
 * node get-exchange-rates.js usd gbp      # Get specific rate
 * node get-exchange-rates.js usd eur
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY;
const BRIDGE_API_URL = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

if (!BRIDGE_API_KEY) {
  console.error('Error: BRIDGE_API_KEY not found in environment variables');
  process.exit(1);
}

const fromCurrency = process.argv[2];
const toCurrency = process.argv[3];

async function getExchangeRate(from, to) {
  try {
    const response = await axios.get(`${BRIDGE_API_URL}/exchange_rates`, {
      params: { from, to },
      headers: {
        Accept: 'application/json',
        'Api-Key': BRIDGE_API_KEY,
      },
    });
    return { from, to, ...response.data };
  } catch (error) {
    if (error.response) {
      return { from, to, error: error.response.data };
    }
    return { from, to, error: error.message };
  }
}

async function getAllRates() {
  const pairs = [
    ['usd', 'gbp'],
    ['usd', 'eur'],
    ['usd', 'mxn'],
    ['usd', 'brl'],
    ['usd', 'usdt'],
    ['btc', 'usd'],
    ['eth', 'usd'],
    ['sol', 'usd'],
  ];

  console.log('Fetching all exchange rates...\n');

  const results = await Promise.all(
    pairs.map(([from, to]) => getExchangeRate(from, to))
  );

  console.log('Exchange Rates (updated ~every 30s):');
  console.log('=====================================\n');

  for (const result of results) {
    if (result.error) {
      console.log(`${result.from.toUpperCase()} → ${result.to.toUpperCase()}: Error - ${JSON.stringify(result.error)}`);
    } else {
      console.log(`${result.from.toUpperCase()} → ${result.to.toUpperCase()}:`);
      console.log(`  Midmarket: ${result.midmarket_rate}`);
      console.log(`  Buy rate:  ${result.buy_rate} (you pay this to buy ${result.to.toUpperCase()})`);
      console.log(`  Sell rate: ${result.sell_rate} (you get this when selling ${result.to.toUpperCase()})`);
      console.log('');
    }
  }

  // Also show reverse rates for display purposes
  console.log('\nFor displaying USDC balance in other currencies:');
  console.log('================================================\n');

  const displayRates = results.filter(r => r.from === 'usd' && !r.error);
  for (const rate of displayRates) {
    const midmarket = parseFloat(rate.midmarket_rate);
    console.log(`100 USDC = ${(100 * midmarket).toFixed(2)} ${rate.to.toUpperCase()}`);
  }
}

async function getSingleRate() {
  console.log(`Fetching ${fromCurrency.toUpperCase()} → ${toCurrency.toUpperCase()} rate...\n`);

  const result = await getExchangeRate(fromCurrency, toCurrency);

  if (result.error) {
    console.error('Error:', JSON.stringify(result.error, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

if (fromCurrency && toCurrency) {
  getSingleRate();
} else {
  getAllRates();
}
