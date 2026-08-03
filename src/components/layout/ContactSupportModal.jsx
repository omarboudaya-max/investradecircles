import React, { useState } from 'react';
import { X, Mail, Globe, Phone, MessageSquare, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function ContactSupportModal({ isOpen, onClose, user }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        setSubject('');
        setMessage('');
        onClose();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg text-foreground">Contact Support</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Contact Methods Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a 
              href="mailto:contact@investraders.net"
              className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 flex items-start gap-3 hover:border-blue-400 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Email Us</p>
                <p className="text-xs font-semibold text-foreground truncate mt-0.5">contact@investraders.net</p>
                <p className="text-[10px] text-muted-foreground">Direct Support</p>
              </div>
            </a>

            <a 
              href="https://www.investraders.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900 flex items-start gap-3 hover:border-cyan-400 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">Official Website</p>
                <p className="text-xs font-semibold text-foreground truncate mt-0.5">www.investraders.net</p>
                <p className="text-[10px] text-muted-foreground">3M Platform</p>
              </div>
            </a>
          </div>

          {/* Hotline details */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Phone & Hotline</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">+216 27 777 751 (27777751)</p>
            </div>
          </div>

          {/* Direct Support Message Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-border">
            <h3 className="text-sm font-bold text-foreground">Send Support Inquiry</h3>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject</label>
              <Input 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Account setup or Circle question"
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Message Details</label>
              <Textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or request..."
                rows={3}
                required
                className="rounded-xl resize-none"
              />
            </div>

            <Button 
              type="submit" 
              disabled={sending || !subject.trim() || !message.trim()}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold"
            >
              {sentSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Message Sent Successfully!
                </>
              ) : sending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Support Request
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
