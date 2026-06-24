import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import BottomNav from './BottomNav';
import { useAuth } from '@/lib/AuthContext';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export default function AppLayout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Global realtime listener for Posts (likes, new posts)
    const channel = supabase.channel('global:Post')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Post' }, () => {
        // Debounce or just invalidate. React Query handles deduplication well.
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['circle-feed-posts'] });
        queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <div className="min-h-screen bg-background">
      {/* Container with pb-16 on mobile to account for BottomNav */}
      <div className="max-w-[1440px] mx-auto px-4 pt-4 pb-20 lg:pb-4">
        <div className="flex flex-col rounded-2xl border-4 border-blue-600 dark:border-gray-800 shadow-xl shadow-primary/20 overflow-hidden bg-background min-h-[calc(100vh-2rem)]">
          <Navbar user={user} />
          <div className="flex flex-1 min-h-0">
            <Sidebar />
            <main className="flex-1 min-w-0 p-4">
              <Outlet />
            </main>
            <RightPanel />
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
