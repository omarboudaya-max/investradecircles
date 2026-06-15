import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const FRIEND_AVATARS = [
  { initials: 'A', color: '#7EB5D6', img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face' },
  { initials: 'B', color: '#E8A87C', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face' },
  { initials: 'C', color: '#6BAF92', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
  { initials: 'D', color: '#D4A5C9', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
  { initials: 'E', color: '#F0C987', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face' },
  { initials: 'F', color: '#9BB5CE', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face' },
  { initials: 'G', color: '#E8927C', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face' },
  { initials: 'H', color: '#8DB8A3', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&crop=face' },
  { initials: 'I', color: '#C9A5D4', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop&crop=face' },
  { initials: 'J', color: '#B5C99B', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face' },
];

export default function ProfileRing({ user }) {
  const SLOTS = 10;
  const positions = useMemo(() => {
    return Array.from({ length: SLOTS }).map((_, i) => {
      const angle = (i / SLOTS) * 360 - 90;
      const rad = (angle * Math.PI) / 180;
      const radius = 130;
      return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
    });
  }, []);

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex flex-col items-center pt-6 pb-4">
      {/* Name & stars */}
      <h2 className="text-2xl font-bold mb-1" style={{ color: '#3B9EE8' }}>{displayName}</h2>
      <div className="flex items-center gap-1 mb-6">
        <div className="w-12 h-0.5 bg-blue-300 rounded" />
        <span className="text-yellow-400 text-xl">★</span>
        <span className="text-yellow-400 text-xl">★</span>
        <span className="text-yellow-400 text-xl">★</span>
        <div className="w-12 h-0.5 bg-blue-300 rounded" />
      </div>

      {/* Ring visual */}
      <div className="relative" style={{ width: 320, height: 320 }}>
        {/* Dashed outer ring */}
        <div className="absolute inset-0 rounded-full" style={{ border: '2px dashed rgba(100,160,220,0.4)' }} />

        {/* Solid blue ring */}
        <div className="absolute rounded-full" style={{ inset: 22, border: '2.5px solid rgba(59,158,232,0.6)' }} />

        {/* Center avatar */}
        <div
          className="absolute rounded-full overflow-hidden border-4 border-white shadow-xl"
          style={{ inset: 52, background: '#e0eaf5' }}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-blue-400">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Friend avatars on ring */}
        {positions.map((pos, i) => {
          const friend = FRIEND_AVATARS[i % FRIEND_AVATARS.length];
          return (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 220 }}
              className="absolute"
              style={{
                left: `calc(50% + ${pos.x}px - 22px)`,
                top: `calc(50% + ${pos.y}px - 22px)`,
                width: 44,
                height: 44,
              }}
            >
              <img
                src={friend.img}
                alt=""
                className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div
                className="w-11 h-11 rounded-full border-2 border-white shadow-md items-center justify-center text-white text-xs font-bold hidden"
                style={{ background: friend.color }}
              >
                {friend.initials}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}