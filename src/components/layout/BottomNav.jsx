import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Globe, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { triggerHaptic } from '@/utils/haptics';

export default function BottomNav() {
  const location = useLocation();
  const t = useTranslation();
  const [hideNav, setHideNav] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Hide nav inside messages page or active chat
    const searchParams = new URLSearchParams(location.search);
    const inMessages = location.pathname === '/messages';
    const hasActiveChat = inMessages && (searchParams.has('with') || window.__activeChatOpen);
    setHideNav(inMessages || hasActiveChat);
  }, [location]);

  useEffect(() => {
    // Detect soft keyboard popping up when typing in inputs/textareas
    const handleFocusIn = (e) => {
      const tagName = e.target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || e.target?.isContentEditable) {
        setIsKeyboardVisible(true);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardVisible(false);
    };

    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  if (hideNav || isKeyboardVisible) {
    return null;
  }

  const NAV_ITEMS = [
    { label: t.bottomNav.home, icon: Home, path: '/home' },
    { label: t.bottomNav.allCircles, icon: Globe, path: '/all-circles' },
    { label: t.bottomNav.create, icon: PlusCircle, path: '/create-circle' },
    { label: t.bottomNav.myCircles, icon: Users, path: '/my-circles' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-around h-16 px-3">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path || (item.path === '/home' && location.pathname === '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => triggerHaptic('light')}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                active 
                  ? 'bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold scale-105 shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform ${active ? 'fill-blue-600/20 text-blue-600 dark:text-blue-400 scale-110' : ''}`} />
              <span className="text-[10px] font-semibold mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
