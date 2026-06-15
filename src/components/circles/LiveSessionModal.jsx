import React, { useEffect, useRef } from 'react';
import { X, Radio } from 'lucide-react';

const TYPE_COLORS = {
  discussion: 'bg-blue-600/80',
  meeting: 'bg-purple-600/80',
  webinar: 'bg-green-600/80',
  analysis: 'bg-amber-600/80',
};

export default function LiveSessionModal({ event, user, isAdmin, isModerator, onClose }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  const isPrivileged = isAdmin || isModerator || event.created_by_id === user?.id;
  const isWebinarViewer = event.event_type === 'webinar' && !isPrivileged;
  const isMeetingHost = event.event_type === 'meeting' && isPrivileged;

  const toolbarButtons = isWebinarViewer
    ? ['chat', 'raisehand', 'tileview']
    : isMeetingHost
    ? ['microphone', 'camera', 'desktop', 'fullscreen', 'hangup', 'chat', 'raisehand', 'tileview', 'settings', 'mute-everyone', 'security']
    : ['microphone', 'camera', 'desktop', 'fullscreen', 'hangup', 'chat', 'raisehand', 'tileview', 'settings', 'filmstrip'];

  useEffect(() => {
    let scriptElement = null;

    const init = () => {
      if (!containerRef.current || !window.JitsiMeetExternalAPI) return;
      apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName: `Investraders-${event.id.replace(/[^a-zA-Z0-9]/g, '')}`,
        width: '100%',
        height: '100%',
        parentNode: containerRef.current,
        userInfo: {
          displayName: user?.full_name || user?.email?.split('@')[0] || 'User',
          email: user?.email || '',
        },
        configOverwrite: {
          startWithAudioMuted: isWebinarViewer,
          startWithVideoMuted: isWebinarViewer,
          disableModeratorIndicator: false,
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: toolbarButtons,
          SHOW_JITSI_WATERMARK: false,
          SHOW_POWERED_BY: false,
          DISPLAY_WELCOME_FOOTER: false,
          SHOW_CHROME_EXTENSION_BANNER: false,
        },
      });
    };

    if (window.JitsiMeetExternalAPI) {
      init();
    } else {
      scriptElement = document.createElement('script');
      scriptElement.src = 'https://meet.jit.si/external_api.js';
      scriptElement.async = true;
      scriptElement.onload = init;
      document.head.appendChild(scriptElement);
    }

    return () => {
      apiRef.current?.dispose();
      if (scriptElement && document.head.contains(scriptElement)) {
        document.head.removeChild(scriptElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <Radio className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="text-white font-semibold text-sm">{event.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium text-white ${TYPE_COLORS[event.event_type] || 'bg-slate-600'}`}>
            {event.event_type}
          </span>
          {isWebinarViewer && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">👁 Viewer</span>
          )}
          {isMeetingHost && (
            <span className="text-xs bg-purple-700 text-white px-2 py-0.5 rounded-full">👑 Host</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-gray-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}