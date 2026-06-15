import React, { useState } from 'react';
import { X, Link2, Twitter, Facebook, MessageCircle, Check } from 'lucide-react';
import { getAppUrl } from '@/lib/app-url';

export default function SharePostModal({ post, onClose }) {
  const [copied, setCopied] = useState(false);
  const postUrl = `${getAppUrl()}/post/${post.id}`;
  const text = encodeURIComponent(`${post.content?.slice(0, 120) || 'Check this out'}... | Investraders`);
  const encodedUrl = encodeURIComponent(postUrl);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
    } catch {
      // Fallback for older browsers / non-HTTPS origins
      const ta = document.createElement('textarea');
      ta.value = postUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      label: 'Twitter / X',
      icon: <Twitter className="w-5 h-5" />,
      color: 'bg-black text-white',
      href: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
    },
    {
      label: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-green-500 text-white',
      href: `https://wa.me/?text=${text}%20${encodedUrl}`,
    },
    {
      label: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-blue-600 text-white',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: 'LinkedIn',
      icon: <span className="font-bold text-sm">in</span>,
      color: 'bg-blue-700 text-white',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Share Post</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preview snippet */}
          <div className="bg-muted/40 rounded-xl p-3 text-sm text-muted-foreground line-clamp-2">
            {post.content?.slice(0, 120) || 'Post'}
            {post.content?.length > 120 ? '...' : ''}
          </div>

          {/* Social share buttons */}
          <div className="grid grid-cols-4 gap-3">
            {shareLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl ${s.color} transition-opacity hover:opacity-90`}
              >
                {s.icon}
                <span className="text-[10px] font-medium leading-tight text-center">{s.label}</span>
              </a>
            ))}
          </div>

          {/* Copy link */}
          <button
            onClick={copyLink}
            className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Link2 className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground">{postUrl}</span>
            </div>
            {copied
              ? <Check className="w-4 h-4 text-green-500 shrink-0" />
              : <span className="text-xs font-medium text-primary shrink-0">Copy</span>
            }
          </button>
        </div>
      </div>
    </div>
  );
}