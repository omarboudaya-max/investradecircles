import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load env variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseAnonKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
      if (key === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
    }
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TUNISIAN_STOCKS = [
  { symbol: 'PX1', name: 'TUNINDEX' },
  { symbol: 'SFBT', name: 'SFBT' },
  { symbol: 'BIAT', name: 'BIAT' },
  { symbol: 'BT', name: 'Banque de Tunisie' },
  { symbol: 'SAH', name: 'SAH (Lilas)' },
  { symbol: 'PGH', name: 'Poulina Group Holding' },
  { symbol: 'DH', name: 'Delice Holding' },
  { symbol: 'TRE', name: 'Tunis Re' },
  { symbol: 'TLNET', name: 'Telnet Holding' }
];

const STOCK_TICKERS = [
  { symbol: '%5EGSPC', name: 'S&P 500', yahoo: '^GSPC' },
  { symbol: '%5EIXIC', name: 'NASDAQ', yahoo: '^IXIC' },
  { symbol: '%5EDJI', name: 'DOW', yahoo: '^DJI' },
];

const COMMODITY_TICKERS = [
  { symbol: 'GC%3DF', name: 'GOLD', yahoo: 'GC=F' },
  { symbol: 'CL%3DF', name: 'OIL (WTI)', yahoo: 'CL=F' },
];

const FOREX_TICKERS = [
  { symbol: 'EURUSD%3DX', name: 'EUR/USD', yahoo: 'EURUSD=X' },
];

const CRYPTO_IDS = {
  'BTC/USD': 'bitcoin',
  'ETH/USD': 'ethereum',
};

async function fetchYahooQuote(yahooSymbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=2d`;
  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    if (!meta) return null;
    const current = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose || meta.previousClose;
    const changePct = prev && current ? ((current - prev) / prev) * 100 : null;
    return { price: current, change_pct: changePct ? Number(changePct.toFixed(2)) : null, previous_close: prev || null };
  } catch (err) {
    console.error(`Error fetching Yahoo quote for ${yahooSymbol}:`, err.message);
    return null;
  }
}

async function run() {
  const updated = [];

  // 1. Scrape Bourse de Tunis from Ilboursa
  console.log('Scraping Bourse de Tunis...');
  for (const stock of TUNISIAN_STOCKS) {
    try {
      const url = `https://www.ilboursa.com/marches/cotation_${stock.symbol}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) {
        console.warn(`Failed to fetch ilboursa page for ${stock.symbol}`);
        continue;
      }
      const html = await res.text();
      
      const priceMatch = html.match(/<div class="cot_v1b">([^<]+)<\/div>/i);
      const changeMatch = html.match(/<div class="quote_(?:up|down|eq|neutral|eqc)\d">([^<]+)<\/div>/i);
      
      const rawPrice = priceMatch ? priceMatch[1].replace(/&#xA0;/g, '').replace(/&nbsp;/g, '').trim() : null;
      const rawChange = changeMatch ? changeMatch[1].trim() : null;
      
      const price = rawPrice ? parseFloat(rawPrice.replace(/TND/gi, '').replace(/[\s\xa0]/g, '').replace(',', '.')) : null;
      const change = rawChange ? parseFloat(rawChange.replace(/&#x2B;/gi, '+').replace(/&#x2D;/gi, '-').replace('%', '').replace(',', '.')) : null;

      if (price !== null && !isNaN(price)) {
        const displaySymbol = stock.symbol === 'PX1' ? 'TUNINDEX' : stock.symbol;
        const payload = {
          symbol: displaySymbol,
          price: price,
          change_pct: isNaN(change) ? 0 : change,
          updated_at: new Date().toISOString()
        };

        // Upsert logic using Supabase
        const { error } = await supabase.from('MarketData').upsert(payload, { onConflict: 'symbol' });
        if (error) {
          console.error(`Supabase error upserting ${stock.symbol}:`, error);
        } else {
          updated.push(displaySymbol);
          console.log(`Upserted ${displaySymbol}: Price = ${price}, Change = ${change}%`);
        }
      } else {
        console.warn(`Could not parse price/change for ${stock.symbol}`);
      }
    } catch (err) {
      console.error(`Error scraping ${stock.symbol}:`, err.message);
    }
  }

  // 2. Fetch Yahoo Stocks & Forex & Commodities
  console.log('Fetching Yahoo market data...');
  for (const ticker of [...STOCK_TICKERS, ...COMMODITY_TICKERS, ...FOREX_TICKERS]) {
    const quote = await fetchYahooQuote(ticker.yahoo);
    if (!quote || quote.price == null) continue;

    const payload = {
      symbol: ticker.name,
      price: quote.price,
      change_pct: quote.change_pct,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('MarketData').upsert(payload, { onConflict: 'symbol' });
    if (error) {
      console.error(`Supabase error upserting global ${ticker.name}:`, error);
    } else {
      updated.push(ticker.name);
      console.log(`Upserted global ${ticker.name}: Price = ${quote.price}, Change = ${quote.change_pct}%`);
    }
  }

  // 3. Fetch Crypto from CoinGecko
  console.log('Fetching CoinGecko crypto data...');
  try {
    const cryptoIds = Object.values(CRYPTO_IDS).join(',');
    const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true`;
    const cgResp = await fetch(cgUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (cgResp.ok) {
      const cgData = await cgResp.json();
      for (const [name, id] of Object.entries(CRYPTO_IDS)) {
        const coin = cgData[id];
        if (!coin?.usd) continue;

        const price = coin.usd;
        const changePct = coin.usd_24h_change != null ? Number(coin.usd_24h_change.toFixed(2)) : null;

        const payload = {
          symbol: name,
          price: price,
          change_pct: changePct,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('MarketData').upsert(payload, { onConflict: 'symbol' });
        if (error) {
          console.error(`Supabase error upserting crypto ${name}:`, error);
        } else {
          updated.push(name);
          console.log(`Upserted crypto ${name}: Price = ${price}, Change = ${changePct}%`);
        }
      }
    } else {
      console.warn('CoinGecko API returned status:', cgResp.status);
    }
  } catch (err) {
    console.error('Error fetching crypto data from CoinGecko:', err.message);
  }

  console.log('Market data update finished. Total updated:', updated.length);
}

run();
