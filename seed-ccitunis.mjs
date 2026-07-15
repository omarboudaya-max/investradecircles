import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding CCI Tunis circle...");
  
  // Find an admin user to be the creator
  const { data: users, error: userErr } = await supabase.from('profiles').select('*').limit(1);
  if (userErr || !users.length) {
    console.error("Failed to fetch users:", userErr);
    process.exit(1);
  }
  const adminId = users[0].id;
  
  // Check if it already exists
  const { data: existing } = await supabase.from('Circle').select('*').eq('name', 'CCI Tunis').single();
  if (existing) {
    console.log("CCI Tunis already exists. Skipping insertion.");
  } else {
    // Insert new circle
    const { data: newCircle, error: insertErr } = await supabase.from('Circle').insert({
      name: 'CCI Tunis',
      description: 'La Chambre de Commerce et d\'Industrie de Tunis (CCI Tunis) est un établissement public d\'intérêt économique.',
      category: 'chamber_of_commerce',
      privacy: 'public',
      created_by_id: adminId,
      is_verified: true,
      verified_label: 'Institution',
      tags: ['Tunisia', 'Business', 'Export', 'B2B'],
      member_ids: [adminId]
    }).select().single();
    
    if (insertErr) {
      console.error("Failed to insert circle:", insertErr);
    } else {
      console.log(`Created CCI Tunis with ID: ${newCircle.id}`);
      
      // Insert a sample question/discussion
      await supabase.from('CircleQuestion').insert({
        circle_id: newCircle.id,
        question_text: "Quelles sont les principales difficultés que vous rencontrez lors de l'exportation vers l'Afrique subsaharienne ?",
        question_number: 1,
        total_members: 1,
        status: 'active',
        created_by_id: adminId
      });
      console.log("Added sample discussion.");
    }
  }
  console.log("Done.");
}

seed();
