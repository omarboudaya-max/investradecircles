import React from 'react';
import { motion } from 'framer-motion';

export default function GlobalLoader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"
    >
      <div className="relative flex flex-col items-center">
        {/* Glow effect behind the logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-32 h-32 bg-blue-500 rounded-full blur-[50px] -z-10"
        />

        {/* The Animated Logo */}
        <div className="w-24 h-24 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden relative">
          {/* Subtle spinning border inside the circle */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-white/20"
          />

          <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
            <defs>
              <linearGradient id="loaderIGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <radialGradient id="loaderDotGrad" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="100%" stopColor="#3b82f6" />
              </radialGradient>
            </defs>

            {/* Stem drawing animation */}
            <motion.rect
              x="13" y="13" width="6" height="14" rx="3"
              stroke="url(#loaderIGrad)"
              strokeWidth="1.5"
              fill="transparent"
              initial={{ pathLength: 0, opacity: 1 }}
              animate={{ pathLength: 1, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {/* Stem fill fade in */}
            <motion.rect
              x="13" y="13" width="6" height="14" rx="3"
              fill="url(#loaderIGrad)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
            />

            {/* Dot drawing animation */}
            <motion.circle
              cx="16" cy="7" r="3.5"
              stroke="url(#loaderDotGrad)"
              strokeWidth="1.5"
              fill="transparent"
              initial={{ pathLength: 0, opacity: 1 }}
              animate={{ pathLength: 1, opacity: 0 }}
              transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
            />
            {/* Dot fill fade in */}
            <motion.circle
              cx="16" cy="7" r="3.5"
              fill="url(#loaderDotGrad)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8, ease: "easeOut" }}
            />
          </svg>
        </div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          className="mt-6 flex flex-col items-center"
        >
          <h2 className="text-xl font-bold text-white tracking-wider">INVESTRADERS</h2>
          <div className="flex items-center gap-1 mt-2">
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
