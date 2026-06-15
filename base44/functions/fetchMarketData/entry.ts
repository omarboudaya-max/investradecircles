import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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
  const quotes = result.indicators?.quote?.[0];
  if (!meta || !quotes) return null;
  const current = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose || meta.previousClose;
  const changePct = prev && current ? ((current - prev) / prev) * 100 : null;
  return { price: current, change_pct: changePct ? Number(changePct.toFixed(2)) : null, previous_close: prev || null };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // If called directly by a user (not via scheduled automation), require admin
    const isAuthed = await base44.auth.isAuthenticated();
    if (isAuthed) {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    const updated = [];

    // ── Stocks & indices via Yahoo v8 chart ──
    for (const ticker of [...STOCK_TICKERS, ...COMMODITY_TICKERS, ...FOREX_TICKERS]) {
      const quote = await fetchYahooQuote(ticker.yahoo);
      if (!quote || quote.price == null) continue;

      const existing = await base44.asServiceRole.entities.MarketData.filter({ symbol: ticker.name });
      const payload = {
        price: quote.price,
        change_pct: quote.change_pct,
        previous_close: quote.previous_close,
      };

      if (existing.length > 0) {
        await base44.asServiceRole.entities.MarketData.update(existing[0].id, payload);
      } else {
        await base44.asServiceRole.entities.MarketData.create({ symbol: ticker.name, name: ticker.name, ...payload });
      }
      updated.push(ticker.name);
    }

    // ── Crypto via CoinGecko (free, no key) ──
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

        const existing = await base44.asServiceRole.entities.MarketData.filter({ symbol: name });
        const payload = { price, change_pct: changePct };

        if (existing.length > 0) {
          await base44.asServiceRole.entities.MarketData.update(existing[0].id, payload);
        } else {
          await base44.asServiceRole.entities.MarketData.create({ symbol: name, name, ...payload });
        }
        updated.push(name);
      }
    }

    return Response.json({
      success: true,
      updated,
      count: updated.length,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});