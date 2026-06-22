import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load env variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseAnonKey = '';
let openaiApiKey = '';

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
      if (key === 'OPENAI_API_KEY') openaiApiKey = val;
    }
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in .env.local');
  process.exit(1);
}

if (!openaiApiKey) {
  console.error('Error: OPENAI_API_KEY must be defined in .env.local to run the AI Agent.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// List of stocks to analyze
const TUNISIAN_STOCKS = [
  { symbol: 'SFBT', name: 'SFBT' },
  { symbol: 'BIAT', name: 'BIAT' },
];

/**
 * Strips heavy HTML tags like <script> and <style> to save on LLM tokens
 */
function cleanHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ') // Remove remaining HTML tags
    .replace(/\s+/g, ' ') // Compress whitespace
    .trim()
    .substring(0, 8000); // Only send the first 8000 chars (usually contains the main price block)
}

/**
 * Uses OpenAI to extract structured data from raw text
 */
async function analyzeWithAiAgent(symbol, textContent) {
  console.log(`🤖 Agent is analyzing data for ${symbol}...`);
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost effective model
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert financial data extraction AI. 
          Extract the current stock price and daily percentage change for the symbol requested.
          Also provide a 1-sentence 'market_sentiment' summary based on the numbers (e.g. 'SFBT is up 1.2% today showing slight bullish momentum.').
          Respond STRICTLY in this JSON format:
          {
            "price": 12.5,
            "change_pct": 1.2,
            "market_sentiment": "string summary"
          }`
        },
        {
          role: "user",
          content: `Symbol to extract: ${symbol}\n\nWebpage text context:\n${textContent}`
        }
      ],
      temperature: 0.1,
    });

    const parsedData = JSON.parse(response.choices[0].message.content);
    return parsedData;
  } catch (error) {
    console.error(`❌ AI Agent failed to analyze ${symbol}:`, error.message);
    return null;
  }
}

async function run() {
  console.log('Starting AI Web Scraping Agent...');
  
  for (const stock of TUNISIAN_STOCKS) {
    try {
      console.log(`\nFetching raw page for ${stock.symbol}...`);
      const url = `https://www.ilboursa.com/marches/cotation_${stock.symbol}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      
      if (!res.ok) {
        console.warn(`Failed to fetch ilboursa page for ${stock.symbol}`);
        continue;
      }
      
      const html = await res.text();
      const cleanedText = cleanHtml(html);
      
      // Pass to AI Agent
      const aiResult = await analyzeWithAiAgent(stock.symbol, cleanedText);
      
      if (aiResult && typeof aiResult.price === 'number') {
        const payload = {
          symbol: stock.symbol,
          price: aiResult.price,
          change_pct: aiResult.change_pct,
          // If you updated your database schema, you could save aiResult.market_sentiment here!
          // ai_sentiment: aiResult.market_sentiment, 
          updated_at: new Date().toISOString()
        };

        // Upsert into Supabase
        const { error } = await supabase.from('MarketData').upsert(payload, { onConflict: 'symbol' });
        
        if (error) {
          console.error(`Supabase error upserting ${stock.symbol}:`, error);
        } else {
          console.log(`✅ Upserted ${stock.symbol}: Price = ${payload.price}, Change = ${payload.change_pct}%`);
          console.log(`💡 AI Insight: ${aiResult.market_sentiment}`);
        }
      } else {
        console.warn(`⚠️ AI Agent could not confidently extract data for ${stock.symbol}`);
      }
    } catch (err) {
      console.error(`Error processing ${stock.symbol}:`, err.message);
    }
  }

  console.log('\nAI Agent finished processing.');
}

run();
