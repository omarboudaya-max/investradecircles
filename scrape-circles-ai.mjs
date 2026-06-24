import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

// Load env variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseAnonKey = '';
let groqApiKey = '';

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
      if (key === 'GROQ_API_KEY') groqApiKey = val;
    }
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in .env.local');
  process.exit(1);
}

if (!groqApiKey) {
  console.error('Error: GROQ_API_KEY must be defined in .env.local to run the AI Agent.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const groq = new Groq({ apiKey: groqApiKey });

/**
 * Clean HTML by removing non-essential tags
 */
function cleanHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    // We intentionally keep <img> tags so Groq can extract image URLs for products
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 15000); // LLaMA 3 70b handles larger contexts easily, but let's cap at 15000 chars for speed
}

async function fetchWebsiteData(circleName, websiteUrl) {
  console.log(`\nFetching raw page for ${circleName} (${websiteUrl})...`);
  try {
    const res = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      // If direct fetch fails (e.g. CORS or blocking), fallback to a proxy
      console.warn(`Direct fetch failed, falling back to proxy for ${circleName}...`);
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(websiteUrl)}`;
      const proxyRes = await fetch(proxyUrl);
      if (!proxyRes.ok) throw new Error('Proxy fetch failed');
      return await proxyRes.text();
    }
    
    return await res.text();
  } catch (error) {
    console.error(`Failed to fetch website for ${circleName}:`, error.message);
    return null;
  }
}

async function analyzeInstitutionalWebsiteWithGroq(circleName, websiteUrl, textContent) {
  console.log(`🤖 Groq Agent is analyzing data for ${circleName}...`);
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert corporate intelligence AI. 
          Analyze the provided webpage HTML text for the institution: "${circleName}".
          
          Extract structured information based on this schema:
          {
            "name": "string (brand name)",
            "is_product_brand": "boolean (true if they sell physical goods/apparel/devices, false if they are a service/financial/educational institution)",
            "tagline": "string (catchy slogan or 1-sentence summary)",
            "mission": "string (their mission statement or purpose)",
            "vision": "string (their long-term vision)",
            "main_activity": "string (1-2 sentences on what they actually do)",
            "goals": ["string (goal 1)", "string (goal 2)"],
            "products": [
              {
                "category": "string (e.g. Running Shoes, Electric Vehicles)",
                "description": "string",
                "featured_items": ["string"],
                "price_range": "string (e.g. '100-200 TND' or empty if unknown)",
                "image_url": "string (extract the closest matching <img> src url for this product if present in the HTML, else empty string. MUST be absolute url starting with http)"
              }
            ],
            "services": [
              {
                "title": "string",
                "description": "string"
              }
            ],
            "news": [
              {
                "date": "string (if available)",
                "title": "string (latest announcements)"
              }
            ]
          }

          IMPORTANT:
          - DO NOT classify blog posts, articles, newsletters, or company announcements as products. If an item is a news post or article, it MUST go into the 'news' array.
          - The 'products' array is STRICTLY for retail items, physical goods, software applications, or core services being sold.
          - If they are a product brand, fill the 'products' array and leave 'services' empty.
          - If they are a service brand (like a bank), fill the 'services' array and leave 'products' empty.
          - If you find relative image urls (e.g. '/assets/img.png'), prepend them with the base URL: ${websiteUrl}
          - Respond STRICTLY with the JSON object.`
        },
        {
          role: "user",
          content: `Webpage text context:\n${textContent}`
        }
      ],
      temperature: 0.1,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error(`❌ Groq Agent failed to analyze ${circleName}:`, error.message);
    return null;
  }
}

async function run() {
  console.log('Starting Institutional Circles AI Scraping Agent...');
  
  // 1. Fetch all Circles with a website_url
  const { data: circles, error: fetchError } = await supabase
    .from('Circle')
    .select('id, name, website_url')
    .not('website_url', 'is', null)
    .neq('website_url', '');

  if (fetchError) {
    console.error('Error fetching circles from Supabase:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${circles.length} circles with websites to analyze.`);

  for (const circle of circles) {
    try {
      const html = await fetchWebsiteData(circle.name, circle.website_url);
      if (!html) continue;

      const cleanedText = cleanHtml(html);
      const aiResult = await analyzeInstitutionalWebsiteWithGroq(circle.name, circle.website_url, cleanedText);

      if (aiResult) {
        // Upsert the cached data back to the Circle table
        const { error: updateError } = await supabase
          .from('Circle')
          .update({ ai_cached_data: aiResult })
          .eq('id', circle.id);

        if (updateError) {
          console.error(`Supabase error updating cached data for ${circle.name}:`, updateError);
        } else {
          console.log(`✅ Successfully cached AI data for ${circle.name}!`);
        }
      }
    } catch (err) {
      console.error(`Error processing ${circle.name}:`, err.message);
    }
  }

  console.log('\nAI Circles Agent finished processing.');
}

run();
