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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('Circle').select('*');
  if (error) {
    console.error('Error fetching circles:', error);
  } else {
    console.log('Circles in DB:', data.length);
    data.forEach(c => {
      console.log(`ID: ${c.id} | Name: ${c.name} | Category: ${c.category} | Website: ${c.website_url}`);
    });
  }
}
run();
