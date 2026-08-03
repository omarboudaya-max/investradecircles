import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DownloadAppButton({ variant = 'default', className = '' }) {
  const [installed, setInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running inside mobile container / installed standalone app
    const inStandalone = (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      !!window.ReactNativeWebView ||
      !!window.Capacitor
    );
    setIsStandalone(inStandalone);

    const handleAppInstalled = () => {
      setInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // HIDE completely if user is already inside the mobile app!
  if (isStandalone) {
    return null;
  }

  const handleDownloadClick = (e) => {
    // Direct APK Download execution
    const apkUrl = '/downloads/Investraders.apk';
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'Investraders.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (installed) {
    return (
      <Button variant="outline" size="sm" className={`rounded-full text-xs gap-1.5 border-green-500/40 text-green-600 ${className}`} disabled>
        <Check className="w-3.5 h-3.5" /> App Installed
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <a
        href="/downloads/Investraders.apk"
        download="Investraders.apk"
        onClick={handleDownloadClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer ${className}`}
        title="Download Investraders APK"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Download APK</span>
      </a>
    );
  }

  return (
    <a
      href="/downloads/Investraders.apk"
      download="Investraders.apk"
      onClick={handleDownloadClick}
      className={`rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold shadow-md gap-2 flex items-center justify-between px-4 py-3 cursor-pointer ${className}`}
    >
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4" />
        <span>Download Android APK</span>
      </div>
      <Download className="w-4 h-4" />
    </a>
  );
}
