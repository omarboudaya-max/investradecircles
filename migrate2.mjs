import fs from 'fs';
import path from 'path';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('base44')) return;

  console.log('Processing:', filePath);

  // InvokeLLM -> supabase.functions.invoke
  content = content.replace(/base44\.integrations\.Core\.InvokeLLM\(/g, "supabase.functions.invoke('invoke-llm', { body: ");
  // Note: the LLM call was base44.integrations.Core.InvokeLLM({...}), so turning it into
  // supabase.functions.invoke('invoke-llm', { body: {...} }) requires fixing the closing brace.
  // Wait, I can just replace `await base44.integrations.Core.InvokeLLM({` with `await supabase.functions.invoke('invoke-llm', { body: {`
  // But there's a trailing '})' we need to catch? Let's just do a simple replace and fix the bracket.
  content = content.replace(/await base44\.integrations\.Core\.InvokeLLM\(\{([\s\S]*?)\}\);/g, "await supabase.functions.invoke('invoke-llm', { body: {$1} });");

  // Analytics -> console.log
  content = content.replace(/base44\.analytics\.track\(/g, "console.log('Analytics Event: ', ");

  // app-params and app-url
  content = content.replace(/base44/g, "supabase");
  content = content.replace(/BASE44/g, "SUPABASE");

  fs.writeFileSync(filePath, content, 'utf8');
}

[
  'src/components/circles/ProductSentiment.jsx',
  'src/components/circles/InstitutionalCircleLayout.jsx',
  'src/components/circles/ProductGallery.jsx',
  'src/lib/logger.js',
  'src/lib/app-params.js',
  'src/lib/app-url.js'
].forEach(f => {
  const p = path.join(process.cwd(), f);
  if (fs.existsSync(p)) processFile(p);
});
