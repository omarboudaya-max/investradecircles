import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function ImageLightbox({ src, alt = '', onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const touchStartDist = useRef(null);
  const initialScale = useRef(1);
  const lastTap = useRef(0);
  const dragStart = useRef(null);
  const initialPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Touch handlers for 2-finger pinch zoom & 1-finger panning
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      // 2-Finger Pinch Start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
      initialScale.current = scale;
    } else if (e.touches.length === 1) {
      // Double tap check
      const now = Date.now();
      if (now - lastTap.current < 300) {
        // Toggle double-tap zoom
        if (scale > 1.2) {
          setScale(1);
          setPosition({ x: 0, y: 0 });
        } else {
          setScale(2.5);
        }
      }
      lastTap.current = now;

      // Pan drag start
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialPos.current = { ...position };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist.current) {
      // 2-Finger Pinch Zooming
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const zoomRatio = dist / touchStartDist.current;
      const newScale = Math.min(Math.max(initialScale.current * zoomRatio, 1), 4);
      setScale(newScale);
    } else if (e.touches.length === 1 && dragStart.current && scale > 1) {
      // 1-Finger Panning when zoomed in
      const deltaX = e.touches[0].clientX - dragStart.current.x;
      const deltaY = e.touches[0].clientY - dragStart.current.y;
      setPosition({
        x: initialPos.current.x + deltaX,
        y: initialPos.current.y + deltaY,
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      touchStartDist.current = null;
    }
    if (e.touches.length === 0) {
      dragStart.current = null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center touch-none overflow-hidden select-none"
      onClick={onClose}
    >
      {/* Top Close Button (Only close icon, no zoom buttons) */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shadow-lg"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div
        className="max-w-[95vw] max-h-[95vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl transition-transform duration-75"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
