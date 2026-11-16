// LOCAL TEST HARNESS ONLY: serves the app with a fictional signed-in user and a
// read-only database client, on a separate port. Not used by `npm run dev` or the build.
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

export default defineConfig({
  root,
  plugins: [react()],
  cacheDir: path.resolve(here, '.vite-cache'),
  server: { port: 5174, strictPort: true },
  resolve: {
    alias: [
      { find: '@/lib/AuthContext', replacement: path.resolve(here, 'AuthContext.stub.jsx') },
      { find: '@/lib/supabase', replacement: path.resolve(here, 'supabase.stub.js') },
      { find: '@', replacement: path.resolve(root, 'src') },
    ],
  },
});
