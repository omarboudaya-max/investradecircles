import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DownloadAppButton({ variant = 'default', className = '' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Check if running inside mobile container / installed standalone app
    const inStandalone = (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      !!window.ReactNativeWebView ||
      !!window.Capacitor
    );
    setIsStandalone(inStandalone);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // HIDE completely if user is already inside the mobile app!
  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async (e) => {
    e.preventDefault();

    // If native browser install prompt is ready (Chrome / Android / Edge)
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setInstalled(true);
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.log('Install prompt error:', err);
      }
    }

    // Show step-by-step PWA install guide modal if prompt isn't directly triggered
    setShowGuide(true);
  };

  if (installed) {
    return (
      <Button variant="outline" size="sm" className={`rounded-full text-xs gap-1.5 border-green-500/40 text-green-600 ${className}`} disabled>
        <Check className="w-3.5 h-3.5" /> App Installed
      </Button>
    );
  }

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all shadow-sm ${className}`}
          title="Install Mobile App"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download App</span>
        </button>
      ) : (
        <Button
          onClick={handleInstallClick}
          className={`rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold shadow-md gap-2 flex items-center justify-between px-4 py-3 ${className}`}
        >
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span>Download Mobile App</span>
          </div>
          <Download className="w-4 h-4" />
        </Button>
      )}

      {/* Android & Mobile Install Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Install Investraders App</h3>
              </div>
              <button onClick={() => setShowGuide(false)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="font-medium text-slate-200">To download & install the app directly on your Android / iPhone:</p>
              
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-[10px]">1</span>
                  <span>Tap your browser menu (<strong>3 dots ⋮</strong> on Chrome/Android or <strong>Share ⎘</strong> on iPhone).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 text-[10px]">2</span>
                  <span>Select <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0 text-[10px]">3</span>
                  <span>Investraders will install instantly onto your phone's home screen!</span>
                </div>
              </div>
            </div>

            <Button onClick={() => setShowGuide(false)} className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold">
              Got It!
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
