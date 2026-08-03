import React, { useState } from 'react';
import { X, ShieldCheck, Eye, MessageSquare, BellRing, Activity, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacySettingsModal({ isOpen, onClose }) {
  const [profileVisibility, setProfileVisibility] = useState('public'); // public | members | private
  const [dmPermission, setDmPermission] = useState('everyone'); // everyone | connections
  const [showActiveStatus, setShowActiveStatus] = useState(true);
  const [allowAnalytics, setAllowAnalytics] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg text-foreground">Privacy Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Profile Visibility */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Profile Visibility</label>
            <div className="space-y-2">
              {[
                { id: 'public', label: 'Public', desc: 'Anyone on Investraders can view your profile and circles' },
                { id: 'members', label: 'Registered Members Only', desc: 'Only signed-in members can view your details' },
                { id: 'private', label: 'Private / Connections Only', desc: 'Only your accepted connections can see your activity' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setProfileVisibility(item.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    profileVisibility === item.id ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20' : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                    profileVisibility === item.id ? 'border-blue-600 bg-blue-600' : 'border-muted-foreground/40'
                  }`}>
                    {profileVisibility === item.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messaging Permissions */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Direct Messaging</label>
            <div className="space-y-2">
              {[
                { id: 'everyone', label: 'Everyone', desc: 'Allow messages from any member' },
                { id: 'connections', label: 'Connections Only', desc: 'Only accepted connections can send direct messages' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setDmPermission(item.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    dmPermission === item.id ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20' : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                    dmPermission === item.id ? 'border-blue-600 bg-blue-600' : 'border-muted-foreground/40'
                  }`}>
                    {dmPermission === item.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-4 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Active Status</p>
                <p className="text-xs text-muted-foreground">Show when you are currently online</p>
              </div>
              <input
                type="checkbox"
                checked={showActiveStatus}
                onChange={(e) => setShowActiveStatus(e.target.checked)}
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Circle Activity Insights</p>
                <p className="text-xs text-muted-foreground">Share leaderboard points and circle badges</p>
              </div>
              <input
                type="checkbox"
                checked={allowAnalytics}
                onChange={(e) => setAllowAnalytics(e.target.checked)}
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
          <Button onClick={handleSave} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" /> Saved!
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
