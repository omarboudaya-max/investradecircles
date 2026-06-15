import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ImageIcon, X } from 'lucide-react';

export default function PhotosCard({ userId }) {
  const [lightbox, setLightbox] = useState(null);

  const { data: posts = [] } = useQuery({
    queryKey: ['user-posts-photos', userId],
    queryFn: () => supabase.from('Post').select('*').match({ created_by_id: userId }).then(res => res.data || []),
    enabled: !!userId,
  });

  const photos = posts.filter((p) => p.image_url).map((p) => p.image_url);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" /> Photos
          </h3>
          <span className="text-xs text-muted-foreground">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {photos.slice(0, 6).map((src, i) => (
            <button
              key={i}
              onClick={() => setLightbox(src)}
              className="aspect-square rounded-xl overflow-hidden focus:outline-none"
            >
              <img src={src} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </button>
          ))}
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full">
            <X className="w-6 h-6" />
          </button>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}