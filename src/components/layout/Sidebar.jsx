import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Globe, Eye, Pencil, Users } from 'lucide-react';
import CircleIcon from '@/components/circles/CircleIcon';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const t = useTranslation();
  const { isArabic } = useLanguage();

  const NAV_ITEMS = [
    { label: t.sidebar.home, icon: Home, path: '/home' },
    { label: t.sidebar.createCircle, icon: PlusCircle, path: '/create-circle' },
    { label: t.sidebar.myCircles, icon: Users, path: '/my-circles' },
    { label: t.sidebar.allCircles, icon: Globe, path: '/all-circles' },
  ];

  const { data: createdCircles = [] } = useQuery({
    queryKey: ['sidebar-created-circles', user?.id],
    queryFn: () => supabase.from('Circle').select('*').match({ created_by_id: user?.id }).order('created_date', { ascending: false }).limit(20).then(res => res.data || []),
    enabled: !!user?.id,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () =>
      supabase.from('Notification').select('*').match({ user_id: user?.id, is_read: false }).then(res => res.data || []),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  return (
    <aside className={`hidden lg:block w-64 shrink-0 sticky top-0 h-[calc(100vh-6rem)] overflow-y-auto p-4 ${isArabic ? 'text-right' : 'text-left'}`}>
      {/* Navigation */}
      <nav className="space-y-1 mb-6">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
              {active && <div className={`w-1.5 h-1.5 rounded-full bg-primary ${isArabic ? 'mr-auto' : 'ml-auto'}`} />}
            </Link>
          );
        })}
      </nav>

      {/* Your Circles */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between px-3 mb-3">
          <h3 className="text-sm font-semibold text-foreground">{t.sidebar.yourCreatedCircles}</h3>
          <Link to="/my-circles?filter=created" className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Eye className="w-3 h-3 text-primary" />
          </Link>
        </div>

        <div className="space-y-2">
          {createdCircles.slice(0, 5).map((circle) => {
            const unreadCount = notifications.filter(n => n.circle_id === circle.id).length;
            return (
              <Link
                key={circle.id}
                to={`/circle/${circle.id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors group"
              >
                <CircleIcon category={circle.category} size="md" websiteUrl={circle.website_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                    {circle.name}
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{circle.description || t.sidebar.noDescription}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </Link>
            );
          })}
        </div>

        {createdCircles.length > 5 && (
          <Link to="/my-circles?filter=created" className="flex items-center gap-1 px-3 mt-3 text-sm text-primary hover:underline font-medium">
            {t.sidebar.viewAllCircles}
          </Link>
        )}
      </div>
    </aside>
  );
}
