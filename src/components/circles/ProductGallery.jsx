import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Tag, Star, ChevronLeft, ChevronRight, X, ExternalLink, Flame, BarChart2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ProductSentiment from '@/components/circles/ProductSentiment';
import SaveProductButton from '@/components/circles/SaveProductButton';

// Track a product click — fire-and-forget, no await needed in UI
function trackClick(circleId, productCategory, brandName, userId) {
  supabase.from('ProductClick').insert({
    circle_id: circleId,
    product_category: productCategory,
    brand_name: brandName,
    user_id: userId || null,
  }).catch(() => {});
  console.log('Analytics Event: ', {
    eventName: 'product_gallery_click',
    properties: { circle_id: circleId, product_category: productCategory },
  });
}

function HotBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
      <Flame className="w-2.5 h-2.5" /> HOT
    </span>
  );
}

function ProductCard({ product, websiteUrl, onClick, clickCount, isHot, isDark }) {
  const [imgFailed, setImgFailed] = useState(false);

  const darkGradients = [
    'linear-gradient(135deg,#1e3a5f,#0f1e3a)',
    'linear-gradient(135deg,#2d1b4e,#0f1e3a)',
    'linear-gradient(135deg,#1a3a2a,#0f1e3a)',
    'linear-gradient(135deg,#3a1a1a,#0f1e3a)',
    'linear-gradient(135deg,#1a2a3a,#0a1428)',
  ];
  const lightGradients = [
    'linear-gradient(135deg,#fffbf0,#f7ebd0)',
    'linear-gradient(135deg,#fffdf5,#ebdcb9)',
    'linear-gradient(135deg,#fffefb,#ebdcb9)',
    'linear-gradient(135deg,#fffdf7,#e0cf9f)',
    'linear-gradient(135deg,#fffbf2,#dbcb9e)',
  ];
  const gradients = isDark ? darkGradients : lightGradients;
  const gradientIndex = (product.category?.charCodeAt(0) || 0) % gradients.length;
  const bg = gradients[gradientIndex];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(product)}
      className="cursor-pointer rounded-xl overflow-hidden border flex flex-col transition-all duration-300"
      style={{
        background: bg,
        borderColor: isDark 
          ? (isHot ? 'rgba(251,146,60,0.5)' : 'rgba(251,146,60,0.2)') 
          : (isHot ? 'rgba(180,120,20,0.5)' : 'rgba(180,120,20,0.25)'),
        minHeight: 180,
        boxShadow: isHot ? (isDark ? '0 0 12px rgba(251,146,60,0.15)' : '0 0 12px rgba(180,120,20,0.12)') : undefined,
      }}
    >
      {/* Image area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden" style={{ minHeight: 110 }}>
        {product.image_url && !imgFailed ? (
          <img
            src={product.image_url}
            alt={product.category}
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover"
            style={{ maxHeight: 120 }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full py-4 gap-2">
            <ShoppingBag className={`w-8 h-8 ${isDark ? 'text-orange-400/40' : 'text-amber-800/40'}`} />
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-orange-300/30' : 'text-amber-800/50'}`}>{product.category}</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          {isHot && <HotBadge />}
        </div>
        {product.price_range && (
          <span className={`absolute top-2 right-2 text-[10px] font-bold border rounded-full px-1.5 py-0.5 backdrop-blur-sm ${
            isDark ? 'text-emerald-400 border-emerald-400/30 bg-black/40' : 'text-emerald-800 border-emerald-600/30 bg-white/70'
          }`}>
            {product.price_range}
          </span>
        )}
        {clickCount > 0 && (
          <span className={`absolute bottom-2 right-2 text-[9px] font-semibold ${isDark ? 'text-white/40' : 'text-stone-500'}`}>
            {clickCount} view{clickCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Card footer */}
      <div 
        className="px-3 py-2.5 border-t transition-colors" 
        style={{ 
          borderColor: isDark ? 'rgba(251,146,60,0.12)' : 'rgba(180,120,20,0.15)', 
          background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.45)' 
        }}
      >
        <div className="flex items-center gap-1.5">
          <Tag className={`w-3 h-3 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
          <span className={`text-[11px] font-semibold truncate ${isDark ? 'text-white' : 'text-stone-900'}`}>{product.category}</span>
        </div>
        {product.featured_items?.length > 0 && (
          <p className={`text-[10px] mt-0.5 truncate ${isDark ? 'text-blue-300/50' : 'text-stone-600'}`}>{product.featured_items.slice(0, 2).join(' · ')}</p>
        )}
      </div>
    </motion.div>
  );
}

function ProductModal({ product, websiteUrl, onClose, circleId, currentUser, brandName, isDark }) {
  if (!product) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm flex flex-col transition-all duration-300"
          style={{
            background: isDark ? 'linear-gradient(160deg,#0a0f1e,#0f1e3a)' : 'linear-gradient(160deg,#fffdf6,#f7efe0)',
            border: isDark ? '1px solid rgba(251,146,60,0.3)' : '1px solid rgba(180,120,20,0.35)',
            maxHeight: '90vh',
          }}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: isDark ? 'rgba(251,146,60,0.15)' : 'rgba(180,120,20,0.15)' }}>
            <span className={`font-bold text-base truncate pr-2 ${isDark ? 'text-white' : 'text-stone-900'}`}>{product.category}</span>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100'
              }`}
              style={{ border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative h-40 flex items-center justify-center overflow-hidden shrink-0" style={{ background: isDark ? 'linear-gradient(135deg,#1e3a5f,#0f1e3a)' : 'linear-gradient(135deg,#fcf8f0,#ebdcb9)' }}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.category} className="w-full h-full object-cover" />
            ) : (
              <ShoppingBag className={`w-16 h-16 ${isDark ? 'text-orange-400/30' : 'text-amber-800/30'}`} />
            )}
            <div className={`absolute inset-0 bg-gradient-to-t to-transparent ${isDark ? 'from-[#0a0f1e]' : 'from-[#fffdf6]'}`} />
          </div>

          <div className="p-5 space-y-3 overflow-y-auto flex-1">
            {product.price_range && (
              <div>
                <span className={`font-bold text-sm border rounded-full px-3 py-1 ${
                  isDark ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' : 'text-emerald-800 border-emerald-600/30 bg-emerald-600/10'
                }`}>
                  {product.price_range}
                </span>
              </div>
            )}

            {product.description && (
              <p className={`text-sm leading-relaxed ${isDark ? 'text-blue-300/70' : 'text-stone-700'}`}>{product.description}</p>
            )}

            {product.featured_items?.length > 0 && (
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Featured Products</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.featured_items.map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border"
                      style={isDark 
                        ? { background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: '#fcd34d' }
                        : { background: 'rgba(180,120,20,0.08)', borderColor: 'rgba(180,120,20,0.2)', color: '#854d0e' }
                      }
                    >
                      <Star className="w-2.5 h-2.5" />{item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-colors"
                  style={isDark
                    ? { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }
                    : { background: 'rgba(180,120,20,0.1)', color: '#854d0e', border: '1px solid rgba(180,120,20,0.25)' }
                  }
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-4 h-4" /> Shop
                </a>
              )}
              <SaveProductButton
                userId={currentUser?.id}
                circleId={circleId}
                productCategory={product.category}
                brandName={brandName}
                priceRange={product.price_range}
                isDark={isDark}
              />
            </div>

            {/* Sentiment comments */}
            <div className="border-t pt-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,120,20,0.15)' }}>
              <ProductSentiment
                circleId={circleId}
                productCategory={product.category}
                currentUser={currentUser}
                isDark={isDark}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ClickLeaderboard({ clickMap, products, isDark }) {
  const [open, setOpen] = useState(false);

  const ranked = useMemo(() => {
    return [...products]
      .map(p => ({ category: p.category, count: clickMap[p.category] || 0 }))
      .filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [clickMap, products]);

  if (ranked.length === 0) return null;

  const max = ranked[0]?.count || 1;

  return (
    <div className="border-t transition-colors" style={{ borderColor: isDark ? 'rgba(251,146,60,0.12)' : 'rgba(180,120,20,0.15)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 w-full px-4 py-2.5 text-left transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-stone-500/5'}`}
      >
        <BarChart2 className={`w-3.5 h-3.5 ${isDark ? 'text-orange-400' : 'text-amber-700'}`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-orange-300' : 'text-amber-800'}`}>Most Viewed Products</span>
        <span className={`ml-auto text-[10px] ${isDark ? 'text-blue-300/40' : 'text-stone-500'}`}>{open ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {ranked.map((item, i) => (
                <div key={item.category} className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold w-4 shrink-0 ${isDark ? 'text-amber-400/70' : 'text-amber-700'}`}>#{i + 1}</span>
                  <span className={`text-[11px] w-28 truncate shrink-0 ${isDark ? 'text-white/80' : 'text-stone-800'}`}>{item.category}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / max) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      className="h-full rounded-full"
                      style={{ background: i === 0 ? (isDark ? 'linear-gradient(90deg,#f59e0b,#fb923c)' : 'linear-gradient(90deg,#d97706,#b45309)') : (isDark ? 'rgba(251,146,60,0.5)' : 'rgba(180,120,20,0.5)') }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold w-6 text-right shrink-0 ${isDark ? 'text-orange-400/70' : 'text-amber-700'}`}>{item.count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductGallery({ products, websiteUrl, brandName, tagline, circleId, userId, user, isDark }) {
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState('All');
  const PER_PAGE = 4;

  const categories = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products]);

  const filtered = useMemo(() =>
    activeFilter === 'All' ? products : products.filter(p => p.category === activeFilter),
    [products, activeFilter]
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  // Fetch click counts for this circle
  const { data: clicks = [] } = useQuery({
    queryKey: ['product-clicks', circleId],
    queryFn: () => supabase.from('ProductClick').select('*').match({ circle_id: circleId }).then(res => res.data || []),
    staleTime: 30 * 1000,
    enabled: !!circleId,
  });

  // Build a map of category -> count
  const clickMap = useMemo(() => {
    const map = {};
    clicks.forEach(c => {
      map[c.product_category] = (map[c.product_category] || 0) + 1;
    });
    return map;
  }, [clicks]);

  const maxClicks = Math.max(...Object.values(clickMap), 0);
  const hotThreshold = maxClicks > 0 ? maxClicks * 0.6 : Infinity;

  function handleFilterChange(cat) {
    setActiveFilter(cat);
    setPage(0);
  }

  function handleCardClick(product) {
    if (circleId) trackClick(circleId, product.category, brandName, userId);
    setSelected(product);
  }

  return (
    <div className="rounded-xl border overflow-hidden transition-all duration-300" style={{ background: isDark ? 'rgba(251,146,60,0.05)' : 'rgba(180,120,20,0.03)', borderColor: isDark ? 'rgba(251,146,60,0.2)' : 'rgba(180,120,20,0.18)' }}>
      {/* Gallery Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b transition-colors" style={{ borderColor: isDark ? 'rgba(251,146,60,0.15)' : 'rgba(180,120,20,0.15)', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)' }}>
        <div className="flex items-center gap-2">
          <ShoppingBag className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-amber-700'}`} />
          <span className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-orange-300' : 'text-amber-950'}`}>Product Gallery</span>
          <span className={`text-[10px] font-semibold ml-1 ${isDark ? 'text-orange-400/50' : 'text-amber-800/60'}`}>{products.length} categories</span>
        </div>
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-[11px] font-semibold ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-700 hover:text-amber-900'}`}
          >
            <ExternalLink className="w-3 h-3" /> Shop
          </a>
        )}
      </div>

      {tagline && (
        <p className={`px-4 pt-3 pb-0 text-xs italic ${isDark ? 'text-amber-300/60' : 'text-amber-900/70'}`}>"{tagline}"</p>
      )}

      {/* Category Filter */}
      {categories.length > 2 && (
        <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleFilterChange(cat)}
              className="shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full border transition-all"
              style={activeFilter === cat
                ? (isDark 
                    ? { background: 'rgba(245,158,11,0.2)', borderColor: 'rgba(245,158,11,0.5)', color: '#fbbf24' }
                    : { background: 'rgba(180,120,20,0.15)', borderColor: 'rgba(180,120,20,0.4)', color: '#78350f' })
                : (isDark 
                    ? { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(147,197,253,0.6)' }
                    : { background: 'rgba(255,255,255,0.6)', borderColor: 'rgba(180,120,20,0.15)', color: 'rgba(120,53,4,0.7)' })
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((product, i) => {
          const count = clickMap[product.category] || 0;
          const isHot = count >= hotThreshold && count > 0;
          return (
            <ProductCard
              key={i}
              product={product}
              websiteUrl={websiteUrl}
              onClick={handleCardClick}
              clickCount={count}
              isHot={isHot}
              isDark={isDark}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pb-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className={`w-7 h-7 rounded-full flex items-center justify-center border text-white/50 disabled:opacity-30 transition-colors ${
              isDark 
                ? 'border-white/10 text-white/50 hover:text-white hover:border-white/30' 
                : 'border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-500'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`text-[10px] ${isDark ? 'text-blue-300/50' : 'text-stone-600'}`}>{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className={`w-7 h-7 rounded-full flex items-center justify-center border text-white/50 disabled:opacity-30 transition-colors ${
              isDark 
                ? 'border-white/10 text-white/50 hover:text-white hover:border-white/30' 
                : 'border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-500'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Click leaderboard */}
      <ClickLeaderboard clickMap={clickMap} products={products} isDark={isDark} />

      {/* Product Detail Modal */}
      {selected && (
        <ProductModal
          product={selected}
          websiteUrl={websiteUrl}
          onClose={() => setSelected(null)}
          circleId={circleId}
          currentUser={user || { id: userId }}
          brandName={brandName}
          isDark={isDark}
        />
      )}
    </div>
  );
}
