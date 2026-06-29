import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Globe, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function BottomNav() {
  const location = useLocation();
  const t = useTranslation();

  const NAV_ITEMS = [
    { label: t.bottomNav.home, icon: Home, path: '/home' },
    { label: t.bottomNav.allCircles, icon: Globe, path: '/all-circles' },
    { label: t.bottomNav.create, icon: PlusCircle, path: '/create-circle' },
    { label: t.bottomNav.myCircles, icon: Users, path: '/my-circles' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path || (item.path === '/home' && location.pathname === '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'fill-primary/20' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
