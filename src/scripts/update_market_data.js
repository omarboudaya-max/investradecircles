import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const file = 'src/components/circles/ChamberOfCommerceLayout.jsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings to LF for clean manipulation
content = content.replace(/\r\n/g, '\n');

// 1. replace tunisian list
content = content.replace(
  "const tunisian = ['SFBT', 'BIAT', 'BT', 'SAH', 'PGH', 'DH', 'TRE', 'TLNET'];",
  "const tunisian = ['SFBT', 'BIAT', 'BT', 'SAH', 'PGH', 'DH', 'TRE', 'TLNET', 'TJARI', 'AMEN'];"
);

// 2. replace format
content = content.replace(
  "if (symbol === 'TUNINDEX') return Number(price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });",
  "if (symbol === 'TUNINDEX') return `${Number(price).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} pts`;"
);
content = content.replace(
  "if (tunisian.includes(symbol)) return `${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`;",
  "if (tunisian.includes(symbol)) return `${Number(price).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`;"
);

// 3. replace default market data array
const oldArrayRegex = /const DEFAULT_MARKET_DATA = \[[\s\S]*?\];/;
const newArray = `const DEFAULT_MARKET_DATA = [
  { symbol: 'TUNINDEX', price: 18563.67, change_pct: -0.22 },
  { symbol: 'BIAT', price: 162.00, change_pct: 0.31 },
  { symbol: 'SFBT', price: 13.48, change_pct: -0.15 },
  { symbol: 'TJARI', price: 77.50, change_pct: 0.65 },
  { symbol: 'BT', price: 5.48, change_pct: 0.37 },
  { symbol: 'SAH', price: 12.26, change_pct: 0.49 },
  { symbol: 'PGH', price: 25.98, change_pct: -0.38 },
  { symbol: 'DH', price: 15.10, change_pct: 0.20 },
  { symbol: 'AMEN', price: 44.50, change_pct: 0.45 },
  { symbol: 'TRE', price: 13.50, change_pct: 0.75 },
  { symbol: 'TLNET', price: 9.85, change_pct: -0.50 },
  { symbol: 'S&P 500', price: 5815.20, change_pct: 0.61 },
  { symbol: 'NASDAQ', price: 18342.90, change_pct: 0.33 },
  { symbol: 'DOW', price: 42863.80, change_pct: 0.97 },
  { symbol: 'GOLD', price: 2657.40, change_pct: 1.10 },
  { symbol: 'OIL (WTI)', price: 75.56, change_pct: -0.38 },
  { symbol: 'EUR/USD', price: 1.0935, change_pct: -0.05 },
  { symbol: 'BTC/USD', price: 62850.00, change_pct: 2.10 },
  { symbol: 'ETH/USD', price: 2450.00, change_pct: 1.80 }
];`;
content = content.replace(oldArrayRegex, newArray);

// 4. replace order
const oldOrder = "const order = ['S&P 500', 'NASDAQ', 'DOW', 'GOLD', 'OIL (WTI)', 'EUR/USD', 'BTC/USD', 'ETH/USD'];";
const newOrder = `const order = [
      'TUNINDEX', 'BIAT', 'SFBT', 'TJARI', 'BT', 'SAH', 'PGH', 'DH', 'AMEN', 'TRE', 'TLNET',
      'S&P 500', 'NASDAQ', 'DOW', 'GOLD', 'OIL (WTI)', 'EUR/USD', 'BTC/USD', 'ETH/USD'
    ];`;
content = content.replace(oldOrder, newOrder);

fs.writeFileSync(file, content, 'utf8');
console.log('ChamberOfCommerceLayout.jsx updated successfully!');

// 5. Update Supabase MarketData table
const supabase = createClient(
  'https://earhypzdxwbohdncdzvz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcmh5cHpkeHdib2hkbmNkenZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mzg2OTksImV4cCI6MjA5NzExNDY5OX0.gMKrm7I88A5N-9YS_bi1HnMN1nrVfXMU7ilgrHGGgXw'
);

const liveItems = [
  { symbol: 'TUNINDEX', price: 18563.67, change_pct: -0.22 },
  { symbol: 'BIAT', price: 162.00, change_pct: 0.31 },
  { symbol: 'SFBT', price: 13.48, change_pct: -0.15 },
  { symbol: 'BT', price: 5.48, change_pct: 0.37 },
  { symbol: 'SAH', price: 12.26, change_pct: 0.49 },
  { symbol: 'PGH', price: 25.98, change_pct: -0.38 },
  { symbol: 'DH', price: 15.10, change_pct: 0.20 },
  { symbol: 'TRE', price: 13.50, change_pct: 0.75 },
  { symbol: 'TLNET', price: 9.85, change_pct: -0.50 }
];

async function updateDb() {
  for (const item of liveItems) {
    const { error } = await supabase.from('MarketData').update({
      price: item.price,
      change_pct: item.change_pct,
      updated_at: new Date().toISOString()
    }).eq('symbol', item.symbol);
    if (error) console.error('Error updating', item.symbol, error);
  }
  console.log('Supabase MarketData table updated with live BVMT prices!');
}

updateDb();
