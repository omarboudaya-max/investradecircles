import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local if available
if (fs.existsSync('.env.local')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (set them in .env.local).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Checking connection to Supabase:', supabaseUrl);

async function runSeed() {
  const tables = ['Governorate', 'Sector', 'InvestmentOrganization', 'InvestmentVehicle', 'InvestmentProject'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('count').limit(1);
    if (error) {
      console.log(`⚠️ Table "${table}" is not accessible or not created yet.`);
      console.log(`   Error: ${error.message}`);
      console.log(`   👉 Please run "supabase_investors_opportunities.sql" in your Supabase SQL editor first!`);
    } else {
      console.log(`✅ Table "${table}" is online and ready.`);
    }
  }
}

runSeed().catch(console.error);
