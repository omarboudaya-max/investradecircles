import React, { useState, useRef, useCallback } from 'react';
import { X, Camera, Image, Video, Type, Loader2, ChevronLeft, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';

const BG_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-orange-400 to-red-500',
  'from-green-400 to-teal-500',
  'from-yellow-400 to-orange-400',
  'from-indigo-500 to-purple-600',
];

export default function CreateStoryModal({ onClose, onCreated }) {
  const { user } = useAuth();
  const [step, setStep] = useState('select'); // 'select' | 'text' | 'preview'
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' | 'video'
  const [preview, setPreview] = useState(null);
  const [text, setText] = useState('');
  const [bgGradient, setBgGradient] = useState(BG_GRADIENTS[0]);
  const [loading, setLoading] = useState(false);
  const imageInputRef = useRef();
  const videoInputRef = useRef();
  const cameraInputRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    setPreview(URL.createObjectURL(file));
    setStep('preview');
  }, []);

  const submit = async () => {
    if (!text && !mediaFile) return;
    setLoading(true);
    let image_url = null;
    let video_url = null;
    if (mediaFile) {
      const filePath = `stories/${Date.now()}_${mediaFile.name}`;
      await supabase.storage.from('media').upload(filePath, mediaFile);
      const file_url = supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
      if (mediaType === 'video') video_url = file_url;
      else image_url = file_url;
    }
    const userData = await supabase.from('profiles').select('*').match({ id: user.id }).then(res => res.data || []);
    const profile = userData?.[0];
    await supabase.from('Story').insert({
      author_id: user.id,
      author_name: user.full_name || user.email?.split('@')[0],
      author_avatar: profile?.avatar_url || null,
      image_url,
      video_url,
      text: text || null,
      bg_gradient: !mediaFile ? bgGradient : null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      viewed_by: [],
      reactions: {},
    });
    setLoading(false);
    onCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" onClick={onClose}>
      <div className="flex-1 flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* ── STEP: SELECT ── */}
        {step === 'select' && (
          <div className="flex-1 flex flex-col bg-black text-white">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-2">
              <button onClick={onClose} className="p-2 rounded-full bg-white/10 backdrop-blur-md">
                <X className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold tracking-wide">New Story</span>
              <div className="w-9" />
            </div>

            {/* Main actions */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
              <p className="text-white/60 text-sm">Choose how to create your story</p>

              {/* Camera */}
              <button
                className="w-full flex items-center gap-4 bg-white/10 hover:bg-white/20 transition rounded-2xl px-5 py-4 backdrop-blur-md"
                onClick={() => cameraInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Camera</p>
                  <p className="text-xs text-white/60">Take a photo or video</p>
                </div>
              </button>

              {/* Gallery image */}
              <button
                className="w-full flex items-center gap-4 bg-white/10 hover:bg-white/20 transition rounded-2xl px-5 py-4 backdrop-blur-md"
                onClick={() => imageInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                  <Image className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Photo from Gallery</p>
                  <p className="text-xs text-white/60">Import a photo from your device</p>
                </div>
              </button>

              {/* Gallery video */}
              <button
                className="w-full flex items-center gap-4 bg-white/10 hover:bg-white/20 transition rounded-2xl px-5 py-4 backdrop-blur-md"
                onClick={() => videoInputRef.current?.click()}
              >
                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Video from Gallery</p>
                  <p className="text-xs text-white/60">Import a video from your device</p>
                </div>
              </button>

              {/* Text story */}
              <button
                className="w-full flex items-center gap-4 bg-white/10 hover:bg-white/20 transition rounded-2xl px-5 py-4 backdrop-blur-md"
                onClick={() => setStep('text')}
              >
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Type className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Text Story</p>
                  <p className="text-xs text-white/60">Share your thoughts with a background</p>
                </div>
              </button>
            </div>

            {/* Hidden inputs */}
            <input ref={cameraInputRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </div>
        )}

        {/* ── STEP: TEXT STORY ── */}
        {step === 'text' && (
          <div className={`flex-1 flex flex-col bg-gradient-to-br ${bgGradient}`}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <button onClick={() => setStep('select')} className="p-2 rounded-full bg-black/30">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="text-sm font-semibold text-white tracking-wide">Text Story</span>
              <button
                onClick={submit}
                disabled={!text || loading}
                className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Share'}
              </button>
            </div>

            {/* Text area */}
            <div className="flex-1 flex items-center justify-center px-6">
              <textarea
                autoFocus
                placeholder="Tap to type..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full bg-transparent text-white text-2xl font-bold text-center placeholder-white/50 outline-none resize-none text-shadow"
                rows={5}
              />
            </div>

            {/* Background picker */}
            <div className="px-4 pb-6 flex justify-center gap-3">
              <div className="flex items-center gap-2 bg-black/30 rounded-full px-3 py-2">
                <Sparkles className="w-3.5 h-3.5 text-white/70" />
                {BG_GRADIENTS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setBgGradient(g)}
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${g} border-2 transition-transform ${bgGradient === g ? 'border-white scale-110' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: PREVIEW ── */}
        {step === 'preview' && preview && (
          <div className="flex-1 flex flex-col bg-black relative">
            {/* Media */}
            <div className="flex-1 relative">
              {mediaType === 'video' ? (
                <video src={preview} autoPlay loop muted playsInline className="w-full h-full object-contain" />
              ) : (
                <img src={preview} alt="" className="w-full h-full object-contain" />
              )}

              {/* Text overlay on media */}
              {text && (
                <div className="absolute inset-x-0 bottom-24 flex justify-center px-6">
                  <div className="bg-black/60 rounded-2xl px-4 py-2 text-white text-lg font-bold text-center">
                    {text}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <button
                onClick={() => { setStep('select'); setPreview(null); setMediaFile(null); setText(''); }}
                className="p-2 rounded-full bg-black/50"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <span className="text-white text-sm font-semibold">Story Preview</span>
              <div className="w-9" />
            </div>

            {/* Caption input */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-6 pt-10">
              <div className="flex gap-3 items-center">
                <input
                  placeholder="Add a caption..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 bg-white/20 backdrop-blur-md rounded-full px-4 py-2.5 text-white text-sm placeholder-white/60 outline-none border border-white/20"
                />
                <button
                  onClick={submit}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-full bg-blue-500 text-white text-sm font-bold disabled:opacity-40 shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Share'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}