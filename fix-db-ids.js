import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixIds() {
  console.log('Fetching all profiles...');
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, full_name, email');
  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }
  
  // Create a map of lowercase name to ID
  const nameToIdMap = {};
  for (const profile of profiles) {
    if (profile.full_name) {
      nameToIdMap[profile.full_name.toLowerCase()] = profile.id;
    }
    if (profile.email) {
      const emailName = profile.email.split('@')[0].toLowerCase();
      nameToIdMap[emailName] = profile.id;
    }
  }

  const tablesToUpdate = [
    { name: 'Post', nameField: 'author_name', idField: 'created_by_id' },
    { name: 'Comment', nameField: 'author_name', idField: 'created_by_id' },
    { name: 'Story', nameField: 'author_name', idField: 'author_id' },
    { name: 'CircleEvent', nameField: 'author_name', idField: 'created_by_id' },
    { name: 'ProductComment', nameField: 'author_name', idField: 'created_by_id' }
  ];

  for (const table of tablesToUpdate) {
    console.log(`Checking table ${table.name}...`);
    // Fetch rows where idField is null
    const { data: rows, error: rowsError } = await supabase.from(table.name).select(`id, ${table.nameField}`).is(table.idField, null);
    
    if (rowsError) {
      console.error(`Error fetching ${table.name}:`, rowsError);
      continue;
    }
    
    console.log(`Found ${rows.length} rows missing ID in ${table.name}.`);
    
    for (const row of rows) {
      const authorName = row[table.nameField];
      if (!authorName) continue;
      
      const resolvedId = nameToIdMap[authorName.toLowerCase()];
      if (resolvedId) {
        const { error: updateError } = await supabase.from(table.name).update({ [table.idField]: resolvedId }).eq('id', row.id);
        if (updateError) {
          console.error(`Failed to update ${table.name} ${row.id}:`, updateError);
        } else {
          console.log(`Updated ${table.name} ${row.id} with ID ${resolvedId}`);
        }
      }
    }
  }
  console.log('Finished updating missing IDs.');
}

fixIds();
