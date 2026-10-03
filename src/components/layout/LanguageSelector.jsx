import React from 'react';
import { Globe, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Universal Language Selector for Investraders.
 * Supports:
 * - variant="compact": minimal rounded button (ideal for Navbars)
 * - variant="full": detailed trigger with full labels
 * - variant="inline": list/radio group (for Settings/Profile)
 */
export default function LanguageSelector({ variant = 'compact', className = '' }) {
  const {
    language,
    preference,
    isAuto,
    languages,
    setPreference,
  } = useLanguage();

  const activeLangMeta = languages[language] || languages.en;

  if (variant === 'inline') {
    return (
      <div className={`space-y-2 ${className}`}>
        {/* Automatic option */}
        <button
          type="button"
          onClick={() => setPreference('auto')}
          className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${
            isAuto
              ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm'
              : 'bg-card border-border hover:bg-muted text-foreground'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <div className="text-left rtl:text-right">
              <div className="flex items-center gap-2">
                <span>Automatic</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold uppercase">
                  Device
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-normal">
                Detects preferred browser language ({activeLangMeta.nativeLabel})
              </p>
            </div>
          </div>
          {isAuto && <Check className="w-4 h-4 text-primary" />}
        </button>

        {/* Explicit languages */}
        {Object.values(languages).map((l) => {
          const isSelected = !isAuto && preference === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setPreference(l.code)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all ${
                isSelected
                  ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm'
                  : 'bg-card border-border hover:bg-muted text-foreground'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base font-bold w-6 text-center">{l.short}</span>
                <div className="text-left rtl:text-right">
                  <p className="font-medium text-foreground">{l.nativeLabel}</p>
                  <p className="text-xs text-muted-foreground">{l.label}</p>
                </div>
              </div>
              {isSelected && <Check className="w-4 h-4 text-primary" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'full' ? (
          <button
            type="button"
            className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-all ${className}`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span>{isAuto ? `Auto (${activeLangMeta.nativeLabel})` : activeLangMeta.nativeLabel}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-bold">
              {activeLangMeta.short}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className={`text-xs text-slate-300 hover:text-white font-bold transition-all px-2.5 h-8 rounded-full border border-slate-700 hover:border-white/50 flex items-center gap-1.5 bg-white/5 hover:bg-white/10 ${className}`}
            title={`Language: ${activeLangMeta.nativeLabel} ${isAuto ? '(Auto)' : ''}`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{activeLangMeta.short}</span>
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 z-50">
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Language / Langue / اللغة
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Automatic detection option */}
        <DropdownMenuItem
          onClick={() => setPreference('auto')}
          className="flex items-center justify-between cursor-pointer text-xs"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <p className="font-semibold">Automatic</p>
              <p className="text-[10px] text-muted-foreground">Device: {activeLangMeta.nativeLabel}</p>
            </div>
          </div>
          {isAuto && <Check className="w-4 h-4 text-primary ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Available languages */}
        {Object.values(languages).map((l) => {
          const isSelected = !isAuto && preference === l.code;
          return (
            <DropdownMenuItem
              key={l.code}
              onClick={() => setPreference(l.code)}
              className="flex items-center justify-between cursor-pointer text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-center font-bold text-muted-foreground">{l.short}</span>
                <div>
                  <p className="font-semibold text-foreground">{l.nativeLabel}</p>
                  <p className="text-[10px] text-muted-foreground">{l.label}</p>
                </div>
              </div>
              {isSelected && <Check className="w-4 h-4 text-primary ml-auto" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
