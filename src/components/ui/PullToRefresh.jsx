import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';

export default function PullToRefresh({ onRefresh, children }) {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef(null);

  const PULL_THRESHOLD = 70;

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY > 0 && window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, (currentY - startY) * 0.45);
      if (distance > 0) {
        setPullDistance(distance);
        if (distance >= PULL_THRESHOLD && pullDistance < PULL_THRESHOLD) {
          triggerHaptic('light');
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      triggerHaptic('medium');
      if (onRefresh) {
        await onRefresh();
      }
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
        setStartY(0);
      }, 500);
    } else {
      setPullDistance(0);
      setStartY(0);
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      {/* Refresh Spinner Header */}
      <div
        className="flex items-center justify-center transition-all overflow-hidden"
        style={{
          height: refreshing ? `${PULL_THRESHOLD}px` : `${pullDistance}px`,
          opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
        }}
      >
        <div className="w-9 h-9 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-primary">
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
        </div>
      </div>

      {children}
    </div>
  );
}
