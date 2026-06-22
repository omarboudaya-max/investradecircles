import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Megaphone, Newspaper, LayoutList,
  BarChart2, Globe, Users, Plus, Send, MessageCircle,
  ChevronUp, ChevronDown, Landmark, Sparkles,
  Target, Eye, BookOpen, Briefcase, ShoppingBag,
  Sun, Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import VerifiedBadge from '@/components/circles/VerifiedBadge';
import ProductGallery from '@/components/circles/ProductGallery';
import CircleFeed from '@/components/circles/CircleFeed';
import CircleLeaderboard from '@/components/circles/CircleLeaderboard';
import CircleEventCalendar from '@/components/circles/CircleEventCalendar';
import CircleMemberRoles from '@/components/circles/CircleMemberRoles';
import CircleAdminDashboard from '@/components/circles/CircleAdminDashboard';
import CircleVisual from '@/components/circles/CircleVisual';
import CircleMonetization from '@/components/circles/CircleMonetization';

function formatPrice(symbol, price) {
  if (!price && price !== 0) return '—';
  const crypto = ['BTC/USD', 'ETH/USD'];
  const forex = ['EUR/USD'];
  const tunisian = ['SFBT', 'BIAT', 'BT', 'SAH', 'PGH', 'DH', 'TRE', 'TLNET'];
  if (crypto.includes(symbol)) return `$${Number(price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (forex.includes(symbol)) return Number(price).toFixed(4);
  if (symbol === 'GOLD' || symbol === 'OIL (WTI)') return `$${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (symbol === 'TUNINDEX') return Number(price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (tunisian.includes(symbol)) return `${Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`;
  return Number(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const DEFAULT_MARKET_DATA = [
  { symbol: 'S&P 500', price: 7492.79, change_pct: -0.25 },
  { symbol: 'NASDAQ', price: 26337.33, change_pct: -0.15 },
  { symbol: 'DOW', price: 51753.28, change_pct: -0.47 },
  { symbol: 'GOLD', price: 4268.50, change_pct: -2.07 },
  { symbol: 'OIL (WTI)', price: 73.19, change_pct: -4.69 },
  { symbol: 'EUR/USD', price: 1.1476, change_pct: -1.15 },
  { symbol: 'BTC/USD', price: 63854.00, change_pct: -1.92 },
  { symbol: 'ETH/USD', price: 1738.66, change_pct: -0.94 },
  { symbol: 'TUNINDEX', price: 18520.00, change_pct: 1.15 },
  { symbol: 'SFBT', price: 14.11, change_pct: 0.36 },
  { symbol: 'BIAT', price: 158.00, change_pct: 0.51 },
  { symbol: 'BT', price: 8.74, change_pct: 4.05 },
  { symbol: 'SAH', price: 14.25, change_pct: 1.06 },
  { symbol: 'PGH', price: 27.70, change_pct: -1.91 },
  { symbol: 'DH', price: 19.64, change_pct: -0.30 },
  { symbol: 'TRE', price: 13.20, change_pct: 1.54 },
  { symbol: 'TLNET', price: 10.65, change_pct: 1.24 }
];

function TickerItem({ t, isDark }) {
  const up = (t.change_pct || 0) >= 0;
  return (
    <div className="flex items-center gap-1.5 shrink-0 px-5">
      <span className={`${isDark ? 'text-blue-300/80' : 'text-stone-600'} text-[11px] font-semibold`}>{t.symbol}</span>
      <span className={`${isDark ? 'text-white' : 'text-slate-950'} text-[11px] font-bold`}>{formatPrice(t.symbol, t.price)}</span>
      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${up ? 'text-emerald-500 font-extrabold' : 'text-red-500 font-extrabold'}`}>
        {up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
        {t.change_pct != null ? `${up ? '+' : ''}${Number(t.change_pct).toFixed(2)}%` : '—'}
      </span>
      <span className={`${isDark ? 'text-blue-300/20' : 'text-stone-300'} text-[10px] ml-3`}>|</span>
    </div>
  );
}

function MarketTicker({ marketData, isDark }) {
  const items = marketData || [];
  // Duplicate items so the scroll loops seamlessly
  const doubled = [...items, ...items];

  return (
    <div
      className="market-ticker-band w-full overflow-hidden py-2 border-b cursor-pointer transition-colors duration-300"
      style={{ 
        background: isDark 
          ? 'linear-gradient(90deg,#0a0f1e,#112240)' 
          : 'linear-gradient(90deg,#fcf8f0,#ebdcb9)',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,120,20,0.15)'
      }}
    >
      {items.length === 0 ? (
        <span className={`${isDark ? 'text-blue-300/50' : 'text-stone-500'} px-4 text-[11px]`}>Loading market data...</span>
      ) : (
        <div className="ticker-track" style={{ animation: `ticker-scroll ${items.length * 4.5}s linear infinite` }}>
          {doubled.map((t, i) => (
            <TickerItem key={`${t.symbol}-${i}`} t={t} isDark={isDark} />
          ))}
        </div>
      )}
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          flex-wrap: nowrap;
          width: max-content;
        }
        .market-ticker-band:hover .ticker-track {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

function generateProfileFromKeywords(brandType, name, desc, websiteUrl) {
  const isFinance = brandType === 'finance';
  
  const configs = {
    sportswear: {
      isProductBrand: true,
      tagline: 'Empowering athletes and unlocking potential through premium gear.',
      mission: `To bring inspiration and innovation to every active individual, starting with our signature ${name} collection.`,
      vision: 'To build a healthier, more active world through sustainable, high-performance sportswear.',
      goals: [
        'Launch eco-friendly sportswear collections globally.',
        'Partner with local athletic circles to foster community wellness.',
        'Redefine performance apparel limits with thermal fabric technology.'
      ],
      products: [
        {
          category: 'Premium Running Shoes',
          description: 'Responsive cushion design engineered with lightweight breathable mesh for competitive racers.',
          featured_items: [`${name} CloudStrike V1`, `${name} Marathon Pro`],
          price_range: '120–280 TND',
          image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'
        },
        {
          category: 'Athletic Wear & Apparel',
          description: 'Seamless sweat-wicking materials styled for standard workouts or general daily wear.',
          featured_items: ['Dry-Fit Compression Tee', 'Performance Track Jacket'],
          price_range: '60–160 TND',
          image_url: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=600&q=80'
        },
        {
          category: 'Fitness Gears & Bags',
          description: 'Highly durable water-resistant gear designed for active lifestyles.',
          featured_items: ['Active Duffle Bag', 'Premium Gym Shaker'],
          price_range: '30–90 TND',
          image_url: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=600&q=80'
        }
      ]
    },
    tech: {
      isProductBrand: true,
      tagline: 'Leading the future of digital solutions and seamless product design.',
      mission: `To empower people through modern technology and clean, high-performance products by ${name}.`,
      vision: 'To build an interconnected world driven by smart devices and intelligent cloud architecture.',
      goals: [
        'Pioneer advanced neural processing units in consumer devices.',
        'Deliver a secure, zero-trust digital environment for all customers.',
        'Integrate zero-emission hardware recycling across product lines.'
      ],
      products: [
        {
          category: 'Smart Devices & Phones',
          description: 'Cutting edge display tech paired with high-performance processors and pro camera grids.',
          featured_items: [`${name} Nexus 12`, `${name} MiniTab Ultra`],
          price_range: '1800–3500 TND',
          image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
        },
        {
          category: 'Laptops & Workstations',
          description: 'Ultra thin aluminum chassis combined with incredible battery efficiency for digital creators.',
          featured_items: ['Book Pro 15', 'Studio Hub Core'],
          price_range: '2400–5500 TND',
          image_url: 'https://images.unsplash.com/photo-1496181130204-755241524eab?w=600&q=80'
        },
        {
          category: 'Audio & Gadgets',
          description: 'Active noise cancelling wireless earbuds with spatial audio tracking.',
          featured_items: ['Audio Buds Pro', 'Active Tracker 4'],
          price_range: '150–450 TND',
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'
        }
      ]
    },
    fashion: {
      isProductBrand: true,
      tagline: 'Timeless style meets modern elegance and sustainable design.',
      mission: `To provide high-quality, beautifully designed clothes that give everyone the confidence to express themselves.`,
      vision: 'To pioneer the shift towards circular fashion and sustainable supply chains.',
      goals: [
        'Transition to 100% organic cotton and recycled materials.',
        'Launch exclusive collaborations with local design schools.',
        'Inaugurate smart interactive fitting rooms in all major cities.'
      ],
      products: [
        {
          category: 'Designer Apparel',
          description: 'Tailored silhouettes and premium fabrics designed for regular wear and special occasions.',
          featured_items: [`${name} Linen Blazer`, `${name} Knit Sweater`],
          price_range: '80–240 TND',
          image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80'
        },
        {
          category: 'Bags & Accessories',
          description: 'Premium vegan leather bags crafted for modern professionals.',
          featured_items: ['Urban Leather Tote', 'Classic Metal Sunglasses'],
          price_range: '50–180 TND',
          image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80'
        }
      ]
    },
    food: {
      isProductBrand: true,
      tagline: 'Nourishing lives and creating memorable taste experiences.',
      mission: `To deliver healthy, high-quality, and delicious food and beverage products to families everywhere.`,
      vision: 'To be the preferred global brand for premium, sustainably sourced food and beverages.',
      goals: [
        'Source all ingredients from local, verified organic farms.',
        'Reduce packaging footprint by introducing biodegradable materials.',
        'Expand plant-based and low-sugar alternatives across our catalog.'
      ],
      products: [
        {
          category: 'Specialty Beverages',
          description: 'Premium organic brews and natural beverages crafted with fresh, sustainably sourced ingredients.',
          featured_items: [`${name} Cold Brew`, `${name} Citrus Refresh`],
          price_range: '5–18 TND',
          image_url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80'
        },
        {
          category: 'Gourmet Treats',
          description: 'Delectable, locally crafted snacks and chocolates using high-grade cocoa beans.',
          featured_items: ['Dark Almond Bar', 'Honey Grain Granola'],
          price_range: '8–35 TND',
          image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80'
        }
      ]
    },
    automotive: {
      isProductBrand: true,
      tagline: 'Accelerating the transition to sustainable and intelligent mobility.',
      mission: 'To build high-performance electric vehicles and transport systems that protect the planet.',
      vision: 'A world of fully autonomous, zero-emission transportation for everyone.',
      goals: [
        'Double production volume of electric vehicles.',
        'Expand solar-charging supercharger grids across region.',
        'Integrate Level 4 autonomous software updates.'
      ],
      products: [
        {
          category: 'Electric Vehicles',
          description: 'Zero emission vehicles with high acceleration and intelligent auto-pilot navigation.',
          featured_items: [`${name} Volt sedan`, `${name} Horizon SUV`],
          price_range: '80K–180K TND',
          image_url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&q=80'
        },
        {
          category: 'Home Charging Solutions',
          description: 'Smart fast-charging stations designed to mount easily inside home garages.',
          featured_items: ['Rapid Charge Wall Connector', 'Smart Adapters'],
          price_range: '1200–2500 TND',
          image_url: 'https://images.unsplash.com/photo-1558441719-ff34b0524a24?w=600&q=80'
        }
      ]
    },
    finance: {
      isProductBrand: false,
      tagline: 'Votre partenaire de confiance pour sécuriser et valoriser vos investissements.',
      mission: `Soutenir l'essor économique en fournissant des services financiers fiables et innovants à nos membres et institutions.`,
      vision: 'Devenir le leader national de la transformation bancaire numérique et de la finance verte.',
      goals: [
        'Déployer des guichets automatiques 100% numérisés et interactifs.',
        'Lancer des fonds de capital-risque dédiés aux startups.',
        'Garantir un accès fluide et sécurisé aux marchés d’actifs.'
      ],
      services: [
        {
          title: 'Banque de Détail & Comptes',
          description: 'Comptes courants, d’épargne et cartes bancaires internationales adaptés aux professionnels.'
        },
        {
          title: 'Crédits et Financement',
          description: 'Prêts à taux préférentiels pour soutenir le développement des infrastructures et des entreprises.'
        },
        {
          title: 'Négociation & Bourse',
          description: 'Plateforme en ligne pour négocier des actions cotées (SFBT, BIAT, Banque de Tunisie).'
        }
      ]
    },
    general: {
      isProductBrand: true,
      tagline: 'Excellence in service, quality, and community value.',
      mission: `To deliver superior quality and innovative solutions tailored to the modern needs of our customers and partners.`,
      vision: 'To be a trusted partner and household name in quality products and customer support.',
      goals: [
        'Sustain top-tier customer satisfaction ratings.',
        'Continuously innovate our products based on direct circle feedback.',
        'Promote green packaging and sustainable distribution networks.'
      ],
      products: [
        {
          category: 'Featured Products',
          description: 'Our top-rated products designed for utility, value, and everyday comfort.',
          featured_items: [`${name} Eco Choice`, `${name} Classic Collection`],
          price_range: '45–150 TND',
          image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'
        }
      ]
    }
  };

  const selected = configs[brandType] || configs.general;
  
  return {
    name: name,
    is_product_brand: selected.isProductBrand,
    tagline: selected.tagline,
    mission: selected.mission,
    vision: selected.vision,
    goals: selected.goals,
    products: selected.products || [],
    services: selected.services || [],
    news: [
      {
        date: new Date().toLocaleDateString('fr-FR'),
        title: `Actualités : ${name} annonce de nouvelles initiatives stratégiques de développement.`
      },
      {
        date: new Date(Date.now() - 48*3600*1000).toLocaleDateString('fr-FR'),
        title: `Rapport : Expansion positive constatée dans les départements majeurs de ${name}.`
      }
    ]
  };
}

function InfoTab({ circle, user, isDark }) {
  const websiteUrl = circle?.website_url;
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const name = circle?.name || 'Institution';
    const description = circle?.description || 'Official institutional circle.';

    if (!websiteUrl) {
      setLoading(true);
      const infoData = {
        name: name,
        is_product_brand: false,
        tagline: description ? description.substring(0, 100) + '...' : '',
        mission: description || '',
        vision: '',
        goals: [],
        products: [],
        services: [],
        news: []
      };
      setInfo(infoData);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Attempt standard LLM invoke first
    supabase.functions.invoke('invoke-llm', { body: {
      prompt: `Visit the website at ${websiteUrl} and extract structured information about the organization.
      
IMPORTANT: First determine if this organization primarily SELLS PRODUCTS (e.g. sportswear, shoes, apparel, electronics, goods, retail merchandise). If yes, set is_product_brand=true and fill the products array with their main product categories and featured products. If they offer services instead (e.g. financial, consulting, education), set is_product_brand=false and fill services instead.

Return ONLY in the exact JSON format specified — no extra text.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          is_product_brand: { type: 'boolean', description: 'true if org sells physical products/retail goods' },
          tagline: { type: 'string', description: 'Brand slogan or tagline if any' },
          mission: { type: 'string' },
          vision: { type: 'string' },
          goals: { type: 'array', items: { type: 'string' } },
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                description: { type: 'string' },
                featured_items: { type: 'array', items: { type: 'string' } },
                price_range: { type: 'string' },
                image_url: { type: 'string' },
              },
            },
          },
          services: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
          news: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                title: { type: 'string' },
              },
            },
          },
        },
      },
    }
    }).then((result) => {
      if (result.data) {
        setInfo(result.data);
        setLoading(false);
      } else {
        throw new Error('LLM function returned empty data');
      }
    }).catch(async () => {
      // CORS Fallback Scraper: Fetch the actual website HTML through CORS proxy, extract title/meta
      try {
        const corsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(websiteUrl)}`;
        const res = await fetch(corsUrl);
        if (!res.ok) {
          throw new Error(`Proxy returned HTTP status ${res.status}`);
        }
        const html = await res.text();

        // Extract title, description meta
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1].trim() : '';
        
        // If the page title indicates an error, block, or is empty, throw error to force local generator fallback
        const lowerTitle = pageTitle.toLowerCase();
        if (!pageTitle || 
            lowerTitle.includes('error') || 
            lowerTitle.includes('access denied') || 
            lowerTitle.includes('blocked') || 
            lowerTitle.includes('forbidden') || 
            lowerTitle.includes('not found') ||
            html.length < 1000) {
          throw new Error('Scraped page is an error, blocked, or too short');
        }

        const brandName = pageTitle.split(/[|\-:]/)[0].trim() || name;
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) || 
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
        const pageDesc = descMatch ? descMatch[1].trim() : description;

        // Parse JSON-LD structured data if any
        const jsonLdRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        const parsedProducts = [];
        let match;
        while ((match = jsonLdRegex.exec(html)) !== null) {
          try {
            const parsed = JSON.parse(match[1].trim());
            const items = Array.isArray(parsed) ? parsed : [parsed];
            for (const item of items) {
              if (item['@type'] === 'Product') {
                parsedProducts.push(item);
              } else if (item['@type'] === 'ItemList' && Array.isArray(item.itemListElement)) {
                for (const element of item.itemListElement) {
                  if (element.item && element.item['@type'] === 'Product') {
                    parsedProducts.push(element.item);
                  }
                }
              } else if (item['@graph'] && Array.isArray(item['@graph'])) {
                for (const graphItem of item['@graph']) {
                  if (graphItem['@type'] === 'Product') {
                    parsedProducts.push(graphItem);
                  }
                }
              }
            }
          } catch (e) {}
        }

        // Parse HTML to extract mission, vision, and main activity from text
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const paragraphs = Array.from(doc.querySelectorAll('p, div, span, section'))
          .map(el => el.textContent.trim().replace(/\s+/g, ' '))
          .filter(t => t.length > 60 && t.length < 500);

        let missionText = pageDesc || '';
        let visionText = '';
        let mainActivity = '';

        for (const p of paragraphs) {
          const lower = p.toLowerCase();
          if (lower.includes('mission') || lower.includes('aim to ') || lower.includes('strive to ')) {
            if (!missionText || missionText === pageDesc) missionText = p;
          }
          if (lower.includes('vision') || lower.includes('envision') || lower.includes('our future')) {
            if (!visionText) visionText = p;
          }
          if (lower.includes('we are') || lower.includes('leading provider') || lower.includes('specializes in') || lower.includes('manufacturer')) {
            if (!mainActivity) mainActivity = p;
          }
        }

        // Basic heuristic for products if JSON-LD fails: look for images with pricing or product titles
        if (parsedProducts.length === 0) {
          const productCards = Array.from(doc.querySelectorAll('.product, .item, article'));
          for (const card of productCards.slice(0, 5)) {
            const img = card.querySelector('img')?.src || '';
            const title = card.querySelector('h2, h3, .title, .name')?.textContent?.trim() || '';
            const price = card.querySelector('.price, .amount')?.textContent?.trim() || '';
            if (img && title) {
              parsedProducts.push({
                name: title,
                image: img,
                offers: { price: price }
              });
            }
          }
        }

        const generatedData = {
          name: brandName,
          is_product_brand: false,
          tagline: pageDesc ? pageDesc.substring(0, 100) + '...' : (mainActivity ? mainActivity.substring(0, 100) + '...' : ''),
          mission: missionText,
          vision: visionText,
          main_activity: mainActivity,
          goals: [],
          products: [],
          services: [],
          news: []
        };

        // If JSON-LD found real products, map them
        if (parsedProducts.length > 0) {
          const mapped = parsedProducts.map(p => {
            const name = p.name || 'Featured Product';
            let img = Array.isArray(p.image) ? p.image[0] : (typeof p.image === 'string' ? p.image : (p.image?.url || ''));
            if (img && img.startsWith('/')) {
              try {
                img = new URL(img, websiteUrl).toString();
              } catch (_) {}
            }
            const desc = p.description || '';
            const price = p.offers?.price || p.offers?.lowPrice || '';
            const currency = p.offers?.priceCurrency || 'TND';
            const priceRange = price ? `${price} ${currency}` : '';
            return {
              category: name,
              description: desc,
              featured_items: [name],
              price_range: priceRange,
              image_url: img
            };
          }).filter(p => p.image_url);

          if (mapped.length > 0) {
            generatedData.products = mapped.slice(0, 8);
            generatedData.is_product_brand = true;
          }
        }

        setInfo(generatedData);
      } catch (err) {
        console.warn('CORS scraper failed, falling back to local metadata intelligence:', err.message);
        // Local generation based on circle details
        const infoData = {
          name: name,
          is_product_brand: false,
          tagline: description ? description.substring(0, 100) + '...' : '',
          mission: description || '',
          vision: '',
          main_activity: '',
          goals: [],
          products: [],
          services: [],
          news: []
        };
        setInfo(infoData);
      } finally {
        setLoading(false);
      }
    });
  }, [websiteUrl, circle?.name, circle?.description]);

  if (!websiteUrl && !circle?.description) {
    return (
      <div className="p-5">
        <div className="rounded-xl p-6 border text-center transition-colors duration-300" 
             style={{ 
               background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(180,120,20,0.05)', 
               borderColor: isDark ? 'rgba(100,180,255,0.12)' : 'rgba(180,120,20,0.2)' 
             }}>
          <BookOpen className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-blue-300/20' : 'text-amber-800/30'}`} />
          <p className={`${isDark ? 'text-blue-300/60' : 'text-stone-600'} text-sm`}>No website configured for this institution.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-xl p-4 border animate-pulse transition-colors duration-300" 
               style={{ 
                 background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(180,120,20,0.05)', 
                 borderColor: isDark ? 'rgba(100,180,255,0.08)' : 'rgba(180,120,20,0.12)', 
                 height: 80 
               }} />
        ))}
        <p className={`${isDark ? 'text-blue-300/40' : 'text-stone-500'} text-xs text-center`}>Extracting institutional info...</p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="p-5">
        <div className="rounded-xl p-6 border text-center transition-colors duration-300" 
             style={{ 
               background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(180,120,20,0.05)', 
               borderColor: isDark ? 'rgba(100,180,255,0.12)' : 'rgba(180,120,20,0.2)' 
             }}>
          <BookOpen className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-blue-300/20' : 'text-amber-800/30'}`} />
          <p className={`${isDark ? 'text-blue-300/60' : 'text-stone-600'} text-sm`}>Institutional profile information will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <Landmark className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{info.name || circle?.name}</span>
        {info.is_product_brand && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isDark 
              ? 'bg-orange-400/15 text-orange-300 border-orange-400/30' 
              : 'bg-orange-600/15 text-orange-800 border-orange-600/30'
          }`}>
            <ShoppingBag className="w-2.5 h-2.5" /> Brand
          </span>
        )}
        {circle?.website_url && (
          <a
            href={circle.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`ml-auto inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shadow-sm transition-all ${
              isDark 
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20' 
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:shadow-md'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Visit Website
          </a>
        )}
      </div>

      {/* Tagline */}
      {info.tagline && (
        <p className={`${isDark ? 'text-amber-300/70' : 'text-amber-900/85'} text-sm italic px-1`}>"{info.tagline}"</p>
      )}

      {/* Main Activity */}
      {info.main_activity && (
        <div className="rounded-xl p-4 border transition-all duration-300" 
             style={{ 
               background: isDark ? 'rgba(100,180,255,0.05)' : 'rgba(100,180,255,0.08)', 
               borderColor: isDark ? 'rgba(100,180,255,0.2)' : 'rgba(100,180,255,0.3)' 
             }}>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>Main Activity</span>
          </div>
          <p className={`${isDark ? 'text-white/85' : 'text-stone-800'} text-sm leading-relaxed`}>{info.main_activity}</p>
        </div>
      )}

      {/* ── PRODUCTS visual gallery (shown first for product brands) ── */}
      {info.is_product_brand && info.products?.length > 0 && (
        <ProductGallery
          products={info.products}
          websiteUrl={circle?.website_url}
          brandName={info.name || circle?.name}
          tagline={info.tagline}
          circleId={circle?.id}
          userId={user?.id}
          user={user}
          isDark={isDark}
        />
      )}

      {/* Mission */}
      {info.mission && (
        <div className="rounded-xl p-4 border transition-all duration-300" 
             style={{ 
               background: isDark ? 'rgba(245,158,11,0.06)' : 'linear-gradient(135deg, #fefdf6, #fbf2db)', 
               borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(180,120,20,0.3)' 
             }}>
          <div className="flex items-center gap-2 mb-2">
            <Target className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Mission</span>
          </div>
          <p className={`${isDark ? 'text-white/85' : 'text-stone-800'} text-sm leading-relaxed`}>{info.mission}</p>
        </div>
      )}

      {/* Vision */}
      {info.vision && (
        <div className="rounded-xl p-4 border transition-all duration-300" 
             style={{ 
               background: isDark ? 'rgba(14,165,233,0.06)' : 'linear-gradient(135deg, #fefefe, #f1ebd8)', 
               borderColor: isDark ? 'rgba(14,165,233,0.18)' : 'rgba(180,120,20,0.25)' 
             }}>
          <div className="flex items-center gap-2 mb-2">
            <Eye className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-sky-300' : 'text-amber-800'}`}>Vision</span>
          </div>
          <p className={`${isDark ? 'text-white/85' : 'text-stone-800'} text-sm leading-relaxed`}>{info.vision}</p>
        </div>
      )}

      {/* Goals */}
      {info.goals?.length > 0 && (
        <div className="rounded-xl p-4 border transition-all duration-300" 
             style={{ 
               background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)', 
               borderColor: isDark ? 'rgba(100,180,255,0.12)' : 'rgba(180,120,20,0.25)' 
             }}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>Goals & Objectives</span>
          </div>
          <ul className="space-y-2">
            {info.goals.map((g, i) => (
              <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-white/80' : 'text-stone-800'}`}>
                <span className={`${isDark ? 'text-amber-400' : 'text-amber-600'} mt-0.5 shrink-0`}>•</span>{g}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Services (only for non-product brands) */}
      {!info.is_product_brand && info.services?.length > 0 && (
        <div className="rounded-xl p-4 border transition-all duration-300" 
             style={{ 
               background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)', 
               borderColor: isDark ? 'rgba(100,180,255,0.12)' : 'rgba(180,120,20,0.25)' 
             }}>
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-sky-300' : 'text-stone-800'}`}>Services & Initiatives</span>
          </div>
          <div className="space-y-2">
            {info.services.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg p-2.5 border transition-colors" 
                   style={{ borderColor: isDark ? 'rgba(100,180,255,0.08)' : 'rgba(180,120,20,0.15)' }}>
                <BookOpen className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
                <div>
                  <p className={`text-[11px] font-semibold ${isDark ? 'text-white' : 'text-stone-950'}`}>{s.title}</p>
                  <p className={`text-[10px] mt-0.5 ${isDark ? 'text-blue-300/55' : 'text-stone-600'}`}>{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest News */}
      {info.news?.length > 0 && (
        <div className="rounded-xl p-4 border transition-all duration-300" 
             style={{ 
               background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)', 
               borderColor: isDark ? 'rgba(100,180,255,0.12)' : 'rgba(180,120,20,0.25)' 
             }}>
          <div className="flex items-center gap-2 mb-3">
            <Newspaper className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-blue-700'}`} />
            <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-blue-300' : 'text-stone-800'}`}>Latest News</span>
          </div>
          <div className="space-y-1.5">
            {info.news.map((n, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg p-2 -mx-2">
                {n.date && <span className={`text-[10px] mt-0.5 shrink-0 w-20 ${isDark ? 'text-blue-300/50' : 'text-stone-500'}`}>{n.date}</span>}
                <span className={`text-[11px] leading-relaxed ${isDark ? 'text-white/80' : 'text-stone-800'}`}>{n.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementsTab({ circleId, isAdmin, isModerator, user, isDark }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['institutional-announcements', circleId],
    queryFn: () => supabase.from('Post').select('*').match({ circle_id: circleId }).order('created_date', { ascending: false }).limit(30).then(res => res.data || []),
  });

  const announcements = posts.filter((p) => {
    if (p.post_type === 'announcement') return true;
    const c = (p.content || '').toLowerCase();
    return ['announce', 'notice', 'official', 'statement', 'press', 'release', 'update', 'new', 'launching', 'scheduled', 'important'].some((kw) => c.includes(kw));
  });

  const createPost = useMutation({
    mutationFn: () => supabase.from('Post').insert({
      content,
      circle_id: circleId,
      visibility: 'circle',
      post_type: 'announcement',
      author_name: user?.full_name || user?.email?.split('@')[0] || 'Official',
      author_avatar: user?.avatar_url || null,
    }),
    onSuccess: () => {
      setContent('');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['institutional-announcements', circleId] });
    },
  });

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Megaphone className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
          <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Official Announcements</span>
        </div>
        {(isAdmin || isModerator) && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-1 text-[11px] font-semibold ${
              isDark ? 'text-amber-300 hover:text-amber-200' : 'text-amber-700 hover:text-amber-900'
            }`}
          >
            <Plus className="w-3 h-3" /> Post
          </button>
        )}
      </div>

      {showForm && (
        <div
          className="rounded-xl p-4 border space-y-3 transition-colors duration-300"
          style={{ 
            background: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.1)', 
            borderColor: isDark ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.4)' 
          }}
        >
          <Textarea
            placeholder="Write an official announcement..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`min-h-[80px] text-sm focus-visible:ring-amber-500 focus-visible:ring-offset-0 ${
              isDark 
                ? 'bg-transparent border-amber-400/20 text-white placeholder:text-blue-300/40 focus:border-amber-400/50' 
                : 'bg-card border-amber-600/30 text-stone-950 placeholder:text-stone-400 focus:border-amber-600/60'
            }`}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => createPost.mutate()}
              disabled={!content.trim()}
              className={`h-8 text-xs rounded-full font-bold ${
                isDark 
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' 
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
              }`}
            >
              Publish
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowForm(false)} 
              className={`h-8 text-xs rounded-full ${
                isDark ? 'text-blue-300 hover:text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className={`${isDark ? 'text-blue-300/40' : 'text-stone-500'} text-sm text-center py-6`}>Loading...</p>
      ) : announcements.length === 0 ? (
        <div className="text-center py-8">
          <Megaphone className={`w-8 h-8 mx-auto mb-2 ${isDark ? 'text-blue-300/20' : 'text-stone-400/30'}`} />
          <p className={`${isDark ? 'text-blue-300/40' : 'text-stone-500'} text-sm`}>No announcements yet.</p>
          {(isAdmin || isModerator) && (
            <p className={`${isDark ? 'text-blue-300/30' : 'text-stone-400'} text-xs mt-1`}>Post the first official announcement above.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 border transition-all duration-300"
              style={{ 
                background: isDark ? 'rgba(245,158,11,0.06)' : 'linear-gradient(135deg,#fefdf6,#fcf5e3)', 
                borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(180,120,20,0.25)' 
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDark 
                    ? 'bg-amber-400/15 text-amber-300 border-amber-400/30' 
                    : 'bg-amber-600/15 text-amber-800 border-amber-600/30'
                }`}>
                  <Megaphone className="w-2.5 h-2.5" /> OFFICIAL
                </span>
                <span className={`text-[10px] ${isDark ? 'text-blue-300/50' : 'text-stone-600'}`}>{p.author_name}</span>
                <span className={`text-[10px] ml-auto ${isDark ? 'text-blue-300/30' : 'text-stone-500'}`}>
                  {p.created_date ? new Date(p.created_date).toLocaleDateString() : ''}
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-white/90' : 'text-stone-900'}`}>{p.content}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

const INST_TABS = [
  { id: 'info',          label: 'Info',           Icon: BookOpen },
  { id: 'announcements', label: 'Announcements',  Icon: Megaphone },
  { id: 'discussion',    label: 'Discussion',     Icon: LayoutList },
  { id: 'feed',          label: 'Feed',           Icon: Newspaper },
];

export default function InstitutionalCircleLayout({
  circle, user, circleId,
  // discussion props
  memberNames, memberProfiles, activeQuestion, selectedResponseData, setSelectedResponseData,
  responses, isMember, isAdmin, isModerator,
  newResponse, setNewResponse, submitResponse,
  newQuestion, setNewQuestion, showQuestionForm, setShowQuestionForm, createQuestion,
  allMemberIds,
}) {
  const [activeTab, setActiveTab] = useState('info');
  const { isDark } = useTheme();

  // ── Fetch real market data from entity (updated daily via automation) ──
  const { data: marketData = [] } = useQuery({
    queryKey: ['market-data'],
    queryFn: () => supabase.from('MarketData').select('*').then(res => res.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const sortedMarketData = React.useMemo(() => {
    const dbMap = new Map(marketData.map(item => [item.symbol, item]));
    const merged = [...marketData];
    DEFAULT_MARKET_DATA.forEach(defItem => {
      if (!dbMap.has(defItem.symbol)) {
        merged.push(defItem);
      }
    });

    const order = ['S&P 500', 'NASDAQ', 'DOW', 'GOLD', 'OIL (WTI)', 'EUR/USD', 'BTC/USD', 'ETH/USD'];
    return merged.sort((a, b) => {
      const idxA = order.indexOf(a.symbol);
      const idxB = order.indexOf(b.symbol);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [marketData]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl transition-all duration-300" style={{ background: isDark ? 'linear-gradient(160deg,#070a13 0%,#0e1726 50%,#060910 100%)' : 'linear-gradient(160deg,#fbf7ee 0%,#f6ecd2 50%,#e8d7af 100%)' }}>

      {/* ── Institutional Header ── */}
      <div
        className="relative p-[2px] transition-all duration-300"
        style={{ background: isDark ? 'linear-gradient(135deg,rgba(245,158,11,0.3),rgba(30,58,138,0.4),rgba(14,165,233,0.3))' : 'linear-gradient(135deg,rgba(180,120,20,0.4),rgba(180,120,20,0.1),rgba(180,120,20,0.3))' }}
      >
        <div className="rounded-t-2xl px-6 py-5 transition-colors duration-300" style={{ background: isDark ? 'linear-gradient(135deg,#070a13,#0e1726)' : 'linear-gradient(135deg,#fffcf6,#f7efe0)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Landmark className={`w-5 h-5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
              <span className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Institutional Circle</span>
              {circle?.is_verified && (
                <VerifiedBadge label={circle.verified_label || 'Official'} size="sm" dark={isDark} />
              )}
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                isDark 
                  ? 'text-sky-300/70 bg-sky-400/10 border-sky-400/15' 
                  : 'text-amber-800 bg-amber-100/80 border-amber-600/20'
              }`}>
                <Sparkles className="w-2.5 h-2.5" /> AI Analytics
              </span>
            </div>
          </div>
          <h1 className={`text-2xl font-bold mb-1 transition-colors duration-300 ${isDark ? 'text-white' : 'text-stone-900'}`}>{circle?.name}</h1>
          {circle?.description && (
            <p className={`text-sm mb-2 line-clamp-2 transition-colors duration-300 ${isDark ? 'text-blue-200/60' : 'text-stone-600'}`}>{circle.description}</p>
          )}
          <div className={`flex items-center gap-3 text-[11px] transition-colors duration-300 ${isDark ? 'text-blue-300/60' : 'text-stone-500'}`}>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {allMemberIds.length} members</span>
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {circle?.privacy}</span>
          </div>
          {/* Decorative gold line */}
          <div className="mt-4 h-px w-full transition-all duration-300" style={{ background: isDark ? 'linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)' : 'linear-gradient(90deg,transparent,rgba(180,120,20,0.4),transparent)' }} />
        </div>
      </div>

      {/* ── Live Market Ticker ── */}
      <MarketTicker marketData={sortedMarketData} isDark={isDark} />

      {/* ── Tabs ── */}
      <div
        className="flex border-b overflow-x-auto scrollbar-none whitespace-nowrap transition-colors duration-300"
        style={{ 
          background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(180,120,20,0.03)', 
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,120,20,0.15)' 
        }}
      >
        {INST_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === id
                ? isDark ? 'border-amber-400 text-amber-300' : 'border-amber-600 text-amber-900'
                : isDark ? 'text-blue-300/50 hover:text-blue-200 border-transparent' : 'text-stone-500 hover:text-stone-800 border-transparent'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'info' && <InfoTab circle={circle} user={user} isDark={isDark} />}

          {activeTab === 'announcements' && (
            <AnnouncementsTab
              circleId={circleId}
              isAdmin={isAdmin}
              isModerator={isModerator}
              user={user}
              isDark={isDark}
            />
          )}

          {activeTab === 'discussion' && (
            <div style={{ color: isDark ? 'white' : '#1c1917' }}>
              <CircleVisual
                members={memberNames}
                question={activeQuestion?.question_text}
                selectedResponse={selectedResponseData}
                questionNumber={activeQuestion?.question_number}
                closesAt={activeQuestion?.closes_at}
                totalResponses={responses.length}
                totalMembers={allMemberIds.length}
                circleName={circle?.name}
                memberProfiles={memberProfiles}
                isDark={isDark}
                allResponses={responses}
              />

              {responses.length > 0 && (
                <div className="px-6 pb-4">
                  <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-blue-200' : 'text-stone-800'}`}>
                    <MessageCircle className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} /> Responses
                  </h3>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {responses.map((r) => {
                        const rProfile = memberProfiles.find((p) => p.id === r.created_by_id);
                        const avatar = rProfile?.avatar_url || r.author_avatar;
                        return (
                          <motion.div
                            key={r.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              selectedResponseData?.id === r.id
                                ? (isDark ? 'border-amber-400/40 bg-amber-500/10' : 'border-amber-600/40 bg-amber-600/10')
                                : (isDark ? 'hover:bg-white/5 border-white/10' : 'hover:bg-stone-500/5 border-stone-200')
                            }`}
                            style={selectedResponseData?.id === r.id ? (isDark ? { background: 'rgba(245,158,11,0.08)' } : { background: 'rgba(180,120,20,0.08)' }) : {}}
                            onClick={() => setSelectedResponseData(selectedResponseData?.id === r.id ? null : r)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {avatar ? (
                                <img src={avatar} alt={r.author_name} className={`w-7 h-7 rounded-full object-cover border ${isDark ? 'border-white/20' : 'border-stone-300'}`} />
                              ) : (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-gradient-to-br ${isDark ? 'from-amber-400 to-orange-500' : 'from-amber-600 to-amber-700'}`}>
                                  {r.author_name?.charAt(0)}
                                </div>
                              )}
                              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-stone-900'}`}>{r.author_name}</span>
                            </div>
                            <p className={`text-sm ml-9 ${isDark ? 'text-blue-200/70' : 'text-stone-700'}`}>{r.response_text}</p>
                            {/* Votes inline */}
                            <div className="flex items-center gap-1.5 ml-9 mt-1.5">
                              <button
                                onClick={(e) => { e.stopPropagation(); }}
                                className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition-all ${
                                  isDark 
                                    ? 'border-white/10 text-blue-300/60 hover:text-emerald-400 hover:border-emerald-400/30' 
                                    : 'border-stone-300 text-stone-600 hover:text-emerald-700 hover:border-emerald-600/30'
                                }`}
                              >
                                <ChevronUp className="w-3.5 h-3.5" /> {r.upvoted_by?.length || 0}
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); }}
                                className={`flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full border transition-all ${
                                  isDark 
                                    ? 'border-white/10 text-blue-300/60 hover:text-red-400 hover:border-red-400/30' 
                                    : 'border-stone-300 text-stone-600 hover:text-red-700 hover:border-red-600/30'
                                }`}
                              >
                                <ChevronDown className="w-3.5 h-3.5" /> {r.downvoted_by?.length || 0}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {isMember && activeQuestion && (
                <div className="px-6 pb-4">
                  <form
                    onSubmit={(e) => { e.preventDefault(); if (newResponse.trim()) submitResponse.mutate(newResponse); }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Share your answer..."
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      className={`flex-1 rounded-full h-10 ${
                        isDark 
                          ? 'bg-white/5 border-white/15 text-white placeholder:text-blue-300/40' 
                          : 'bg-card border-stone-300 text-stone-900 placeholder:text-stone-400'
                      }`}
                    />
                    <Button type="submit" disabled={!newResponse.trim()} size="icon" className={`rounded-full h-10 w-10 ${isDark ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold' : 'bg-amber-600 hover:bg-amber-700 text-white font-bold'}`}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              )}

              {isAdmin && <CircleAdminDashboard circleId={circleId} circle={circle} />}
              <CircleEventCalendar circleId={circleId} isMember={isMember} isAdmin={isAdmin} isModerator={isModerator} currentUserId={user?.id} />
              <CircleMemberRoles circle={circle} currentUserId={user?.id} />
              <CircleLeaderboard circleId={circleId} />

              {isMember && (
                <div className="px-6 pb-6">
                  {showQuestionForm ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Ask a question to your circle..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        className={`min-h-[80px] ${
                          isDark 
                            ? 'bg-white/5 border-white/15 text-white placeholder:text-blue-300/40' 
                            : 'bg-card border-stone-300 text-stone-950 placeholder:text-stone-400'
                        }`}
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => { if (newQuestion.trim()) createQuestion.mutate(newQuestion); }} disabled={!newQuestion.trim()} className={`rounded-full ${isDark ? 'bg-amber-500 hover:bg-amber-600 text-slate-900' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}>Post Question</Button>
                        <Button variant="outline" onClick={() => setShowQuestionForm(false)} className={`rounded-full border-white/20 text-blue-200 hover:bg-white/10 ${isDark ? '' : 'border-stone-300 text-stone-700 hover:bg-stone-100'}`}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => setShowQuestionForm(true)} variant="outline" className={`w-full rounded-full border-dashed ${isDark ? 'border-white/20 text-blue-300 hover:bg-white/5' : 'border-stone-300 text-stone-700 hover:bg-stone-100'}`}>
                      <Plus className="w-4 h-4 mr-2" /> Ask a New Question
                    </Button>
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="px-6 pb-6 mt-6">
                  <CircleMonetization memberCount={allMemberIds.length} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'feed' && <CircleFeed circle={circle} user={user} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
