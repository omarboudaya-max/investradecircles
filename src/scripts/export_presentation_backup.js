import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://earhypzdxwbohdncdzvz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcmh5cHpkeHdib2hkbmNkenZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mzg2OTksImV4cCI6MjA5NzExNDY5OX0.gMKrm7I88A5N-9YS_bi1HnMN1nrVfXMU7ilgrHGGgXw'
);

async function exportBackup() {
  console.log('📦 Starting Presentation Snapshot & Data Backup...');
  
  const [circlesRes, postsRes, eventsRes, marketRes, projectsRes] = await Promise.all([
    supabase.from('Circle').select('*'),
    supabase.from('Post').select('*').order('created_date', { ascending: false }).limit(50),
    supabase.from('CircleEvent').select('*').eq('status', 'approved'),
    supabase.from('MarketData').select('*'),
    supabase.from('InvestmentProject').select('*').limit(20)
  ]);

  const backupData = {
    timestamp: new Date().toISOString(),
    event_focus: 'Colloque 13 Octobre 2026 — Siège UTICA',
    counts: {
      circles: circlesRes.data?.length || 0,
      posts: postsRes.data?.length || 0,
      events: eventsRes.data?.length || 0,
      market_data: marketRes.data?.length || 0,
      projects: projectsRes.data?.length || 0
    },
    circles: circlesRes.data || [],
    posts: postsRes.data || [],
    events: eventsRes.data || [],
    market_data: marketRes.data || [],
    projects: projectsRes.data || []
  };

  const outputPath = 'src/data/presentation_backup.json';
  fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✅ Backup successfully saved to ${outputPath}!`);
  console.log(`Summary: ${backupData.counts.circles} circles, ${backupData.counts.posts} posts, ${backupData.counts.events} events, ${backupData.counts.market_data} market records.`);
}

exportBackup();
