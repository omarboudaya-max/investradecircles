import fs from 'fs';
import path from 'path';

function walkSync(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    var filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      walkSync(filepath, callback);
    } else if (stats.isFile()) {
      callback(filepath);
    }
  });
}

function processFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('base44')) return;

  console.log('Processing:', filePath);

  // 1. Replace imports
  content = content.replace(/import\s+\{\s*base44\s*\}\s+from\s+['"]@\/api\/base44Client['"];/g, "import { supabase } from '@/lib/supabase';");
  content = content.replace(/import\s+\{\s*base44\s*\}\s+from\s+['"]\.\.\/\.\.\/api\/base44Client['"];/g, "import { supabase } from '@/lib/supabase';");
  content = content.replace(/import\s+\{\s*base44\s*\}\s+from\s+['"]\.\.\/api\/base44Client['"];/g, "import { supabase } from '@/lib/supabase';");

  // 2. Replace base44.entities.X.list('-created_date', N)
  content = content.replace(/base44\.entities\.([A-Za-z]+)\.list\(['"]-created_date['"],\s*(\d+)\)/g, "supabase.from('$1').select('*').order('created_date', { ascending: false }).limit($2).then(res => res.data || [])");

  // 3. Replace base44.entities.X.list()
  content = content.replace(/base44\.entities\.([A-Za-z]+)\.list\(\)/g, "supabase.from('$1').select('*').then(res => res.data || [])");

  // 4. Replace base44.entities.X.filter({ ... }, '-created_date', N)
  content = content.replace(/base44\.entities\.([A-Za-z]+)\.filter\(([^,]+),\s*['"]-created_date['"],\s*(\d+)\)/g, "supabase.from('$1').select('*').match($2).order('created_date', { ascending: false }).limit($3).then(res => res.data || [])");

  // 5. Replace base44.entities.X.filter({ ... })
  content = content.replace(/base44\.entities\.([A-Za-z]+)\.filter\(([^)]+)\)/g, "supabase.from('$1').select('*').match($2).then(res => res.data || [])");

  // 6. Replace base44.entities.X.create({ ... })
  content = content.replace(/base44\.entities\.([A-Za-z]+)\.create\(([^)]+)\)/g, "supabase.from('$1').insert($2)");

  // 7. Replace base44.entities.X.update(id, { ... })
  content = content.replace(/base44\.entities\.([A-Za-z]+)\.update\(([^,]+),\s*([^)]+)\)/g, "supabase.from('$1').update($3).eq('id', $2)");

  // 8. Replace base44.entities.X.delete(id)
  content = content.replace(/base44\.entities\.([A-Za-z]+)\.delete\(([^)]+)\)/g, "supabase.from('$1').delete().eq('id', $2)");

  fs.writeFileSync(filePath, content, 'utf8');
}

walkSync(path.join(process.cwd(), 'src'), processFile);
console.log('Migration complete!');
