import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function WebsiteFooter() {
  const t = useTranslation();
  return (
    <footer className="max-w-6xl mx-auto px-6 py-10 text-center text-gray-400 text-sm relative z-20 mt-auto">
      © {new Date().getFullYear()} Investraders — {t.footer.tagline} • <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">{t.footer.contact}</Link>
    </footer>
  );
}
