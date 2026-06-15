import React from 'react';
import { Link } from 'react-router-dom';
import { X, Home, PlusCircle, Users, MessageCircle, Bookmark, User, Globe, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const shortcuts = [
  { label: 'Home', icon: Home, path: '/', color: 'bg-blue-500' },
  { label: 'Create Circle', icon: PlusCircle, path: '/create-circle', color: 'bg-emerald-500' },
  { label: 'My Circles', icon: Users, path: '/my-circles', color: 'bg-purple-500' },
  { label: 'All Circles', icon: Globe, path: '/all-circles', color: 'bg-orange-500' },
  { label: 'Messages', icon: MessageCircle, path: '/messages', color: 'bg-pink-500' },
  { label: 'Saved Posts', icon: Bookmark, path: '/saved', color: 'bg-amber-500' },
  { label: 'My Profile', icon: User, path: '/profile', color: 'bg-cyan-500' },
];

export default function ShortcutsModal({ open, onClose, user }) {
  const isAdmin = user?.role === 'admin';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Quick Shortcuts</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {shortcuts.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-foreground text-center leading-tight">
                    {item.label}
                  </span>
                </Link>
              ))}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-11 h-11 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                    <Shield className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-foreground text-center leading-tight">
                    Admin
                  </span>
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}