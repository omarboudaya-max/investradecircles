import React from 'react';
import { Link } from 'react-router-dom';

export default function WebsiteFooter() {
  return (
    <footer className="max-w-6xl mx-auto px-6 py-10 text-center text-gray-400 text-sm relative z-20 mt-auto">
      © {new Date().getFullYear()} Investraders — Building global communities • <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link>
    </footer>
  );
}
