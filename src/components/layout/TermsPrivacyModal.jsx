import React from 'react';
import { X, FileText, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsPrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg text-foreground">Terms & Privacy Policy</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div className="p-5 space-y-5 overflow-y-auto text-sm text-foreground/80 leading-relaxed flex-1">
          <div>
            <h3 className="font-bold text-base text-foreground mb-1">1. Welcome to Investraders 3M</h3>
            <p>Investraders 3M ("Make Money Meanwhile") is a social trading and investment platform designed to connect individual investors, institutional bodies, chambers of commerce, and financial innovators.</p>
          </div>

          <div>
            <h3 className="font-bold text-base text-foreground mb-1">2. Data Privacy & Protection</h3>
            <p>Your privacy is paramount to us. We collect necessary user details (such as name, email address, profile preferences, and circle activity) solely to provide real-time messaging, feed updates, and personalized financial insights. We do not sell or monetize user personal information to third parties.</p>
          </div>

          <div>
            <h3 className="font-bold text-base text-foreground mb-1">3. User Conduct & Circle Rules</h3>
            <p>Members must maintain professional integrity. Spamming, fraudulent investment claims, unauthorized financial advice, or hate speech within circles will result in immediate suspension or account deletion.</p>
          </div>

          <div>
            <h3 className="font-bold text-base text-foreground mb-1">4. Financial Disclaimer</h3>
            <p>All posts, circle polls, and discussions shared on Investraders are for educational and community collaboration purposes only. They do not constitute formal financial, tax, or investment advice.</p>
          </div>

          <div>
            <h3 className="font-bold text-base text-foreground mb-1">5. Contact & Data Inquiries</h3>
            <p>For data removal requests or legal inquiries, please contact our support team at <a href="mailto:contact@investraders.net" className="text-blue-600 underline">contact@investraders.net</a>.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20 flex justify-end">
          <Button onClick={onClose} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6">
            I Understand
          </Button>
        </div>
      </div>
    </div>
  );
}
