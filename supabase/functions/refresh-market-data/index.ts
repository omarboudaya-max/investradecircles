import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role to bypass RLS if needed
    );

    const updated: string[] = [];
    const timeNow = new Date().toISOString();

    // 1. CoinGecko (Crypto)
    try {
      const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true');
      const cgData = await cgRes.json();
      if (cgData.bitcoin) {
        await supabaseClient.from('MarketData').upsert({ symbol: 'BTC/USD', price: cgData.bitcoin.usd, change_pct: Number(cgData.bitcoin.usd_24h_change.toFixed(2)), updated_at: timeNow }, { onConflict: 'symbol' });
        updated.push('BTC/USD');
      }
      if (cgData.ethereum) {
        await supabaseClient.from('MarketData').upsert({ symbol: 'ETH/USD', price: cgData.ethereum.usd, change_pct: Number(cgData.ethereum.usd_24h_change.toFixed(2)), updated_at: timeNow }, { onConflict: 'symbol' });
        updated.push('ETH/USD');
      }
    } catch (e) { console.error('Crypto error:', e); }

    // 2. Yahoo Finance
    const YAHOO = [
      { s: 'S&P 500', y: '^GSPC' }, { s: 'NASDAQ', y: '^IXIC' }, { s: 'DOW', y: '^DJI' },
      { s: 'GOLD', y: 'GC=F' }, { s: 'OIL (WTI)', y: 'CL=F' }, { s: 'EUR/USD', y: 'EURUSD=X' }
    ];
    for (const t of YAHOO) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${t.y}?interval=1d&range=2d`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (meta) {
          const price = meta.regularMarketPrice;
          const prev = meta.chartPreviousClose || meta.previousClose;
          const pct = prev ? ((price - prev) / prev) * 100 : 0;
          await supabaseClient.from('MarketData').upsert({ symbol: t.s, price, change_pct: Number(pct.toFixed(2)), updated_at: timeNow }, { onConflict: 'symbol' });
          updated.push(t.s);
        }
      } catch (e) { console.error('Yahoo error:', e); }
    }

    // 3. Ilboursa
    const TUNIS = ['PX1', 'SFBT', 'BIAT', 'BT', 'SAH', 'PGH', 'DH', 'TRE', 'TLNET'];
    for (const s of TUNIS) {
      try {
        const url = `https://www.ilboursa.com/marches/cotation_${s}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
        const html = await res.text();
        
        const priceMatch = html.match(/<div class="cot_v1b">([^<]+)<\/div>/i);
        const changeMatch = html.match(/<div class="quote_(?:up|down|eq|neutral|eqc)\d">([^<]+)<\/div>/i);
        
        const rawPrice = priceMatch ? priceMatch[1].replace(/&#xA0;/g, '').replace(/&nbsp;/g, '').trim() : null;
        const rawChange = changeMatch ? changeMatch[1].trim() : null;
        
        const price = rawPrice ? parseFloat(rawPrice.replace(/TND/gi, '').replace(/[\s\xa0]/g, '').replace(',', '.')) : null;
        const change = rawChange ? parseFloat(rawChange.replace(/&#x2B;/gi, '+').replace(/&#x2D;/gi, '-').replace('%', '').replace(',', '.')) : null;

        if (price !== null && !isNaN(price)) {
          const sym = s === 'PX1' ? 'TUNINDEX' : s;
          await supabaseClient.from('MarketData').upsert({ symbol: sym, price, change_pct: isNaN(change) ? 0 : change, updated_at: timeNow }, { onConflict: 'symbol' });
          updated.push(sym);
        }
      } catch (e) { console.error('Ilboursa error:', e); }
    }

    return new Response(JSON.stringify({ success: true, updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
